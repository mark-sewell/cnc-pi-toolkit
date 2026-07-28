#!/usr/bin/env bash

source lib/common.sh
source lib/colors.sh
source lib/logging.sh
source lib/network.sh

init_logging

if wait_for_network; then
    success "Network OK"
else
    error "No network"
fi
