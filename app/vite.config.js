/* eslint-disable import/no-extraneous-dependencies */
// silence `'vite' should be listed in project's dependencies, not devDependencies`

import glob from "glob";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

// import from "path" and "fs" causes eslint to crash for some reason
const path = require("path");
const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("fs");

const TEMP_PROD_HTML_DIR = "tempHtmlFiles";

/**
 *
 * @param {"build" | "serve"} command
 * @returns {import("vite").PluginOption}
 */
function prodScriptPlugin(command) {
  return {
    name: "prod-script",
    buildStart(options) {
      if (command === "build") {
        const htmlFiles = Object.values(options.input).filter((file) =>
          file.endsWith(".html"),
        );

        for (const htmlFilePath of htmlFiles) {
          const html = readFileSync(htmlFilePath, "utf-8");

          const updatedHtml = html
            // remove vite client import
            .replace(
              /<script type="module">\s*import "http:\/\/localhost:5173\/@vite\/client";[\s\S]+?window\.process = \{ env: \{ NODE_ENV: "development" \} \};\s*<\/script>/,
              "",
            )
            // remove vite dev server url from everywhere (paths)
            .replaceAll("http://localhost:5173", "");

          writeFileSync(htmlFilePath, updatedHtml);
        }
      }
    },
    buildEnd() {
      // remove TEMP_PROD_HTML_DIR dir
      rmSync(TEMP_PROD_HTML_DIR, { recursive: true, force: true });
    },
  };
}

/**
 *
 * @param {"build" | "serve"} command
 * @returns {{ [entryAlias: string]: string }} //
 */
function htmlInputs(command) {
  const htmlFiles = glob
    .sync(path.join(__dirname, "/**/*.html"))
    .filter(
      (htmlFilePath) =>
        !htmlFilePath.includes("dist/") &&
        !htmlFilePath.includes("tempHtmlFiles/"),
    );

  return Object.fromEntries(
    htmlFiles.map((htmlFilePath) => {
      const baseName = path.basename(htmlFilePath);

      let actualHtmlFilePath = htmlFilePath;

      // handle prod build
      if (command === "build") {
        // Copy over all html files to ./tempHtmlFiles
        const htmlFileAppPath = htmlFilePath.split("/app/")[1];
        const tempProdHtmlFilePath = path.resolve(
          __dirname,
          `${TEMP_PROD_HTML_DIR}/${htmlFileAppPath}`,
        );
        const tempProdHtmlFileDir = path.dirname(tempProdHtmlFilePath);
        if (!existsSync(tempProdHtmlFileDir)) {
          mkdirSync(tempProdHtmlFileDir, { recursive: true });
        }
        copyFileSync(htmlFilePath, `${tempProdHtmlFileDir}/${baseName}`);

        // pass the path to the temp html files instead of the original to vite
        actualHtmlFilePath = htmlFilePath.replace(
          "/app/",
          `/app/${TEMP_PROD_HTML_DIR}/`,
        );
      }

      return [
        baseName.slice(0, baseName.length - path.extname(baseName).length),
        actualHtmlFilePath,
      ];
    }),
  );
}

export default defineConfig(({ command }) => ({
  appType: "mpa",
  build: {
    // include source maps if env var set to true
    sourcemap: process.env.SOURCE_MAP === "true",
    rollupOptions: {
      input: htmlInputs(command),
    },
  },
  // we want to preserve the same directory structure between / at dev time and
  // dist/ at prod time, so copy static files manually with viteStaticCopy
  // instead of using the public/ dir
  publicDir: false,
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "robots.txt", dest: "" },
        { src: "favicon.ico", dest: "" },
        { src: "images/", dest: "" },
      ],
    }),
    VitePWA({
      includeAssets: [`favicon.ico`, `images/logo/apple-touch-icon.png`],
      manifest: {
        name: "My Web App",
        short_name: "mwa",
        description: "This is a test web app",
        //
        icons: [
          {
            src: `images/logo/logo_512x512.png`,
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: `images/logo/logo_192x192.png`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: `images/logo/logo_192x192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        start_url: `index.html`,
        display: "fullscreen",
        // TODO: USE ACTUAL THEME COLORS
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
      },
    }),
    prodScriptPlugin(command),
  ],
}));
