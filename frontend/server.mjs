import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveRequestPath } from "./serverPaths.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 5173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer((request, response) => {
  const { filePath, safe } = resolveRequestPath(root, request.url ?? "/");

  if (!safe || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`SMART-S2D prototype available at http://localhost:${port}`);
});
