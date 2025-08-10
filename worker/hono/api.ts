import { Hono } from "hono";

export const app = new Hono<{Bindings: Env}>();

app.get("/api/", (c) => {
  return c.json({
    name: "Cloudflare (with Hono)",
  });
});
