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
    clock: document.getElementById("clock"),
    controlButton: document.getElementById("control"),
    settingsButton: document.getElementById("settings"),
    shutdownButton: document.getElementById("shutdown")
};

function setMachineState(state) {
    const normalized = String(state || "Unknown").toLowerCase();

    elements.statusLight.classList.remove("ready", "error");

    if (["idle", "run", "jog", "home"].includes(normalized)) {
        elements.statusLight.classList.add("ready");
    } else if (
        ["alarm", "door", "error", "disconnected"].includes(normalized)
    ) {
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

        elements.apiStatus.textContent = "API: Connected";
        elements.controllerStatus.textContent = "GRBL: Unavailable";

        setMachineState("Disconnected");
    }
}

function updateClock() {
    elements.clock.textContent =
        new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(new Date());
}

function restoreControlButton() {
    elements.controlButton.disabled = false;
    elements.controlButton.textContent = "▶ OpenBuilds CONTROL";
}

async function launchOpenBuilds() {
    elements.controlButton.disabled = true;
    elements.controlButton.textContent = "Opening…";

    try {
        const response = await fetch("/api/actions/openbuilds", {
            method: "POST",
            headers: {
                "X-CNC-Pi-Action": "dashboard"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "OpenBuilds launch failed");
        }

        if (data.status === "already-running") {
            elements.controlButton.textContent = "✓ Already running";
            elements.apiStatus.textContent =
                "OpenBuilds: Already running";
        } else {
            elements.controlButton.textContent = "✓ OpenBuilds launched";
            elements.apiStatus.textContent = "OpenBuilds: Launched";
        }

        window.setTimeout(restoreControlButton, 2000);
    } catch (error) {
        console.error(error);

        elements.controlButton.textContent = "✕ Launch failed";
        elements.apiStatus.textContent =
            `OpenBuilds: ${error.message}`;

        window.setTimeout(restoreControlButton, 3000);
    }
}

async function shutdownSystem() {
    const confirmed = window.confirm(
        "Shut down the CNC Pi Toolkit Raspberry Pi?"
    );

    if (!confirmed) {
        return;
    }

    elements.shutdownButton.disabled = true;
    elements.shutdownButton.textContent = "Shutting down…";
    elements.apiStatus.textContent = "System: Shutting down";

    try {
        const response = await fetch("/api/actions/shutdown", {
            method: "POST",
            headers: {
                "X-CNC-Pi-Action": "dashboard"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Shutdown failed");
        }

        elements.shutdownButton.textContent = "Powering off…";
        elements.apiStatus.textContent =
            "System: Safe shutdown in progress";
    } catch (error) {
        console.error(error);

        elements.shutdownButton.disabled = false;
        elements.shutdownButton.textContent = "⏻ Shutdown";

        window.alert(`Shutdown failed: ${error.message}`);
    }
}

/* =========================================================
   SETTINGS
   ========================================================= */

function installSettingsStyles() {
    if (document.getElementById("cnc-settings-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "cnc-settings-style";

    style.textContent = `
        .cnc-settings-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,0.80);
            backdrop-filter: blur(5px);
        }

        .cnc-settings-overlay[hidden] {
            display: none;
        }

        .cnc-settings-overlay.keyboard-open {
            align-items: flex-start;
            overflow-y: auto;
            padding-bottom: 350px;
        }

        .cnc-settings-overlay.keyboard-open .cnc-settings-panel {
            max-height: 52vh;
        }

        .cnc-settings-panel {
            width: min(760px, 96vw);
            max-height: 92vh;
            overflow-y: auto;
            padding: 22px;
            border: 1px solid #2a3941;
            border-radius: 20px;
            background: #11171b;
            color: #f3f7f9;
            box-shadow: 0 24px 70px rgba(0,0,0,0.65);
        }

        .cnc-settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 18px;
        }

        .cnc-settings-header h2 {
            margin: 0;
            font-size: 1.7rem;
        }

        .cnc-settings-close {
            min-width: 54px;
            min-height: 54px;
            border: 1px solid #3a4c55;
            border-radius: 12px;
            background: #182126;
            color: white;
            font-size: 1.6rem;
        }

        .cnc-settings-section {
            padding: 16px;
            border: 1px solid #2a3941;
            border-radius: 16px;
            background: #0b1013;
        }

        .cnc-settings-section h3 {
            margin: 0 0 14px;
            color: #32d17d;
        }

        .wifi-current {
            display: grid;
            grid-template-columns: repeat(2, minmax(0,1fr));
            gap: 10px;
            margin-bottom: 14px;
        }

        .wifi-current div {
            padding: 10px;
            border-radius: 10px;
            background: #151e23;
        }

        .wifi-label {
            display: block;
            margin-bottom: 4px;
            color: #90a0a8;
            font-size: 0.75rem;
            text-transform: uppercase;
        }

        .wifi-value {
            font-weight: 700;
        }

        .wifi-toolbar {
            margin-bottom: 14px;
        }

        .wifi-toolbar button,
        .wifi-connect-button {
            min-height: 52px;
            padding: 10px 18px;
            border: 1px solid #2f9cff;
            border-radius: 11px;
            background: #163452;
            color: white;
            font-size: 1rem;
            font-weight: 700;
        }

        .wifi-networks {
            display: grid;
            gap: 8px;
            max-height: 240px;
            overflow-y: auto;
            margin-bottom: 16px;
        }

        .wifi-network {
            width: 100%;
            display: grid;
            grid-template-columns: minmax(0,1fr) auto auto;
            align-items: center;
            gap: 10px;
            min-height: 56px;
            padding: 10px 12px;
            border: 1px solid #2a3941;
            border-radius: 11px;
            background: #151e23;
            color: #f3f7f9;
            text-align: left;
        }

        .wifi-network.selected {
            border-color: #32d17d;
            background: #153325;
        }

        .wifi-network.connected {
            box-shadow: inset 4px 0 #32d17d;
        }

        .wifi-ssid {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 700;
        }

        .wifi-signal,
        .wifi-security {
            color: #a9b7bd;
            font-size: 0.85rem;
        }

        .wifi-form {
            display: grid;
            gap: 10px;
        }

        .wifi-form label {
            color: #a9b7bd;
        }

        .wifi-form input {
            box-sizing: border-box;
            width: 100%;
            min-height: 52px;
            padding: 10px 12px;
            border: 1px solid #34464f;
            border-radius: 10px;
            background: #070b0e;
            color: white;
            font-size: 1rem;
        }

        .wifi-connect-button {
            background: linear-gradient(135deg,#18814f,#32d17d);
            border-color: #32d17d;
        }

        .wifi-message {
            min-height: 24px;
            margin-top: 12px;
            color: #90a0a8;
        }

        .wifi-message.success {
            color: #32d17d;
        }

        .wifi-message.error {
            color: #ff6b6b;
        }

        /* TOUCH KEYBOARD */

        .cnc-keyboard {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 11000;
            padding: 10px;
            background: #080c0f;
            border-top: 1px solid #34464f;
            box-shadow: 0 -15px 40px rgba(0,0,0,0.65);
        }

        .cnc-keyboard[hidden] {
            display: none;
        }

        .keyboard-row {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin: 6px 0;
        }

        .keyboard-key {
            min-width: 54px;
            min-height: 54px;
            padding: 8px 10px;
            border: 1px solid #34464f;
            border-radius: 9px;
            background: #182126;
            color: #fff;
            font-size: 1.1rem;
            font-weight: 700;
        }

        .keyboard-key:active {
            background: #2f9cff;
        }

        .keyboard-key.wide {
            min-width: 90px;
        }

        .keyboard-key.space {
            min-width: 280px;
        }

        .keyboard-key.action {
            background: #163452;
            border-color: #2f9cff;
        }

        .keyboard-key.done {
            background: #18814f;
            border-color: #32d17d;
        }

        .keyboard-key.shift-active {
            background: #2f9cff;
        }

        @media (max-width: 900px) {
            .keyboard-key {
                min-width: 45px;
                min-height: 48px;
                padding: 6px 8px;
                font-size: 1rem;
            }

            .keyboard-key.space {
                min-width: 200px;
            }
        }
    `;

    document.head.appendChild(style);
}

function createSettingsModal() {
    installSettingsStyles();

    const overlay = document.createElement("div");

    overlay.id = "settings-modal";
    overlay.className = "cnc-settings-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <div class="cnc-settings-panel">

            <div class="cnc-settings-header">
                <h2>⚙ Settings</h2>

                <button
                    id="settings-close"
                    class="cnc-settings-close"
                    type="button"
                >
                    ×
                </button>
            </div>

            <section class="cnc-settings-section">

                <h3>📶 Wi-Fi Network</h3>

                <div class="wifi-current">

                    <div>
                        <span class="wifi-label">Status</span>
                        <span id="wifi-current-status" class="wifi-value">
                            Loading…
                        </span>
                    </div>

                    <div>
                        <span class="wifi-label">Network</span>
                        <span id="wifi-current-ssid" class="wifi-value">
                            —
                        </span>
                    </div>

                    <div>
                        <span class="wifi-label">IP Address</span>
                        <span id="wifi-current-ip" class="wifi-value">
                            —
                        </span>
                    </div>

                    <div>
                        <span class="wifi-label">Interface</span>
                        <span id="wifi-interface" class="wifi-value">
                            —
                        </span>
                    </div>

                </div>

                <div class="wifi-toolbar">
                    <button id="wifi-refresh" type="button">
                        ↻ Refresh Networks
                    </button>
                </div>

                <div id="wifi-networks" class="wifi-networks">
                    Searching for networks…
                </div>

                <div class="wifi-form">

                    <label for="wifi-selected-ssid">
                        Selected network
                    </label>

                    <input
                        id="wifi-selected-ssid"
                        type="text"
                        readonly
                        placeholder="Select a network above"
                    >

                    <label for="wifi-password">
                        Wi-Fi password
                    </label>

                    <input
                        id="wifi-password"
                        type="password"
                        autocomplete="off"
                        placeholder="Tap here to enter password"
                    >

                    <button
                        id="wifi-connect"
                        class="wifi-connect-button"
                        type="button"
                    >
                        Connect
                    </button>

                </div>

                <div
                    id="wifi-message"
                    class="wifi-message"
                ></div>

            </section>
        </div>
    `;

    document.body.appendChild(overlay);

    return overlay;
}

/* =========================================================
   TOUCH KEYBOARD
   ========================================================= */

let keyboardShift = false;
let keyboardSymbols = false;
let keyboardTarget = null;

const letterRows = [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["z","x","c","v","b","n","m"]
];

const symbolRows = [
    ["1","2","3","4","5","6","7","8","9","0"],
    ["@","#","$","%","&","*","-","+","="],
    [".","_","!","?","/",":",";","(",")"]
];

function createKeyboard() {
    const keyboard = document.createElement("div");

    keyboard.id = "touch-keyboard";
    keyboard.className = "cnc-keyboard";
    keyboard.hidden = true;

    document.body.appendChild(keyboard);

    return keyboard;
}

const touchKeyboard = createKeyboard();

function keyboardKey(label, action, className = "") {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `keyboard-key ${className}`.trim();
    button.textContent = label;

    button.addEventListener("click", action);

    return button;
}

function insertKeyboardCharacter(character) {
    if (!keyboardTarget) {
        return;
    }

    const start = keyboardTarget.selectionStart ?? keyboardTarget.value.length;
    const end = keyboardTarget.selectionEnd ?? start;

    keyboardTarget.value =
        keyboardTarget.value.slice(0, start) +
        character +
        keyboardTarget.value.slice(end);

    const newPosition = start + character.length;

    keyboardTarget.setSelectionRange(
        newPosition,
        newPosition
    );

    keyboardTarget.focus();
}

function keyboardBackspace() {
    if (!keyboardTarget) {
        return;
    }

    const start = keyboardTarget.selectionStart ?? keyboardTarget.value.length;
    const end = keyboardTarget.selectionEnd ?? start;

    if (start !== end) {
        keyboardTarget.value =
            keyboardTarget.value.slice(0, start) +
            keyboardTarget.value.slice(end);

        keyboardTarget.setSelectionRange(start, start);
    } else if (start > 0) {
        keyboardTarget.value =
            keyboardTarget.value.slice(0, start - 1) +
            keyboardTarget.value.slice(start);

        keyboardTarget.setSelectionRange(
            start - 1,
            start - 1
        );
    }

    keyboardTarget.focus();
}

function renderKeyboard() {
    touchKeyboard.textContent = "";

    const rows = keyboardSymbols
        ? symbolRows
        : letterRows;

    rows.forEach((row) => {
        const rowElement = document.createElement("div");
        rowElement.className = "keyboard-row";

        row.forEach((key) => {
            let character = key;

            if (!keyboardSymbols && keyboardShift) {
                character = key.toUpperCase();
            }

            rowElement.appendChild(
                keyboardKey(character, () => {
                    insertKeyboardCharacter(character);

                    if (keyboardShift && !keyboardSymbols) {
                        keyboardShift = false;
                        renderKeyboard();
                    }
                })
            );
        });

        touchKeyboard.appendChild(rowElement);
    });

    const controlRow = document.createElement("div");
    controlRow.className = "keyboard-row";

    controlRow.appendChild(
        keyboardKey(
            keyboardSymbols ? "ABC" : "123",
            () => {
                keyboardSymbols = !keyboardSymbols;
                keyboardShift = false;
                renderKeyboard();
            },
            "wide action"
        )
    );

    if (!keyboardSymbols) {
        controlRow.appendChild(
            keyboardKey(
                "⇧",
                () => {
                    keyboardShift = !keyboardShift;
                    renderKeyboard();
                },
                keyboardShift
                    ? "wide shift-active"
                    : "wide action"
            )
        );
    }

    controlRow.appendChild(
        keyboardKey(
            "Space",
            () => insertKeyboardCharacter(" "),
            "space"
        )
    );

    controlRow.appendChild(
        keyboardKey(
            "⌫",
            keyboardBackspace,
            "wide action"
        )
    );

    touchKeyboard.appendChild(controlRow);

    const bottomRow = document.createElement("div");
    bottomRow.className = "keyboard-row";

    bottomRow.appendChild(
        keyboardKey(
            "Show / Hide",
            () => {
                if (!keyboardTarget) {
                    return;
                }

                keyboardTarget.type =
                    keyboardTarget.type === "password"
                        ? "text"
                        : "password";

                keyboardTarget.focus();
            },
            "wide action"
        )
    );

    bottomRow.appendChild(
        keyboardKey(
            "Done",
            hideKeyboard,
            "wide done"
        )
    );

    touchKeyboard.appendChild(bottomRow);
}

function showKeyboard(target) {
    keyboardTarget = target;
    keyboardShift = false;
    keyboardSymbols = false;

    renderKeyboard();

    touchKeyboard.hidden = false;

    settingsModal.classList.add("keyboard-open");

    window.setTimeout(() => {
        target.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        target.focus();
    }, 100);
}

function hideKeyboard() {
    touchKeyboard.hidden = true;

    settingsModal.classList.remove("keyboard-open");

    if (keyboardTarget) {
        keyboardTarget.type = "password";
    }

    keyboardTarget = null;
}

/* =========================================================
   WIFI
   ========================================================= */

const settingsModal = createSettingsModal();

const settingsElements = {
    close: document.getElementById("settings-close"),
    currentStatus: document.getElementById("wifi-current-status"),
    currentSsid: document.getElementById("wifi-current-ssid"),
    currentIp: document.getElementById("wifi-current-ip"),
    interface: document.getElementById("wifi-interface"),
    refresh: document.getElementById("wifi-refresh"),
    networks: document.getElementById("wifi-networks"),
    selectedSsid: document.getElementById("wifi-selected-ssid"),
    password: document.getElementById("wifi-password"),
    connect: document.getElementById("wifi-connect"),
    message: document.getElementById("wifi-message")
};

function setWifiMessage(text, type = "") {
    settingsElements.message.textContent = text;
    settingsElements.message.className = "wifi-message";

    if (type) {
        settingsElements.message.classList.add(type);
    }
}

function signalBars(signal) {
    if (signal >= 80) {
        return "▂▄▆█";
    }

    if (signal >= 60) {
        return "▂▄▆_";
    }

    if (signal >= 40) {
        return "▂▄__";
    }

    return "▂___";
}

function renderWifiNetworks(networks) {
    settingsElements.networks.textContent = "";

    if (!networks.length) {
        settingsElements.networks.textContent =
            "No Wi-Fi networks found.";
        return;
    }

    for (const network of networks) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "wifi-network";

        if (network.connected) {
            button.classList.add("connected");
        }

        const name = document.createElement("span");
        name.className = "wifi-ssid";

        name.textContent =
            network.connected
                ? `✓ ${network.ssid}`
                : network.ssid;

        const signal = document.createElement("span");
        signal.className = "wifi-signal";

        signal.textContent =
            `${signalBars(network.signal)} ${network.signal}%`;

        const security = document.createElement("span");
        security.className = "wifi-security";

        security.textContent =
            network.security || "Open";

        button.append(name, signal, security);

        button.addEventListener("click", () => {
            document
                .querySelectorAll(".wifi-network")
                .forEach((item) => {
                    item.classList.remove("selected");
                });

            button.classList.add("selected");

            settingsElements.selectedSsid.value =
                network.ssid;

            settingsElements.password.value = "";

            setWifiMessage(
                network.connected
                    ? "This network is currently connected."
                    : `Selected ${network.ssid}`
            );
        });

        settingsElements.networks.appendChild(button);
    }
}

async function loadWifiNetworks() {
    settingsElements.refresh.disabled = true;

    settingsElements.networks.textContent =
        "Searching for Wi-Fi networks…";

    setWifiMessage("");

    try {
        const response = await fetch(
            "/api/settings/wifi",
            {
                cache: "no-store",
                headers: {
                    "X-CNC-Pi-Action": "dashboard"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Unable to read Wi-Fi status"
            );
        }

        const wifi = data.wifi || {};

        settingsElements.currentStatus.textContent =
            wifi.connected
                ? "Connected"
                : "Disconnected";

        settingsElements.currentSsid.textContent =
            wifi.ssid || "—";

        settingsElements.currentIp.textContent =
            wifi.ip || "—";

        settingsElements.interface.textContent =
            wifi.interface || "—";

        renderWifiNetworks(data.networks || []);
    } catch (error) {
        console.error(error);

        settingsElements.networks.textContent =
            "Unable to scan Wi-Fi networks.";

        setWifiMessage(error.message, "error");
    } finally {
        settingsElements.refresh.disabled = false;
    }
}

async function connectWifi() {
    const ssid =
        settingsElements.selectedSsid.value.trim();

    const password =
        settingsElements.password.value;

    if (!ssid) {
        setWifiMessage(
            "Select a Wi-Fi network first.",
            "error"
        );
        return;
    }

    hideKeyboard();

    settingsElements.connect.disabled = true;
    settingsElements.refresh.disabled = true;

    setWifiMessage(`Connecting to ${ssid}…`);

    try {
        const response = await fetch(
            "/api/settings/wifi/connect",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CNC-Pi-Action": "dashboard"
                },
                body: JSON.stringify({
                    ssid,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Wi-Fi connection failed"
            );
        }

        settingsElements.password.value = "";

        setWifiMessage(
            `Connected to ${ssid}.`,
            "success"
        );

        window.setTimeout(
            loadWifiNetworks,
            1200
        );
    } catch (error) {
        console.error(error);

        setWifiMessage(
            error.message,
            "error"
        );
    } finally {
        settingsElements.connect.disabled = false;
        settingsElements.refresh.disabled = false;
    }
}

function openSettings() {
    settingsModal.hidden = false;
    document.body.style.overflow = "hidden";

    loadWifiNetworks();
}

function closeSettings() {
    hideKeyboard();

    settingsModal.hidden = true;
    document.body.style.overflow = "";

    elements.settingsButton.focus();
}


/* =========================================================
   CNC FILES
   ========================================================= */

function installFilesStyles() {
    if (document.getElementById("cnc-files-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "cnc-files-style";

    style.textContent = `
        .cnc-files-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,0.82);
            backdrop-filter: blur(5px);
        }

        .cnc-files-overlay[hidden] {
            display: none;
        }

        .cnc-files-panel {
            width: min(820px, 96vw);
            max-height: 92vh;
            overflow-y: auto;
            padding: 22px;
            border: 1px solid #2a3941;
            border-radius: 20px;
            background: #11171b;
            color: #f3f7f9;
            box-shadow: 0 24px 70px rgba(0,0,0,0.65);
        }

        .cnc-files-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 18px;
        }

        .cnc-files-header h2 {
            margin: 0;
            font-size: 1.7rem;
        }

        .cnc-files-close {
            min-width: 54px;
            min-height: 54px;
            border: 1px solid #3a4c55;
            border-radius: 12px;
            background: #182126;
            color: white;
            font-size: 1.6rem;
        }

        .cnc-files-directory {
            margin-bottom: 14px;
            padding: 10px 12px;
            border-radius: 10px;
            background: #0b1013;
            color: #90a0a8;
            font-family: monospace;
            overflow-wrap: anywhere;
        }

        .cnc-files-toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 14px;
        }

        .cnc-files-toolbar button {
            min-height: 52px;
            padding: 10px 18px;
            border: 1px solid #2f9cff;
            border-radius: 11px;
            background: #163452;
            color: white;
            font-size: 1rem;
            font-weight: 700;
        }

        .cnc-files-list {
            display: grid;
            gap: 8px;
            max-height: 430px;
            overflow-y: auto;
        }

        .cnc-file {
            width: 100%;
            display: grid;
            grid-template-columns: minmax(0,1fr) auto;
            align-items: center;
            gap: 14px;
            min-height: 64px;
            padding: 10px 14px;
            border: 1px solid #2a3941;
            border-radius: 11px;
            background: #151e23;
            color: #f3f7f9;
            text-align: left;
        }

        .cnc-file.selected {
            border-color: #32d17d;
            background: #153325;
            box-shadow: inset 4px 0 #32d17d;
        }

        .cnc-file-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 700;
            font-size: 1.05rem;
        }

        .cnc-file-info {
            color: #a9b7bd;
            font-size: 0.85rem;
            text-align: right;
        }

        .cnc-files-selected {
            min-height: 26px;
            margin-top: 16px;
            color: #a9b7bd;
        }

        .cnc-files-selected strong {
            color: #32d17d;
        }

        .cnc-files-message {
            min-height: 24px;
            margin-top: 10px;
            color: #90a0a8;
        }

        .cnc-files-message.error {
            color: #ff6b6b;
        }

        .cnc-files-message.success {
            color: #32d17d;
        }
    `;

    document.head.appendChild(style);
}


function createFilesModal() {
    installFilesStyles();

    const overlay = document.createElement("div");

    overlay.id = "files-modal";
    overlay.className = "cnc-files-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <div class="cnc-files-panel">

            <div class="cnc-files-header">
                <h2>📁 CNC Files</h2>

                <button
                    id="files-close"
                    class="cnc-files-close"
                    type="button"
                >
                    ×
                </button>
            </div>

            <div
                id="files-directory"
                class="cnc-files-directory"
            >
                /home/pi/cnc-pi-toolkit/jobs
            </div>

            <div class="cnc-files-toolbar">
                <button id="files-refresh" type="button">
                    ↻ Refresh
                </button>

                <button
                    id="files-open"
                    type="button"
                    disabled
                >
                    ▶ Open in CONTROL
                </button>

                <button
                    id="files-delete"
                    type="button"
                    disabled
                >
                    🗑 Delete
                </button>
            </div>

            <div id="files-list" class="cnc-files-list">
                Loading CNC files…
            </div>

            <div
                id="files-selected"
                class="cnc-files-selected"
            >
                No file selected
            </div>

            <div
                id="files-message"
                class="cnc-files-message"
            ></div>

        </div>
    `;

    document.body.appendChild(overlay);

    return overlay;
}


const filesModal = createFilesModal();

const filesElements = {
    button: document.getElementById("files"),
    close: document.getElementById("files-close"),
    refresh: document.getElementById("files-refresh"),
    open: document.getElementById("files-open"),
    delete: document.getElementById("files-delete"),
    list: document.getElementById("files-list"),
    directory: document.getElementById("files-directory"),
    selected: document.getElementById("files-selected"),
    message: document.getElementById("files-message")
};

let selectedCncFile = "";


function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function formatFileDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}


function setFilesMessage(text, type = "") {
    filesElements.message.textContent = text;
    filesElements.message.className = "cnc-files-message";

    if (type) {
        filesElements.message.classList.add(type);
    }
}


function renderCncFiles(files) {
    filesElements.list.textContent = "";
    selectedCncFile = "";
    filesElements.open.disabled = true;
    filesElements.delete.disabled = true;

    filesElements.selected.textContent =
        "No file selected";

    if (!files.length) {
        filesElements.list.textContent =
            "No CNC job files found.";

        return;
    }

    for (const file of files) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "cnc-file";

        const name = document.createElement("span");
        name.className = "cnc-file-name";
        name.textContent = `📄 ${file.name}`;

        const info = document.createElement("span");
        info.className = "cnc-file-info";

        info.innerHTML =
            `${formatFileSize(file.size)}<br>` +
            `${formatFileDate(file.modified)}`;

        button.append(name, info);

        button.addEventListener("click", () => {
            document
                .querySelectorAll(".cnc-file")
                .forEach((item) => {
                    item.classList.remove("selected");
                });

            button.classList.add("selected");

            selectedCncFile = file.name;
            filesElements.open.disabled = false;
            filesElements.delete.disabled = false;

            filesElements.selected.innerHTML =
                `Selected: <strong></strong>`;

            filesElements.selected
                .querySelector("strong")
                .textContent = file.name;

            setFilesMessage("");
        });

        filesElements.list.appendChild(button);
    }
}


async function loadCncFiles() {
    filesElements.refresh.disabled = true;
    filesElements.list.textContent =
        "Loading CNC files…";

    setFilesMessage("");

    try {
        const response = await fetch("/api/files", {
            cache: "no-store",
            headers: {
                "X-CNC-Pi-Action": "dashboard"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Unable to load CNC files"
            );
        }

        filesElements.directory.textContent =
            data.directory ||
            "/home/pi/cnc-pi-toolkit/jobs";

        renderCncFiles(data.files || []);
    } catch (error) {
        console.error(error);

        filesElements.list.textContent =
            "Unable to load CNC files.";

        setFilesMessage(
            error.message,
            "error"
        );
    } finally {
        filesElements.refresh.disabled = false;
    }
}




async function deleteSelectedCncFile() {
    if (!selectedCncFile) {
        setFilesMessage(
            "Select a CNC file first.",
            "error"
        );
        return;
    }

    const filename = selectedCncFile;

    const confirmed = window.confirm(
        `Delete "${filename}"?\n\n` +
        `This will permanently remove the file from CNC Jobs.`
    );

    if (!confirmed) {
        return;
    }

    filesElements.open.disabled = true;
    filesElements.delete.disabled = true;

    setFilesMessage(`Deleting ${filename}…`);

    try {
        const response = await fetch(
            "/api/files/delete",
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "X-CNC-Pi-Action": "dashboard"
                },
                body: JSON.stringify({
                    filename
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Unable to delete CNC file"
            );
        }

        selectedCncFile = "";

        await loadCncFiles();

        setFilesMessage(
            `${data.filename} deleted`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setFilesMessage(
            error.message,
            "error"
        );

        filesElements.open.disabled =
            !selectedCncFile;

        filesElements.delete.disabled =
            !selectedCncFile;
    }
}


async function openSelectedCncFile() {
    if (!selectedCncFile) {
        setFilesMessage(
            "Select a CNC file first.",
            "error"
        );
        return;
    }

    filesElements.open.disabled = true;

    setFilesMessage(
        "Opening in OpenBuilds CONTROL…"
    );

    try {
        const response = await fetch(
            "/api/files/open",
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "X-CNC-Pi-Action": "dashboard"
                },
                body: JSON.stringify({
                    filename: selectedCncFile
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error ||
                "Unable to open CNC file"
            );
        }

        setFilesMessage(
            `${data.filename} loaded into CONTROL`,
            "success"
        );

    } catch (error) {
        console.error(error);

        setFilesMessage(
            error.message,
            "error"
        );
    } finally {
        filesElements.open.disabled =
            !selectedCncFile;
    }
}


function openFiles() {
    filesModal.hidden = false;
    document.body.style.overflow = "hidden";

    loadCncFiles();
}


function closeFiles() {
    filesModal.hidden = true;
    document.body.style.overflow = "";

    filesElements.button.focus();
}


filesElements.button.addEventListener(
    "click",
    openFiles
);

filesElements.close.addEventListener(
    "click",
    closeFiles
);

filesElements.refresh.addEventListener(
    "click",
    loadCncFiles
);

filesElements.open.addEventListener(
    "click",
    openSelectedCncFile
);

filesElements.delete.addEventListener(
    "click",
    deleteSelectedCncFile
);

filesModal.addEventListener(
    "click",
    (event) => {
        if (event.target === filesModal) {
            closeFiles();
        }
    }
);

/* =========================================================
   EVENTS
   ========================================================= */

elements.controlButton.addEventListener(
    "click",
    launchOpenBuilds
);

document
    .getElementById("diagnostics")
    .addEventListener("click", () => {
        alert("Diagnostics view will be connected next.");
    });

elements.settingsButton.addEventListener(
    "click",
    openSettings
);

elements.shutdownButton.addEventListener(
    "click",
    shutdownSystem
);

settingsElements.close.addEventListener(
    "click",
    closeSettings
);

settingsElements.refresh.addEventListener(
    "click",
    loadWifiNetworks
);

settingsElements.connect.addEventListener(
    "click",
    connectWifi
);

settingsElements.password.addEventListener(
    "focus",
    () => {
        showKeyboard(settingsElements.password);
    }
);

settingsElements.password.addEventListener(
    "click",
    () => {
        showKeyboard(settingsElements.password);
    }
);

settingsModal.addEventListener(
    "click",
    (event) => {
        if (event.target === settingsModal) {
            closeSettings();
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            !touchKeyboard.hidden
        ) {
            hideKeyboard();
            return;
        }

        if (
            event.key === "Escape" &&
            !settingsModal.hidden
        ) {
            closeSettings();
        }
    }
);

updateStatus();
updateClock();

window.setInterval(updateStatus, 2000);
window.setInterval(updateClock, 1000);
