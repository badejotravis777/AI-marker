// Local server: serves the built app from dist/ and the /api/mark endpoint.
// Run `npm run build` then `npm start`, or use `npm run api` next to `npm run dev`.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load ANTHROPIC_API_KEY (and other settings) from a local .env file if there is one.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on variables already set in the shell.
}

const { markScript, status, MarkerError } = await import("./marker.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, "..", "dist");
const port = Number(process.env.PORT) || 8787;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new MarkerError(413, "The photo is too large. Take it again or choose a smaller one."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleApi(req, res) {
  if (req.method === "GET") return sendJson(res, 200, status());
  if (req.method !== "POST") return sendJson(res, 405, { error: "Use POST to mark a script." });
  try {
    const text = await readBody(req);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new MarkerError(400, "The request could not be read. Please try again.");
    }
    const result = await markScript(body, { timeoutMs: 90_000, maxRetries: 2 });
    sendJson(res, 200, result);
  } catch (error) {
    const code = error instanceof MarkerError ? error.status : 500;
    const message = error instanceof MarkerError ? error.message : "Something went wrong while marking.";
    sendJson(res, code, { error: message });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let filePath = path.resolve(distDir, "." + urlPath);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("App not built yet. Run `npm run build` first.");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/mark")) {
      handleApi(req, res);
    } else {
      serveStatic(req, res);
    }
  })
  .listen(port, () => {
    console.log(`Snap & Mark running at http://localhost:${port}`);
  });
