"use strict";

const elements = {
    statusLight: document.getElementById("status-light"),
    machineTitle: document.getElementById("machine-title"),
    controller: document.getElementById("controller"),
    firmware: document.getElementById("firmware"),
    build: document.getElementById("build"),
    x: document.getElementById("x"),
    y: document.getElementById("y"),
    z: document.getElementById("z"),
    feed: document.getElementById("feed"),
    spindle: document.getElementById("spindle"),
    apiStatus: document.getElementById("api-status"),
    controllerStatus: document.getElementById("controller-status"),
    clock: document.getElementById("clock")
};

function setMachineState(state) {
    const normalized = String(state || "Unknown").toLowerCase();

    elements.statusLight.classList.remove("ready", "error");

    if (["idle", "run", "jog", "home"].includes(normalized)) {
        elements.statusLight.classList.add("ready");
    } else if (["alarm", "door", "error", "disconnected"].includes(normalized)) {
        elements.statusLight.classList.add("error");
    }

    if (normalized === "idle") {
        elements.machineTitle.textContent = "Machine Ready";
    } else if (normalized === "run") {
        elements.machineTitle.textContent = "Machine Running";
    } else if (normalized === "hold") {
        elements.machineTitle.textContent = "Machine Paused";
    } else if (normalized === "alarm") {
        elements.machineTitle.textContent = "Machine Alarm";
    } else {
        elements.machineTitle.textContent = state || "Machine Unknown";
    }
}

async function updateStatus() {
    try {
        const response = await fetch("/api/status", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Status request failed");
        }

        const machine = data.machine || {};
        const position = machine.position || {};

        elements.controller.textContent = machine.vendor || "Unknown";
        elements.firmware.textContent = machine.firmware || "Unknown";
        elements.build.textContent = machine.build || "Unknown";

        elements.x.textContent = position.x || "0.000";
        elements.y.textContent = position.y || "0.000";
        elements.z.textContent = position.z || "0.000";

        elements.feed.textContent = machine.feed || "0";
        elements.spindle.textContent = machine.spindle || "0";

        setMachineState(machine.state);

        elements.apiStatus.textContent = "API: Connected";
        elements.controllerStatus.textContent =
            `GRBL: ${machine.state || "Unknown"}`;
    } catch (error) {
        console.error(error);

        elements.apiStatus.textContent = "API: Disconnected";
        elements.controllerStatus.textContent = "GRBL: Unavailable";

        setMachineState("Disconnected");
    }
}

function updateClock() {
    elements.clock.textContent = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(new Date());
}

document.getElementById("control").onclick = () => {
    alert("OpenBuilds CONTROL launcher will be connected next.");
};

document.getElementById("diagnostics").onclick = () => {
    alert("Diagnostics view will be connected next.");
};

document.getElementById("settings").onclick = () => {
    alert("Settings view will be connected next.");
};

document.getElementById("shutdown").onclick = () => {
    alert("Shutdown action will be connected next.");
};

updateStatus();
updateClock();

setInterval(updateStatus, 2000);
setInterval(updateClock, 1000);
