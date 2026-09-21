"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

http.createServer((req, res) => {
  let pathname = decodeURIComponent(String(req.url || "/").split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  const file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep)) { res.statusCode = 403; return res.end("Forbidden"); }
  fs.readFile(file, (error, data) => {
    if (error) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
}).listen(4173, "127.0.0.1", () => console.log("E2E server listening on http://127.0.0.1:4173"));
