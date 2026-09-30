#!/usr/bin/env node

"use strict";

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile, spawn } = require("child_process");

const HOST = "127.0.0.1";
const PORT = 8080;

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DASHBOARD_ROOT = __dirname;
const CNC_COMMAND = path.join(PROJECT_ROOT, "cnc");
const NMCLI = "/usr/bin/nmcli";
const JOBS_ROOT = path.join(PROJECT_ROOT, "jobs");

const CNC_FILE_EXTENSIONS = new Set([
    ".gcode",
    ".gc",
    ".nc",
    ".tap",
    ".cnc"
]);


const OPENBUILDS_ROOT = path.join(
    os.homedir(),
    "OpenBuilds-CONTROL"
);

const OPENBUILDS_ELECTRON = path.join(
    OPENBUILDS_ROOT,
    "node_modules",
    ".bin",
    "electron"
);

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });

    response.end(JSON.stringify(data));
}

function actionIsAllowed(request) {
    return request.headers["x-cnc-pi-action"] === "dashboard";
}

function parseKeyValueOutput(output) {
    const result = {};

    for (const line of output.split(/\r?\n/)) {
        const separator = line.indexOf("=");

        if (separator < 1) {
            continue;
        }

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();

        result[key] = value;
    }

    if (result.mpos) {
        const [x, y, z] = result.mpos.split(",");

        result.position = {
            x: x ?? null,
            y: y ?? null,
            z: z ?? null
        };
    }

    return result;
}

function handleStatus(response) {
    execFile(
        CNC_COMMAND,
        ["status"],
        {
            cwd: PROJECT_ROOT,
            timeout: 10000,
            maxBuffer: 1024 * 1024
        },
        (error, stdout, stderr) => {
            if (error) {
                sendJson(response, 503, {
                    ok: false,
                    error: stderr.trim() || error.message
                });
                return;
            }

            sendJson(response, 200, {
                ok: true,
                timestamp: new Date().toISOString(),
                machine: parseKeyValueOutput(stdout)
            });
        }
    );
}

function openBuildsIsRunning(callback) {
    execFile(
        "pgrep",
        ["-f", OPENBUILDS_ELECTRON],
        { timeout: 2000 },
        (error, stdout) => {
            callback(!error && stdout.trim().length > 0);
        }
    );
}

function handleOpenBuilds(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    if (!fs.existsSync(OPENBUILDS_ELECTRON)) {
        sendJson(response, 503, {
            ok: false,
            error: "OpenBuilds CONTROL is not installed"
        });
        return;
    }

    openBuildsIsRunning((running) => {
        if (running) {
            sendJson(response, 200, {
                ok: true,
                status: "already-running"
            });
            return;
        }

        const userId =
            typeof process.getuid === "function"
                ? process.getuid()
                : 1000;

        const child = spawn(
            OPENBUILDS_ELECTRON,
            [OPENBUILDS_ROOT],
            {
                cwd: OPENBUILDS_ROOT,
                detached: true,
                stdio: "ignore",
                env: {
                    ...process.env,
                    DISPLAY: process.env.DISPLAY || ":0",
                    WAYLAND_DISPLAY:
                        process.env.WAYLAND_DISPLAY || "wayland-0",
                    XDG_RUNTIME_DIR:
                        process.env.XDG_RUNTIME_DIR ||
                        `/run/user/${userId}`,
                    DBUS_SESSION_BUS_ADDRESS:
                        process.env.DBUS_SESSION_BUS_ADDRESS ||
                        `unix:path=/run/user/${userId}/bus`,
                    MESA_EXTENSION_OVERRIDE:
                        "-GL_MESA_framebuffer_flip_y"
                }
            }
        );

        let completed = false;

        child.once("error", (error) => {
            if (completed) {
                return;
            }

            completed = true;

            sendJson(response, 500, {
                ok: false,
                error: error.message
            });
        });

        child.once("spawn", () => {
            if (completed) {
                return;
            }

            completed = true;
            child.unref();

            sendJson(response, 202, {
                ok: true,
                status: "launched"
            });
        });
    });
}

function handleShutdown(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    execFile(
        "/usr/bin/sudo",
        ["-n", "/usr/sbin/shutdown", "-h", "now"],
        { timeout: 5000 },
        (error, stdout, stderr) => {
            if (error) {
                sendJson(response, 500, {
                    ok: false,
                    error:
                        stderr.trim() ||
                        error.message ||
                        "Shutdown failed"
                });
                return;
            }

            sendJson(response, 200, {
                ok: true,
                status: "shutting-down"
            });
        }
    );
}

/*
 * Split nmcli terse output.
 * nmcli escapes colons with a backslash.
 */
function splitNmcliLine(line) {
    const fields = [];
    let current = "";
    let escaped = false;

    for (const char of line) {
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }

        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === ":") {
            fields.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    fields.push(current);

    return fields;
}

function findWifiInterface(callback) {
    execFile(
        NMCLI,
        [
            "-t",
            "-f",
            "DEVICE,TYPE,STATE",
            "device",
            "status"
        ],
        { timeout: 5000 },
        (error, stdout, stderr) => {
            if (error) {
                callback(
                    new Error(stderr.trim() || error.message)
                );
                return;
            }

            for (const line of stdout.split(/\r?\n/)) {
                if (!line.trim()) {
                    continue;
                }

                const [device, type, state] =
                    splitNmcliLine(line);

                if (type === "wifi") {
                    callback(null, {
                        device,
                        state
                    });
                    return;
                }
            }

            callback(
                new Error("No Wi-Fi interface found")
            );
        }
    );
}

function getWifiIpAddress(device) {
    const interfaces = os.networkInterfaces();
    const addresses = interfaces[device] || [];

    const ipv4 = addresses.find(
        (entry) =>
            entry.family === "IPv4" &&
            !entry.internal
    );

    return ipv4 ? ipv4.address : "";
}

function handleWifiStatus(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    if (!fs.existsSync(NMCLI)) {
        sendJson(response, 503, {
            ok: false,
            error: "NetworkManager nmcli is not installed"
        });
        return;
    }

    findWifiInterface((interfaceError, wifi) => {
        if (interfaceError) {
            sendJson(response, 503, {
                ok: false,
                error: interfaceError.message
            });
            return;
        }

        execFile(
            NMCLI,
            [
                "-t",
                "-f",
                "IN-USE,SSID,SIGNAL,SECURITY",
                "device",
                "wifi",
                "list",
                "ifname",
                wifi.device,
                "--rescan",
                "yes"
            ],
            {
                timeout: 15000,
                maxBuffer: 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error) {
                    sendJson(response, 500, {
                        ok: false,
                        error: stderr.trim() || error.message
                    });
                    return;
                }

                const networkMap = new Map();
                let connectedSsid = "";

                for (const line of stdout.split(/\r?\n/)) {
                    if (!line.trim()) {
                        continue;
                    }

                    const [
                        inUse,
                        ssid,
                        signalText,
                        security
                    ] = splitNmcliLine(line);

                    if (!ssid) {
                        continue;
                    }

                    const signal =
                        Number.parseInt(signalText, 10) || 0;

                    if (inUse === "*") {
                        connectedSsid = ssid;
                    }

                    const existing =
                        networkMap.get(ssid);

                    if (
                        !existing ||
                        signal > existing.signal
                    ) {
                        networkMap.set(ssid, {
                            ssid,
                            signal,
                            security: security || "Open",
                            connected: inUse === "*"
                        });
                    }
                }

                const networks =
                    Array.from(networkMap.values()).sort(
                        (a, b) => b.signal - a.signal
                    );

                sendJson(response, 200, {
                    ok: true,
                    wifi: {
                        interface: wifi.device,
                        state: wifi.state,
                        connected: Boolean(connectedSsid),
                        ssid: connectedSsid,
                        ip: getWifiIpAddress(wifi.device)
                    },
                    networks
                });
            }
        );
    });
}

function readJsonBody(request, response, callback) {
    let body = "";

    request.setEncoding("utf8");

    request.on("data", (chunk) => {
        body += chunk;

        if (body.length > 16384) {
            request.destroy();

            if (!response.headersSent) {
                sendJson(response, 413, {
                    ok: false,
                    error: "Request too large"
                });
            }
        }
    });

    request.on("end", () => {
        if (response.headersSent) {
            return;
        }

        try {
            callback(body ? JSON.parse(body) : {});
        } catch {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid JSON request"
            });
        }
    });
}

function handleWifiConnect(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    if (!fs.existsSync(NMCLI)) {
        sendJson(response, 503, {
            ok: false,
            error: "NetworkManager nmcli is not installed"
        });
        return;
    }

    readJsonBody(request, response, (data) => {
        const ssid =
            typeof data.ssid === "string"
                ? data.ssid.trim()
                : "";

        const password =
            typeof data.password === "string"
                ? data.password
                : "";

        if (!ssid) {
            sendJson(response, 400, {
                ok: false,
                error: "Wi-Fi network name is required"
            });
            return;
        }

        if (ssid.length > 32) {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid Wi-Fi network name"
            });
            return;
        }

        findWifiInterface((interfaceError, wifi) => {
            if (interfaceError) {
                sendJson(response, 503, {
                    ok: false,
                    error: interfaceError.message
                });
                return;
            }

            const args = [
                "device",
                "wifi",
                "connect",
                ssid,
                "ifname",
                wifi.device
            ];

            if (password) {
                args.push(
                    "password",
                    password
                );
            }

            execFile(
                NMCLI,
                args,
                {
                    timeout: 30000,
                    maxBuffer: 1024 * 1024
                },
                (error, stdout, stderr) => {
                    if (error) {
                        sendJson(response, 500, {
                            ok: false,
                            error:
                                stderr.trim() ||
                                error.message
                        });
                        return;
                    }

                    sendJson(response, 200, {
                        ok: true,
                        status: "connected",
                        ssid,
                        message: stdout.trim()
                    });
                }
            );
        });
    });
}


/* =========================================================
   CNC JOB FILES
   ========================================================= */


function getSafeJobPath(filename) {
    if (typeof filename !== "string" || !filename.trim()) {
        return null;
    }

    const resolvedRoot = path.resolve(JOBS_ROOT);
    const resolvedPath = path.resolve(resolvedRoot, filename.trim());

    if (
        resolvedPath === resolvedRoot ||
        !resolvedPath.startsWith(resolvedRoot + path.sep)
    ) {
        return null;
    }

    const extension = path.extname(resolvedPath).toLowerCase();

    if (!CNC_FILE_EXTENSIONS.has(extension)) {
        return null;
    }

    return resolvedPath;
}


function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Request too large"));
                request.destroy();
            }
        });

        request.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("Invalid JSON"));
            }
        });

        request.on("error", reject);
    });
}



async function handleFilesDelete(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    try {
        const body = await readJsonBody(request);
        const filePath = getSafeJobPath(body.filename);

        if (!filePath) {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid CNC filename"
            });
            return;
        }

        const stat = await fs.promises.stat(filePath);

        if (!stat.isFile()) {
            sendJson(response, 400, {
                ok: false,
                error: "Not a file"
            });
            return;
        }

        await fs.promises.unlink(filePath);

        sendJson(response, 200, {
            ok: true,
            filename: path.basename(filePath)
        });

    } catch (error) {
        if (error.code === "ENOENT") {
            sendJson(response, 404, {
                ok: false,
                error: "File not found"
            });
            return;
        }

        sendJson(response, 500, {
            ok: false,
            error: error.message
        });
    }
}



function controlApiIsReady() {
    return new Promise((resolve) => {
        const request = http.get(
            {
                hostname: "127.0.0.1",
                port: 3000,
                path: "/api/version",
                timeout: 1000
            },
            (response) => {
                response.resume();

                resolve(
                    response.statusCode >= 200 &&
                    response.statusCode < 300
                );
            }
        );

        request.on("timeout", () => {
            request.destroy();
            resolve(false);
        });

        request.on("error", () => {
            resolve(false);
        });
    });
}


function launchOpenBuildsForFiles() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(OPENBUILDS_ELECTRON)) {
            reject(
                new Error(
                    "OpenBuilds CONTROL is not installed"
                )
            );
            return;
        }

        const userId =
            typeof process.getuid === "function"
                ? process.getuid()
                : 1000;

        const child = spawn(
            OPENBUILDS_ELECTRON,
            [OPENBUILDS_ROOT],
            {
                cwd: OPENBUILDS_ROOT,
                detached: true,
                stdio: "ignore",
                env: {
                    ...process.env,
                    DISPLAY:
                        process.env.DISPLAY || ":0",
                    WAYLAND_DISPLAY:
                        process.env.WAYLAND_DISPLAY ||
                        "wayland-0",
                    XDG_RUNTIME_DIR:
                        process.env.XDG_RUNTIME_DIR ||
                        `/run/user/${userId}`,
                    DBUS_SESSION_BUS_ADDRESS:
                        process.env.DBUS_SESSION_BUS_ADDRESS ||
                        `unix:path=/run/user/${userId}/bus`,
                    MESA_EXTENSION_OVERRIDE:
                        "-GL_MESA_framebuffer_flip_y"
                }
            }
        );

        let completed = false;

        child.once("error", (error) => {
            if (completed) {
                return;
            }

            completed = true;
            reject(error);
        });

        child.once("spawn", () => {
            if (completed) {
                return;
            }

            completed = true;
            child.unref();
            resolve();
        });
    });
}


async function ensureOpenBuildsReady() {
    if (await controlApiIsReady()) {
        return;
    }

    await launchOpenBuildsForFiles();

    // CONTROL/Electron needs time to initialise its API.
    // Try every 500 ms for up to 20 seconds.
    for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => {
            setTimeout(resolve, 500);
        });

        if (await controlApiIsReady()) {
            return;
        }
    }

    throw new Error(
        "OpenBuilds CONTROL did not become ready"
    );
}


async function handleFilesOpen(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    try {
        const body = await readJsonBody(request);
        const filePath = getSafeJobPath(body.filename);

        if (!filePath) {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid CNC filename"
            });
            return;
        }

        const stat = await fs.promises.stat(filePath);

        if (!stat.isFile()) {
            throw new Error("Not a file");
        }

        // Make sure OpenBuilds CONTROL is running and
        // its local API is ready before sending the file.
        await ensureOpenBuildsReady();

        const payload = JSON.stringify({
            filename: path.basename(filePath)
        });

        const options = {
            hostname: "127.0.0.1",
            port: 3000,
            path: "/api/cnc-pi/open-file",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        };

        const controlRequest = http.request(
            options,
            (controlResponse) => {
                let data = "";

                controlResponse.on("data", (chunk) => {
                    data += chunk;
                });

                controlResponse.on("end", () => {
                    if (
                        controlResponse.statusCode < 200 ||
                        controlResponse.statusCode >= 300
                    ) {
                        sendJson(response, 502, {
                            ok: false,
                            error:
                                "OpenBuilds CONTROL rejected the file"
                        });
                        return;
                    }

                    // File has been loaded successfully.
                    // Now bring OpenBuilds CONTROL to the foreground.
                    const activateRequest = http.get(
                        {
                            hostname: "127.0.0.1",
                            port: 3000,
                            path: "/activate"
                        },
                        (activateResponse) => {
                            // Consume the response so the connection closes cleanly.
                            activateResponse.resume();

                            sendJson(response, 200, {
                                ok: true,
                                filename: path.basename(filePath)
                            });
                        }
                    );

                    activateRequest.setTimeout(3000, () => {
                        activateRequest.destroy(
                            new Error("CONTROL activation timed out")
                        );
                    });

                    activateRequest.on("error", (error) => {
                        console.error(
                            "CONTROL activate error:",
                            error.message
                        );

                        // The G-code was already loaded successfully,
                        // so report success even if window activation fails.
                        sendJson(response, 200, {
                            ok: true,
                            filename: path.basename(filePath),
                            activationWarning: error.message
                        });
                    });
                });
            }
        );

        controlRequest.setTimeout(5000, () => {
            controlRequest.destroy(
                new Error("OpenBuilds CONTROL timed out")
            );
        });

        controlRequest.on("error", (error) => {
            sendJson(response, 502, {
                ok: false,
                error:
                    "Cannot contact OpenBuilds CONTROL: " +
                    error.message
            });
        });

        controlRequest.write(payload);
        controlRequest.end();

    } catch (error) {
        sendJson(response, 404, {
            ok: false,
            error: error.message
        });
    }
}


function handleFilesList(request, response) {
    if (!actionIsAllowed(request)) {
        sendJson(response, 403, {
            ok: false,
            error: "Forbidden"
        });
        return;
    }

    fs.mkdir(JOBS_ROOT, { recursive: true }, (mkdirError) => {
        if (mkdirError) {
            sendJson(response, 500, {
                ok: false,
                error: mkdirError.message
            });
            return;
        }

        fs.readdir(
            JOBS_ROOT,
            { withFileTypes: true },
            async (readError, entries) => {
                if (readError) {
                    sendJson(response, 500, {
                        ok: false,
                        error: readError.message
                    });
                    return;
                }

                try {
                    const files = [];

                    for (const entry of entries) {
                        if (!entry.isFile()) {
                            continue;
                        }

                        const extension =
                            path.extname(entry.name).toLowerCase();

                        if (!CNC_FILE_EXTENSIONS.has(extension)) {
                            continue;
                        }

                        const filePath =
                            path.join(JOBS_ROOT, entry.name);

                        const stat =
                            await fs.promises.stat(filePath);

                        files.push({
                            name: entry.name,
                            size: stat.size,
                            modified: stat.mtime.toISOString()
                        });
                    }

                    files.sort((a, b) =>
                        a.name.localeCompare(
                            b.name,
                            undefined,
                            {
                                numeric: true,
                                sensitivity: "base"
                            }
                        )
                    );

                    sendJson(response, 200, {
                        ok: true,
                        directory: JOBS_ROOT,
                        files
                    });
                } catch (error) {
                    sendJson(response, 500, {
                        ok: false,
                        error: error.message
                    });
                }
            }
        );
    });
}

function serveStatic(requestPath, response) {
    const relativePath =
        requestPath === "/"
            ? "index.html"
            : requestPath.replace(/^\/+/, "");

    const filePath = path.resolve(
        DASHBOARD_ROOT,
        relativePath
    );

    if (
        filePath !== DASHBOARD_ROOT &&
        !filePath.startsWith(
            `${DASHBOARD_ROOT}${path.sep}`
        )
    ) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(
                error.code === "ENOENT" ? 404 : 500
            );

            response.end(
                error.code === "ENOENT"
                    ? "Not found"
                    : "Server error"
            );

            return;
        }

        const extension =
            path.extname(filePath).toLowerCase();

        response.writeHead(200, {
            "Content-Type":
                contentTypes[extension] ||
                "application/octet-stream"
        });

        response.end(data);
    });
}

const server = http.createServer(
    (request, response) => {
        let url;

        try {
            url = new URL(
                request.url,
                `http://${request.headers.host || HOST}`
            );
        } catch {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid request URL"
            });
            return;
        }

        if (
            request.method === "GET" &&
            url.pathname === "/api/status"
        ) {
            handleStatus(response);
            return;
        }

        if (
            request.method === "GET" &&
            url.pathname === "/api/files"
        ) {
            handleFilesList(request, response);
            return;
        }

        if (
            request.method === "POST" &&
            url.pathname === "/api/files/open"
        ) {
            handleFilesOpen(request, response);
            return;
        }

        if (
            request.method === "POST" &&
            url.pathname === "/api/files/delete"
        ) {
            handleFilesDelete(request, response);
            return;
        }


        if (
            request.method === "POST" &&
            url.pathname === "/api/actions/openbuilds"
        ) {
            handleOpenBuilds(request, response);
            return;
        }

        if (
            request.method === "POST" &&
            url.pathname === "/api/actions/shutdown"
        ) {
            handleShutdown(request, response);
            return;
        }

        if (
            request.method === "GET" &&
            url.pathname === "/api/settings/wifi"
        ) {
            handleWifiStatus(request, response);
            return;
        }

        if (
            request.method === "POST" &&
            url.pathname ===
                "/api/settings/wifi/connect"
        ) {
            handleWifiConnect(request, response);
            return;
        }

        if (request.method !== "GET") {
            sendJson(response, 405, {
                ok: false,
                error: "Method not allowed"
            });
            return;
        }

        try {
            serveStatic(
                decodeURIComponent(url.pathname),
                response
            );
        } catch {
            sendJson(response, 400, {
                ok: false,
                error: "Invalid request path"
            });
        }
    }
);

server.listen(PORT, HOST, () => {
    console.log(
        `CNC Pi Dashboard: http://${HOST}:${PORT}`
    );
});
