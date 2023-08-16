#!/bin/sh

trap on_ctrl_c INT

PROJECT_ROOT=$(dirname $(readlink -f "$0"))

unset -v TAILWIND_WATCH_PID

on_ctrl_c() {
    if [ ! -z ${TAILWIND_WATCH_PID+x} ]; then
        echo "killing tailwind-watch"
        kill -s INT $TAILWIND_WATCH_PID
    fi
    exit
}

cd $PROJECT_ROOT/app && pnpm tailwind-watch &
TAILWIND_WATCH_PID=$!

cd $PROJECT_ROOT && cargo run dev
