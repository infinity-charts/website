import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const clients = new Set();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function sendReload() {
  for (const res of clients) {
    res.write("event: reload\ndata: now\n\n");
  }
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = normalize(decoded === "/" ? "/index.html" : decoded);
  const fullPath = resolve(join(root, candidate));
  return fullPath.startsWith(root) ? fullPath : null;
}

function injectReload(html) {
  const snippet = `
<script>
  new EventSource("/__reload").addEventListener("reload", () => location.reload());
</script>`;
  return html.replace("</body>", `${snippet}\n</body>`);
}

const server = createServer((req, res) => {
  if (req.url === "/__reload") {
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
    });
    res.write("\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  const path = safePath(req.url || "/");
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(path);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");

  if (ext === ".html") {
    let html = "";
    createReadStream(path, "utf8")
      .on("data", (chunk) => {
        html += chunk;
      })
      .on("end", () => {
        res.end(injectReload(html));
      })
      .on("error", () => {
        res.writeHead(500);
        res.end("Server error");
      });
    return;
  }

  createReadStream(path)
    .on("error", () => {
      res.writeHead(500);
      res.end("Server error");
    })
    .pipe(res);
});

let reloadTimer = null;
watch(root, { recursive: true }, (_event, filename) => {
  if (!filename || String(filename).startsWith(".git/")) return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(sendReload, 80);
});

server.listen(port, host, () => {
  console.log(`Serving http://${host}:${port}/ with hot reload`);
});
