# htmx-axum-template

Template for web apps using:
- htmx
- tailwindcss
- axum for server
- minijinja for templating
- vite for bundling js
- pnpm for package management
- pre-commit for linting both backend and frontend code

## How this works

Directory structure:

```
├── app             /* app/ contains the vite project and all the frontend files (html, css, js) */
├── Cargo.lock      /* top level is the rust package */
├── Cargo.toml
├── src
```

The axum server simply statically serves all files in the `app/` dir next to it at path `/`.

At development time, any changes to the static frontend src files in `app/` are immediately reflected.

At production time, simply move the `dist/` output of `vite build` to an `app/` dir next to the compiled binary.

This however introduce the following quirks:
- during development, `cargo run` must be run at the project root or the `app/` folder will not be served
- js dependency imports must import directly from `../node_modules/` since a simple static file server doesn't know how to resolve esm imports
- tailwindcss must be manually updated with `pnpm tailwind` whenever css changes are made, and the frontend files must use the build output during development time
- we cannot use vite's publicDir feature in order to preserve same directory structure at dev and prod time

## Setup

### Requirements

- [pnpm](https://pnpm.io/installation)
- [rust](https://www.rust-lang.org/tools/install)

### Install pre-commit

`./install-precommit.sh`

### Install js dependencies

`cd app && pnpm install`

## Development

### Server

`cargo run` in project root to start the development server

### CSS

On any changes to the CSS, run `pnpm tailwind` in `app/` to update

### Adding static files

Add the files to `app/`, treating it as the `/` path, then update the `viteStaticCopy` plugin in `vite.config.js` to include them.

## Production

`docker build -t my-web-app .`
