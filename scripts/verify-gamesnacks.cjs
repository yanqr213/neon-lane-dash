const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist-gamesnacks");
const reports = path.join(root, "reports");
const zipPath = path.join(reports, "neon-lane-dash-gamesnacks.zip");
const failures = [];
const checks = [];

main();

function main() {
  if (!fs.existsSync(dist)) fail("dist_exists", "dist-gamesnacks is missing. Run npm run package:gamesnacks first.");
  const gameJsonPath = path.join(dist, "game.json");
  if (!fs.existsSync(gameJsonPath)) fail("game_json_exists", "game.json is missing from the GameSnacks package.");

  const gameJson = fs.existsSync(gameJsonPath) ? JSON.parse(fs.readFileSync(gameJsonPath, "utf8")) : {};
  const sources = readSources();
  const combined = Object.values(sources).join("\n");

  check("game_json_required_fields", hasRequiredGameJson(gameJson), "game.json includes name, version, description, genres, developer, marketingAssets, entrypoint, and files.");
  check("entrypoint_at_root", gameJson.entrypoint === "index.html" && fs.existsSync(path.join(dist, "index.html")), "index.html is the package entrypoint.");
  check("runtime_files_exist", runtimeFilesExist(gameJson), "Every file listed in game.json files exists and stays inside the package.");
  check("marketing_assets_not_runtime_files", !(gameJson.files || []).some((file) => file.startsWith("images/")), "Marketing images are not listed as runtime files.");
  check("marketing_assets_exist", marketingAssetsExist(gameJson), "Required GameSnacks marketing images exist with exact declared dimensions.");
  check("genres_allowed", Array.isArray(gameJson.genres) && gameJson.genres.every((genre) => ["Action", "Adventure", "Arcade", "Board", "Card", "Casino", "Educational", "Music", "Puzzle", "Racing", "Role playing", "Simulation", "Sports", "Strategy", "Trivia", "Word"].includes(genre)), "Genres use the documented GameSnacks values.");
  check("orientation_allowed", ["Any", "Landscape", "Portrait"].includes(gameJson.orientation), "Orientation uses a documented GameSnacks value.");
  check("ads_monetization_ready", gameJson.allowOfflineUse === false, "allowOfflineUse is false so the build can use ad monetization.");
  check("sdk_game_lifecycle", sources.platform.includes("firstFrameReady") && sources.platform.includes("game?.ready") && sources.platform.includes("onPause") && sources.platform.includes("onResume"), "GameSnacks game lifecycle hooks are present.");
  check("sdk_ad_interface", sources.platform.includes("ad.break") && sources.platform.includes("beforeReward") && sources.platform.includes("adViewed") && sources.platform.includes("adBreakDone"), "GameSnacks ad break and rewarded callbacks are present.");
  check("sdk_storage_interface", sources.platform.includes("storage?.getItem") && sources.platform.includes("storage?.setItem"), "GameSnacks SDK storage is used for score persistence.");
  check("sdk_audio_score_interface", sources.platform.includes("audio?.subscribe") && sources.platform.includes("score?.update"), "GameSnacks audio and score interfaces are used.");
  check("no_browser_storage", !/\b(localStorage|sessionStorage|indexedDB|cookie)\b/i.test(combined), "Package source avoids browser storage APIs banned by GameSnacks.");
  check("no_external_calls", !/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\b/i.test(combined), "Package source has no remote analytics, external API, or network call code.");
  check("no_external_urls", !/https?:\/\//i.test(combined), "Package source has no external URLs or outbound links.");
  check("no_platform_sdk_loaders", !/crazygames|yandex|playgama|gamepix|gamedistribution|adsbygoogle/i.test(combined), "GameSnacks package does not include other ad or platform SDK loaders.");
  check("first_frame_from_game_loop", sources.game.includes("signalFirstFrameReady") && sources.game.includes("requestAnimationFrame(tick)"), "First-frame signal is emitted from the game loop.");
  check("ready_from_interactive_state", sources.game.includes("signalGameReady") && sources.game.includes("showModal"), "Ready signal is emitted once the first interactive state is prepared.");
  check("zip_exists", fs.existsSync(zipPath) && fs.statSync(zipPath).size > 1000, "GameSnacks ZIP exists and is non-empty.");

  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length ? "failed" : "passed",
    zipPackage: path.relative(root, zipPath),
    zipBytes: fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0,
    checks,
    failures,
    officialRequirementsCovered: [
      "bundle contains game code, marketing assets, and game.json",
      "GameSnacks SDK game, ad, audio, score, and storage interfaces are wired",
      "no localStorage/sessionStorage/IndexedDB/cookie usage",
      "no external server calls or links",
      "marketing images meet declared minimum dimensions",
    ],
  };
  fs.mkdirSync(reports, { recursive: true });
  fs.writeFileSync(path.join(reports, "gamesnacks-verification.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (failures.length) {
    console.error("GameSnacks verification failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log("Neon Lane Dash GameSnacks verification passed.");
}

function readSources() {
  const result = {};
  for (const file of ["index.html", "styles.css", "platform.js", "game.js", "game.json"]) {
    const filePath = path.join(dist, file);
    result[file.replace(".", "_")] = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  }
  result.platform = result.platform_js || "";
  result.game = result.game_js || "";
  return result;
}

function hasRequiredGameJson(gameJson) {
  return Boolean(
    gameJson.name &&
      gameJson.version &&
      gameJson.description &&
      Array.isArray(gameJson.genres) &&
      gameJson.genres.length &&
      gameJson.developer?.name &&
      gameJson.developer?.logo &&
      gameJson.marketingAssets &&
      gameJson.entrypoint &&
      Array.isArray(gameJson.files)
  );
}

function runtimeFilesExist(gameJson) {
  if (!Array.isArray(gameJson.files) || !gameJson.files.length) return false;
  return gameJson.files.every((file) => {
    const normalized = file.replaceAll("\\", "/");
    if (normalized.includes("..") || path.isAbsolute(normalized)) return false;
    return fs.existsSync(path.join(dist, normalized));
  });
}

function marketingAssetsExist(gameJson) {
  const assets = gameJson.marketingAssets || {};
  const required = [
    ["horizontalBanners", 1],
    ["verticalBanners", 1],
    ["screenshots", 3],
    ["gameIcons", 1],
  ];
  for (const [key, minimum] of required) {
    if (!Array.isArray(assets[key]) || assets[key].length < minimum) return false;
    for (const asset of assets[key]) {
      if (!asset.src || !asset.size?.width || !asset.size?.height) return false;
      const filePath = path.join(dist, asset.src);
      if (!fs.existsSync(filePath)) return false;
      const dimensions = pngDimensions(filePath);
      if (dimensions.width !== asset.size.width || dimensions.height !== asset.size.height) return false;
      if (fs.statSync(filePath).size < 5000) return false;
    }
  }
  return true;
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${path.basename(filePath)} is not a PNG image.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function check(id, passed, evidence) {
  checks.push({ id, passed: Boolean(passed), evidence });
  if (!passed) failures.push(`${id}: ${evidence}`);
}

function fail(id, evidence) {
  check(id, false, evidence);
}
