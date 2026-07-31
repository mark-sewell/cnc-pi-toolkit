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

const OPENBUILDS_ROOT = path.join(os.homedir(), "OpenBuilds-CONTROL");
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
        {
            timeout: 2000
        },
        (error, stdout) => {
            callback(!error && stdout.trim().length > 0);
        }
    );
}

function handleOpenBuilds(request, response) {
    if (request.headers["x-cnc-pi-action"] !== "dashboard") {
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
            typeof process.getuid === "function" ? process.getuid() : 1000;

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

function serveStatic(requestPath, response) {
    const relativePath =
        requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");

    const filePath = path.resolve(DASHBOARD_ROOT, relativePath);

    if (
        filePath !== DASHBOARD_ROOT &&
        !filePath.startsWith(`${DASHBOARD_ROOT}${path.sep}`)
    ) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(error.code === "ENOENT" ? 404 : 500);
            response.end(
                error.code === "ENOENT" ? "Not found" : "Server error"
            );
            return;
        }

        const extension = path.extname(filePath).toLowerCase();

        response.writeHead(200, {
            "Content-Type":
                contentTypes[extension] || "application/octet-stream"
        });

        response.end(data);
    });
}

const server = http.createServer((request, response) => {
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

    if (request.method === "GET" && url.pathname === "/api/status") {
        handleStatus(response);
        return;
    }

    if (
        request.method === "POST" &&
        url.pathname === "/api/actions/openbuilds"
    ) {
        handleOpenBuilds(request, response);
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
        serveStatic(decodeURIComponent(url.pathname), response);
    } catch {
        sendJson(response, 400, {
            ok: false,
            error: "Invalid request path"
        });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`CNC Pi Dashboard: http://${HOST}:${PORT}`);
});
