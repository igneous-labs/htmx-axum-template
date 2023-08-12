use axum::{http::StatusCode, response::Html, routing::post, Form, Router};
use lazy_static::lazy_static;
use minijinja::{path_loader, Environment};
use minijinja_autoreload::EnvironmentGuard;
use serde::{Deserialize, Serialize};
use tower_http::services::{ServeDir, ServeFile};

pub const TEMPLATE_PATH: &str = "app/templates";

#[cfg(feature = "dev")]
lazy_static! {
    pub static ref TEMPLATES: EnvironmentGuard<'static> = {
        let reloader = Box::new(minijinja_autoreload::AutoReloader::new(|notifier| {
            let mut env = Environment::new();
            env.set_loader(path_loader(TEMPLATE_PATH));
            notifier.watch_path(TEMPLATE_PATH, true);
            Ok(env)
        }));
        let reloader: &'static mut minijinja_autoreload::AutoReloader = Box::leak(reloader);
        reloader.acquire_env().unwrap()
    };
}

#[cfg(not(feature = "dev"))]
lazy_static! {
    pub static ref TEMPLATES: Environment<'static> = {
        let mut env = Environment::new();
        env.set_loader(path_loader(TEMPLATE_PATH));
        env
    };
}

pub async fn main() {
    let app = Router::new()
        .route("/index/name", post(name))
        .fallback_service(
            ServeDir::new("app") // if no files found, check your pwd to make sure it's at project root
                .fallback(ServeFile::new("app/404.html")),
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
    let template = TEMPLATES.get_template("name.html").unwrap();
    let html = template
        .render(&name)
        .map_err(|_| StatusCode::from_u16(500).unwrap())?;
    Ok(html.into())
}
