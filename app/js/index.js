/* eslint-disable */

// we have to use relative imports straight from node_modules like this
// because axum is serving the static files in dev mode, not vite,
// and it knows nothing about resolving esm imports
import * as _setup from "htmx.org/dist/htmx.js";
// the import is a IIFE that sets global var `htmx`
// @ts-ignore
window.htmx = htmx;
