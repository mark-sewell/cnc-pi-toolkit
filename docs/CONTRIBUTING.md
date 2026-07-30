# Contributing

Thank you for your interest in contributing to the CNC Pi Toolkit.

## Development Workflow

The recommended workflow is:

```
Windows (VS Code)
        │
        ▼
     GitHub
        ▲
        │
 Raspberry Pi
```

- Develop on Windows.
- Commit changes frequently.
- Push to GitHub.
- Pull onto the Raspberry Pi.
- Test on real hardware.
- Push only tested code.

## Coding Standards

### Bash

Always use strict mode:

```bash
set -Eeuo pipefail
```

### Naming

Functions:

```bash
node_install()
serial_verify()
grbl_get_status()
```

Constants:

```bash
readonly NODE_VERSION="20.20.2"
```

Variables:

```bash
local version
local port
```

### Style

- Quote all variable expansions.
- Keep functions focused on one task.
- Return meaningful exit codes.
- Prefer reusable library functions over duplicated code.

## Project Structure

```
install.sh
lib/
modules/
docs/
tests/
```

### Libraries

Reusable infrastructure.

### Modules

Higher-level CNC functionality.

## Commit Messages

Examples:

```
feat(node): add Node.js installer
feat(serial): add serial detection
feat(grbl): add GRBL communication module
fix(system): improve Raspberry Pi detection
docs: update architecture
```

## Testing

Before committing:

```bash
bash -n install.sh

bash -n lib/*.sh

bash -n modules/*.sh
```

Then test on the Raspberry Pi.

## Pull Requests

- Keep changes focused.
- Update documentation when needed.
- Test before submitting.
