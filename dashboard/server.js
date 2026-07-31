#!/usr/bin/env node

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const HOST = "127.0.0.1";
const PORT = 8080;

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DASHBOARD_ROOT = __dirname;
const CNC_COMMAND = path.join(PROJECT_ROOT, "cnc");

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
            response.end(error.code === "ENOENT" ? "Not found" : "Server error");
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
    const url = new URL(request.url, `http://${request.headers.host || HOST}`);

    if (request.method === "GET" && url.pathname === "/api/status") {
        handleStatus(response);
        return;
    }

    if (request.method !== "GET") {
        sendJson(response, 405, {
            ok: false,
            error: "Method not allowed"
        });
        return;
    }

    serveStatic(decodeURIComponent(url.pathname), response);
});

server.listen(PORT, HOST, () => {
    console.log(`CNC Pi Dashboard: http://${HOST}:${PORT}`);
});
