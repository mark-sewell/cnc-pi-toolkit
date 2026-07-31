# Changelog

All notable changes to the CNC Pi Toolkit will be documented in this file.
## v0.6.0-alpha — 2026-07-31

### Added

- Local touchscreen CNC dashboard
- Automated systemd dashboard service
- Chromium kiosk launcher with health check
- Automatic Labwc kiosk configuration
- Animated Tux Plymouth boot theme
- Centred rotating gear and pulsing laser
- Automatic LightDM splash timing
- Transparent project logo
- Interactive terminal banner
- Branded installer

### Changed

- Chromium waits until the dashboard is healthy
- Dashboard service automatically restarts after failures
- Branding and dashboard setup are reproducible through `install.sh`

### Tested

- Raspberry Pi 4 Model B
- Raspberry Pi OS 12 Bookworm 32-bit
- 800×480 DSI touchscreen
- Node.js 20.20.2
- OpenBuilds CONTROL 1.0.390
- Plymouth animation and Chromium kiosk

### Pending hardware verification

- USB serial controller detection
- GRBL handshake and firmware information
- Live machine status queries

## v0.3.0-alpha

### Added

- Integrated installer workflow
- Git installation and verification module
- Node.js installation and verification module
- OpenBuilds CONTROL installation module
- Serial device detection library
- Serial I/O library
- GRBL communication framework
- Diagnostics module
- Raspberry Pi system information reporting

### Tested

- Raspberry Pi 4 Model B
- Raspberry Pi OS 12 Bookworm
- Node.js 20.20.2
- npm 10.8.2
- OpenBuilds CONTROL 1.0.390

### Pending Hardware Verification

- USB serial controller detection
- GRBL handshake
- GRBL firmware information
- Machine status queries
