#!/usr/bin/env node
/**
 * Smoke test for the By Adunni MCP server.
 * Spawns the compiled server, drives it over stdio with real MCP
 * JSON-RPC messages, and asserts on the responses. Run with:
 *   node test/smoke-test.mjs
 * (after `npm run build`)
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "dist", "index.js");

const requests = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke-test", version: "1.0.0" } } },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_product_info", arguments: { productId: "prod_001" } } },
  { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_product_info", arguments: { collection: "Evening" } } },
  { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "check_order_status", arguments: { orderId: "order_1002" } } },
  { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "check_order_status", arguments: { orderId: "order_9999" } } },
];

const child = spawn("node", [serverPath]);
let buffer = "";
const responses = new Map();

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined) responses.set(msg.id, msg);
  }
});

child.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

for (const req of requests) {
  child.stdin.write(JSON.stringify(req) + "\n");
}

setTimeout(() => {
  child.stdin.end();
  let failures = 0;

  function check(id, label, predicate) {
    const res = responses.get(id);
    const ok = res && predicate(res);
    console.log(`${ok ? "✅" : "❌"} [${id}] ${label}`);
    if (!ok) failures++;
  }

  check(2, "tools/list returns both tools", (res) => {
    const names = res.result?.tools?.map((t) => t.name) ?? [];
    return names.includes("get_product_info") && names.includes("check_order_status");
  });

  check(3, "get_product_info by productId returns the right product", (res) => {
    const text = res.result?.content?.[0]?.text ?? "";
    return text.includes("Adaeze Beaded Clutch") && text.includes("\"price\": 85");
  });

  check(4, "get_product_info by collection filters correctly", (res) => {
    const text = res.result?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length === 2 && parsed.every((p) => p.collection === "Evening");
  });

  check(5, "check_order_status resolves nested product details", (res) => {
    const text = res.result?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    return parsed.status === "processing" && parsed.items[0].product.name === "Ronke Beaded Crossbody";
  });

  check(6, "check_order_status returns isError for unknown order", (res) => {
    return res.result?.isError === true;
  });

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  child.kill();
  process.exit(failures === 0 ? 0 : 1);
}, 1500);
