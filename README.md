# CNC Pi Toolkit

A modular toolkit for preparing and managing a Raspberry Pi as a CNC control system.

The toolkit automates software installation, system verification, diagnostics and communication with GRBL-based CNC controllers.

---

# Features

## System

- Raspberry Pi detection
- Raspberry Pi OS detection
- System information
- Hardware diagnostics

## Software

- Git installation and verification
- Node.js installation and verification
- OpenBuilds CONTROL installation
- Automatic dependency management

## CNC

- Serial device detection
- Serial I/O library
- GRBL communication framework
- System diagnostics

---

# Project Structure

```
cnc-pi-toolkit/
│
├── docs/
├── lib/
├── modules/
├── tests/
│
├── install.sh
├── README.md
├── LICENSE
└── Makefile
```

---

# Quick Start

Clone the repository:

```bash
git clone git@github.com:mark-sewell/cnc-pi-toolkit.git
cd cnc-pi-toolkit
```

Run the installer:

```bash
chmod +x install.sh
./install.sh
```

The installer will:

- Detect the Raspberry Pi
- Verify the operating system
- Install Git
- Install Node.js
- Install OpenBuilds CONTROL
- Run diagnostics

---

# Diagnostics

Example output:

```text
=================================
 CNC Pi Toolkit Diagnostics
=================================

System
------
✓ Raspberry Pi 4
✓ Raspberry Pi OS Bookworm

Software
--------
✓ Git
✓ Node.js
✓ OpenBuilds CONTROL

Hardware
--------
⚠ No serial devices detected
⚠ No GRBL controller detected

Overall
-------
Software Ready
Hardware Pending
```

---

# Current Status

Current release:

**v0.3.0-alpha**

Completed:

- Modular installer framework
- Git installer
- Node.js installer
- OpenBuilds CONTROL installer
- Serial detection
- Serial I/O
- GRBL framework
- Diagnostics

---

# Roadmap

## v0.4.0-alpha

- GRBL handshake
- Read firmware version
- Machine status
- Controller settings

## v0.5.0-alpha

- Firmware management
- Configuration backup
- G-code sender

See:

```
docs/ROADMAP.md
```

---

# Documentation

Additional documentation is available in:

```
docs/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── ROADMAP.md
```

---

# Supported Platform

Currently tested on:

- Raspberry Pi 4 Model B
- Raspberry Pi OS 12 (Bookworm)

---

# License

Released under the MIT License.

See:

```
LICENSE
```
