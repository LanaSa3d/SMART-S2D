import { join, normalize, resolve } from "node:path";

export function resolveRequestPath(rootDirectory, requestUrl) {
  const rootPath = resolve(rootDirectory);
  const decodedUrl = decodeURIComponent(requestUrl);
  if (decodedUrl.includes("..")) {
    return { filePath: rootPath, safe: false };
  }

  const requestPath = new URL(requestUrl, "http://localhost").pathname;
  const relativePath = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
  const filePath = resolve(join(rootPath, relativePath));

  return {
    filePath,
    safe: filePath === rootPath || filePath.startsWith(`${normalize(rootPath)}\\`),
  };
}
