#!/usr/bin/env bash
#
# CNC Pi Toolkit
# Terminal color library
#
# Copyright (c) 2026 Mark Sewell
# Licensed under the MIT License.

#------------------------------------------------------------------------------
# Colour support
#------------------------------------------------------------------------------

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
    if [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
        readonly RESET="$(tput sgr0)"
        readonly BOLD="$(tput bold)"

        readonly BLACK="$(tput setaf 0)"
        readonly RED="$(tput setaf 1)"
        readonly GREEN="$(tput setaf 2)"
        readonly YELLOW="$(tput setaf 3)"
        readonly BLUE="$(tput setaf 4)"
        readonly MAGENTA="$(tput setaf 5)"
        readonly CYAN="$(tput setaf 6)"
        readonly WHITE="$(tput setaf 7)"
    fi
fi

# No colour terminal
: "${RESET:=}"
: "${BOLD:=}"

: "${BLACK:=}"
: "${RED:=}"
: "${GREEN:=}"
: "${YELLOW:=}"
: "${BLUE:=}"
: "${MAGENTA:=}"
: "${CYAN:=}"
: "${WHITE:=}"

#------------------------------------------------------------------------------
# Output functions
#------------------------------------------------------------------------------

info() {
    printf "%s[INFO]%s %s\n" "$BLUE" "$RESET" "$*"
}

success() {
    printf "%s[SUCCESS]%s %s\n" "$GREEN" "$RESET" "$*"
}

warning() {
    printf "%s[WARNING]%s %s\n" "$YELLOW" "$RESET" "$*"
}

error() {
    printf "%s[ERROR]%s %s\n" "$RED" "$RESET" "$*" >&2
}

headline() {
    printf "\n%s%s%s\n" "$BOLD" "$*" "$RESET"
}

separator() {
    printf '%*s\n' 60 '' | tr ' ' '-'
}

