# CNC Pi Toolkit Roadmap

This roadmap outlines the planned evolution of the CNC Pi Toolkit.

---

## v0.3.0-alpha ✅

### Foundation

- Modular installer framework
- Git installation
- Node.js installation
- OpenBuilds CONTROL installation
- Diagnostics framework
- Serial device detection
- Serial I/O library
- GRBL communication framework

Status: **Complete**

---

## v0.4.0-alpha

### GRBL Integration

- Detect GRBL controller
- Read firmware version (`$I`)
- Read controller settings (`$$`)
- Read machine status (`?`)
- Unlock controller (`$X`)
- Home machine (`$H`)

Status: **Planned**

---

## v0.5.0-alpha

### CNC Management

- G-code sender
- Job monitoring
- Configuration backup
- Configuration restore
- Firmware backup
- Firmware flashing

Status: **Planned**

---

## v0.6.0-alpha

### Automation

- Hardware profiles
- Automatic updates
- Configuration wizard
- Installation profiles
- Improved diagnostics

Status: **Planned**

---

## v1.0.0

### Production Release

The goal of version 1.0.0 is to provide a complete Raspberry Pi CNC toolkit.

Features include:

- One-command installation
- Automatic dependency management
- OpenBuilds CONTROL installation
- GRBL communication
- Machine diagnostics
- Firmware management
- Documentation
- Test suite

Status: **Future Release**

---

## Long-Term Vision

A fresh Raspberry Pi should be ready for CNC with just:

```bash
git clone git@github.com:mark-sewell/cnc-pi-toolkit.git
cd cnc-pi-toolkit
./install.sh
```

The toolkit should:

- Detect the Raspberry Pi environment.
- Install all required software.
- Configure the system.
- Verify the installation.
- Detect connected CNC hardware.
- Communicate with GRBL controllers.
- Provide diagnostics and maintenance tools.
