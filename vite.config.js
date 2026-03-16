import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages for EnderPy/one-page-importer is served under /one-page-importer/
  // Keep "/" for dev so local paths behave normally.
  base: command === "build" ? "/one-page-importer/" : "/",

  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
}));
