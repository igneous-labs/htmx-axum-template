use axum::{http::StatusCode, response::Html, routing::post, Form, Router};
use minijinja::{path_loader, Environment};
use minijinja_autoreload::AutoReloader;
use serde::{Deserialize, Serialize};
use tower_http::{
    compression::Compression,
    services::{ServeDir, ServeFile},
    trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer},
};
use tracing::Level;

pub const TEMPLATE_PATH: &str = "app/templates";

fn get_reloader() -> AutoReloader {
    AutoReloader::new(|notifier| {
        let mut env = Environment::new();
        env.set_loader(path_loader(TEMPLATE_PATH));
        notifier.watch_path(TEMPLATE_PATH, true);
        Ok(env)
    })
}

pub async fn main() {
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let static_files = Compression::new(
        ServeDir::new("app") // if no files found, check your pwd to make sure it's at project root
            .fallback(ServeFile::new("app/404.html")),
    );

    let app = Router::new()
        .route("/index/name", post(name))
        .fallback_service(static_files)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        );

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Name {
    pub name: String,
}

pub async fn name(Form(mut name): Form<Name>) -> axum::response::Result<Html<String>> {
    name.name = ammonia::clean(&name.name);
    let env = get_reloader();
    let templates = env.acquire_env().unwrap();
    let template = templates.get_template("name.html").unwrap();
    let html = template
        .render(&name)
        .map_err(|_| StatusCode::from_u16(500).unwrap())?;
    Ok(html.into())
}
