const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

for (const file of ["functions/api/event.js", "functions/api/metrics.js", "wrangler.toml"]) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

const eventApi = read("functions/api/event.js");
const metricsApi = read("functions/api/metrics.js");
const platform = read("src/platform.js");
const game = read("src/game.js");
const wrangler = read("wrangler.toml");

for (const event of ["page_view", "run_start", "lane_shift", "spark_collect", "shield_collect", "blocker_hit", "focus_used", "run_end", "cta_click"]) {
  if (!eventApi.includes(`"${event}"`)) failures.push(`Event API missing ${event}`);
  if (!metricsApi.includes(`"${event}"`)) failures.push(`Metrics API missing ${event}`);
}
if (!wrangler.includes("binding = \"NLD_EVENTS\"")) failures.push("wrangler.toml missing NLD_EVENTS binding.");
if (!platform.includes("sendRemoteEvent")) failures.push("platform.js missing remote event sender.");
if (!platform.includes("navigator.sendBeacon")) failures.push("platform.js missing sendBeacon path.");
if (!platform.includes("page_view")) failures.push("platform.js missing page_view event.");
if (!game.includes("spark_collect") || !game.includes("blocker_hit")) failures.push("game.js missing gameplay outcome events.");
if (!game.includes("cta_click")) failures.push("game.js missing CTA event.");

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  checks: [
    "Cloudflare KV binding",
    "event collector function",
    "metrics function",
    "remote browser event sender",
    "gameplay outcome events",
    "CTA event",
  ],
  failures,
};
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "analytics-verification.json"), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Neon Lane Dash analytics verification passed.");

function read(file) {
  const filePath = path.join(root, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}
