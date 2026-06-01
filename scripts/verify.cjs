const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const required = [
  "index.html",
  "styles.css",
  "game.js",
  "platform.js",
  "manifest.webmanifest",
  "icon.svg",
];

const failures = [];
for (const file of required) {
  const filePath = path.join(src, file);
  if (!fs.existsSync(filePath)) failures.push(`Missing ${file}`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size < 100) failures.push(`${file} looks too small`);
}

const html = read("src/index.html");
const css = read("src/styles.css");
const game = read("src/game.js");
const platform = read("src/platform.js");

assert(html.includes("<canvas id=\"gameCanvas\""), "Canvas is missing.");
assert(html.includes("Neon Lane Dash"), "Game name is missing.");
assert(html.includes("rel=\"canonical\""), "Canonical URL is missing.");
assert(html.includes("platform.js") && html.includes("game.js"), "Scripts are not loaded.");
assert(css.includes("@media (max-width: 620px)"), "Mobile layout rules are missing.");
assert(game.includes("requestAd(\"rewarded\""), "Rewarded ad hook is missing.");
assert(game.includes("run_start") && game.includes("run_end"), "Local event hooks are missing.");
assert(game.includes("spark_collect") && game.includes("blocker_hit"), "Core gameplay events are missing.");
assert(platform.includes("CrazyGames") && platform.includes("onUnavailable"), "Platform adapter is incomplete.");
assert(!html.toLowerCase().includes("click ads") && !game.toLowerCase().includes("click ads"), "Unsafe ad-click copy found.");

if (failures.length) {
  console.error("Verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "passed",
  files: required,
  checks: [
    "static HTML5 build",
    "canvas game surface",
    "mobile layout",
    "platform ad adapter",
    "local and remote event tracking",
    "no ad-click inducement copy",
  ],
};
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "verification.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log("Neon Lane Dash verification passed.");

function read(file) {
  const filePath = path.join(root, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
