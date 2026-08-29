const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PORT = 3000;
const ROOT = path.resolve(__dirname);

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split("?")[0].split("#")[0];
  if (reqUrl === "/") reqUrl = "/index.html";
  
  const filePath = path.normalize(path.join(ROOT, reqUrl));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n========================================`);
  console.log(`🧪 THERAPEUTIC INDEX is running live!`);
  console.log(`👉 Access URL: ${url}`);
  console.log(`========================================\n`);

  // Open default browser on Windows
  const startCmd = process.platform === "win32" ? `start ${url}` : process.platform === "darwin" ? `open ${url}` : `xdg-open ${url}`;
  exec(startCmd, (err) => {
    if (err) console.log("Please open your browser and navigate to:", url);
  });
});
