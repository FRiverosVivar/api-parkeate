#!/bin/bash
set -x

# System control will return either "active" or "inactive".
npm=$(systemctl is-active npm)
if [ "$npm" == "active" ]; then
    killall node
fi
