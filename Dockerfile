# vite build
FROM node:18-alpine3.18 as vite
WORKDIR /app
RUN npm install -g pnpm

FROM vite as npm-installer
COPY app/pnpm-lock.yaml .
COPY app/package.json .
RUN pnpm install

FROM vite as frontend-builder
COPY --from=npm-installer app/node_modules ./node_modules
COPY app .
RUN pnpm build

# rust build
FROM rust:1.71.0-alpine3.18 as chef
WORKDIR /server
# musl-dev required for cargo-chef
RUN apk add --no-cache musl-dev
RUN cargo install cargo-chef

FROM chef as planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef as builder
COPY --from=planner /server/recipe.json recipe.json
# build and cache deps
RUN cargo chef cook --release --no-default-features --target x86_64-unknown-linux-musl --recipe-path recipe.json
COPY . .
RUN cargo build --release --no-default-features --target x86_64-unknown-linux-musl --bin my-web-app

# prod image
FROM scratch
WORKDIR /
COPY --from=builder /server/target/x86_64-unknown-linux-musl/release/my-web-app /my-web-app
COPY --from=frontend-builder /app/dist /app
CMD ["/my-web-app"]
