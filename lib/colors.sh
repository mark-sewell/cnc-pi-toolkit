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
        RESET="$(tput sgr0)"
        BOLD="$(tput bold)"

        BLACK="$(tput setaf 0)"
        RED="$(tput setaf 1)"
        GREEN="$(tput setaf 2)"
        YELLOW="$(tput setaf 3)"
        BLUE="$(tput setaf 4)"
        MAGENTA="$(tput setaf 5)"
        CYAN="$(tput setaf 6)"
        WHITE="$(tput setaf 7)"

        readonly RESET BOLD
        readonly BLACK RED GREEN YELLOW
        readonly BLUE MAGENTA CYAN WHITE
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

