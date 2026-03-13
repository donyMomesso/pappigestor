declare const require: any;

import { Hono } from "hono";

const { cors } = require("hono/cors");

const app = new Hono().basePath("/api");

app.use("*", cors());

export default app;
