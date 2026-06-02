const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const out = path.join(root, "dist-gamesnacks");
const imageDir = path.join(out, "images");
const reports = path.join(root, "reports");
const zipPath = path.join(reports, "neon-lane-dash-gamesnacks.zip");
const runtimeFiles = ["index.html", "styles.css", "platform.js", "game.js"];
const marketingFiles = [
  ["neon-lane-dash-icon-512.png", "neon-lane-dash-icon-512.png"],
  ["neon-lane-dash-crazygames-landscape-1920x1080.png", "neon-lane-dash-horizontal-1920x1080.png"],
  ["neon-lane-dash-playgama-portrait-1080x1920.png", "neon-lane-dash-vertical-1080x1920.png"],
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(reports, { recursive: true });

  writeIndex();
  writeStyles();
  writeGame();
  fs.writeFileSync(path.join(out, "platform.js"), gameSnacksPlatform(), "utf8");
  copyMarketingAssets();
  await captureScreenshots();
  writeGameJson();

  const files = listFiles(out).sort();
  fs.writeFileSync(zipPath, buildZip(out, files));

  const report = {
    generatedAt: new Date().toISOString(),
    status: "passed",
    buildDir: path.relative(root, out),
    zipPackage: path.relative(root, zipPath),
    zipBytes: fs.statSync(zipPath).size,
    runtimeFiles,
    gameJson: path.relative(root, path.join(out, "game.json")),
    uploadNotes: [
      "Upload this ZIP only to GameSnacks or a GameSnacks-compatible review flow.",
      "The package replaces all external portal adapters with a GameSnacks-only SDK adapter.",
      "It contains no localStorage, remote analytics, external links, adsbygoogle injection, or third-party SDK loaders.",
      "Reward assist is only granted after the rewarded ad viewed callback.",
    ],
  };
  fs.writeFileSync(path.join(reports, "gamesnacks-package.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`GameSnacks package written to ${path.relative(root, zipPath)}`);
}

function writeStyles() {
  let css = fs.readFileSync(path.join(src, "styles.css"), "utf8");
  css = css.replace(
    /\n\.platform-crazygames \.external-tool-link,\n\.platform-yandex \.external-tool-link,\n\.platform-playgama \.external-tool-link,\n\.platform-gamepix \.external-tool-link,\n\.platform-gamedistribution \.external-tool-link,\n\.platform-gamesnacks \.external-tool-link \{\n\s*display: none;\n\}/,
    ""
  );
  fs.writeFileSync(path.join(out, "styles.css"), css, "utf8");
}

function writeGame() {
  let game = fs.readFileSync(path.join(src, "game.js"), "utf8");
  game = game.replace(
    /const provider = window\.NeonLanePlatform\.state\.provider;\s*\n\s*const firstStart = !state\.over && state\.score === 0;\s*\n\s*if \(firstStart && provider !== "gamedistribution"\) return false;\s*/,
    "const firstStart = !state.over && state.score === 0;\n    if (firstStart) return false;\n"
  );
  fs.writeFileSync(path.join(out, "game.js"), game, "utf8");
}

function writeIndex() {
  let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
  html = html.replace(/\s*<link rel="canonical" href="[^"]+">/, "");
  html = html.replace(/\s*<link rel="manifest" href="[^"]+">/, "");
  html = html.replace(
    /(<strong>Zero-domain monetization test<\/strong>\s*)<span>[\s\S]*?<\/span>/,
    "$1<span>GameSnacks review build. Ads, storage, audio, and lifecycle events use the GameSnacks SDK.</span>"
  );
  html = html.replace(/\s*<a class="external-tool-link"[\s\S]*?<\/a>/, "");
  fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
}

function copyMarketingAssets() {
  for (const [source, target] of marketingFiles) {
    const sourcePath = path.join(reports, source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing ${source}. Run npm run assets:platform before npm run package:gamesnacks.`);
    }
    fs.copyFileSync(sourcePath, path.join(imageDir, target));
  }
}

async function captureScreenshots() {
  const server = await serve(out);
  const url = `http://127.0.0.1:${server.port}/index.html`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(gameSnacksStub);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(imageDir, "neon-lane-dash-gamesnacks-screenshot-1.png"), fullPage: false });
  await page.click("#modalPrimary");
  await page.waitForTimeout(900);
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(imageDir, "neon-lane-dash-gamesnacks-screenshot-2.png"), fullPage: false });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(imageDir, "neon-lane-dash-gamesnacks-screenshot-3.png"), fullPage: false });
  const colored = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 64) {
      if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) count += 1;
    }
    return count;
  });
  await browser.close();
  await new Promise((resolve) => server.instance.close(resolve));
  if (colored < 100) throw new Error(`GameSnacks screenshot canvas looks blank; sampled ${colored} colored pixels.`);
}

function writeGameJson() {
  const image = (width, height, srcPath) => ({
    size: { width, height },
    src: srcPath,
  });
  const gameJson = {
    name: "Neon Lane Dash",
    version: "1.0.0-gamesnacks.1",
    description: "Switch lanes, collect sparks, dodge blockers, and survive fast 45-second arcade runs.",
    genres: ["Arcade", "Action"],
    developer: {
      name: "PrintableTools Lab",
      logo: [image(512, 512, "images/neon-lane-dash-icon-512.png")],
    },
    publisher: {
      name: "PrintableTools Lab",
      logo: [image(512, 512, "images/neon-lane-dash-icon-512.png")],
    },
    marketingAssets: {
      horizontalBanners: [image(1920, 1080, "images/neon-lane-dash-horizontal-1920x1080.png")],
      verticalBanners: [image(1080, 1920, "images/neon-lane-dash-vertical-1080x1920.png")],
      screenshots: [
        image(1920, 1080, "images/neon-lane-dash-gamesnacks-screenshot-1.png"),
        image(1920, 1080, "images/neon-lane-dash-gamesnacks-screenshot-2.png"),
        image(1920, 1080, "images/neon-lane-dash-gamesnacks-screenshot-3.png"),
      ],
      gameIcons: [image(512, 512, "images/neon-lane-dash-icon-512.png")],
    },
    allowOfflineUse: false,
    entrypoint: "index.html",
    files: runtimeFiles,
    orientation: "Any",
    supportsLowEndDevices: true,
  };
  fs.writeFileSync(path.join(out, "game.json"), `${JSON.stringify(gameJson, null, 2)}\n`, "utf8");
}

function gameSnacksPlatform() {
  return `(function () {
  const state = { ready: false, provider: "gamesnacks", sdk: null };
  let firstFrameSent = false;
  let readySent = false;

  function init() {
    if (state.ready) return Promise.resolve(state);
    state.sdk = window.GameSnacks || null;
    if (!state.sdk) return Promise.resolve(state);
    state.ready = true;
    try {
      state.sdk.game?.onPause?.(() => window.dispatchEvent(new CustomEvent("nld:platform-pause")));
      state.sdk.game?.onResume?.(() => window.dispatchEvent(new CustomEvent("nld:platform-resume")));
      state.sdk.audio?.subscribe?.((enabled) => {
        window.dispatchEvent(new CustomEvent(enabled ? "nld:platform-audio-on" : "nld:platform-audio-off"));
      });
    } catch {
      // GameSnacks callbacks are best-effort in local preview.
    }
    return Promise.resolve(state);
  }

  function requestAd(kind, callbacks = {}) {
    return init().then(() => new Promise((resolve) => {
      if (!state.sdk?.ad?.break) {
        callbacks.onUnavailable?.({ provider: state.provider, kind });
        resolve(false);
        return;
      }
      let settled = false;
      let rewarded = kind !== "rewarded";
      const finish = () => {
        if (settled) return;
        settled = true;
        callbacks.onFinish?.();
        resolve(Boolean(rewarded));
      };
      const timeout = setTimeout(finish, kind === "rewarded" ? 120000 : 90000);
      const settle = () => {
        clearTimeout(timeout);
        finish();
      };
      try {
        state.sdk.ad.break({
          type: kind === "rewarded" ? "reward" : "next",
          name: kind === "rewarded" ? "focus_assist" : "run_break",
          beforeReward: (showAdFn) => {
            callbacks.onStart?.();
            if (typeof showAdFn === "function") showAdFn();
          },
          beforeAd: () => callbacks.onStart?.(),
          afterAd: settle,
          adViewed: () => {
            rewarded = true;
            callbacks.onRewarded?.();
          },
          adDismissed: () => {
            rewarded = false;
          },
          adBreakDone: settle,
        });
      } catch (error) {
        clearTimeout(timeout);
        callbacks.onError?.(error);
        resolve(false);
      }
    }));
  }

  function gameplayStart() {
    return init().then(() => {
      signalGameReady();
      return true;
    });
  }

  function gameplayStop() {
    return init().then(() => true);
  }

  function track(eventName, payload = {}) {
    if (eventName !== "run_end") return;
    try {
      const score = Math.max(0, Number(payload.score || 0));
      state.sdk?.score?.update?.(score);
      state.sdk?.game?.gameOver?.();
      if (score > 0) state.sdk?.game?.levelComplete?.(1);
    } catch {
      // GameSnacks telemetry is best-effort.
    }
  }

  function getStoredBestScore(key) {
    return init().then(() => {
      try {
        const value = state.sdk?.storage?.getItem?.(key);
        return Math.max(0, Number(value || 0));
      } catch {
        return 0;
      }
    });
  }

  function setStoredBestScore(key, value) {
    return init().then(() => {
      try {
        state.sdk?.storage?.setItem?.(key, String(Math.max(0, Number(value) || 0)));
        return true;
      } catch {
        return false;
      }
    });
  }

  function adsAllowed() {
    return Boolean(state.ready && state.sdk?.ad?.break);
  }

  function signalFirstFrameReady() {
    if (firstFrameSent) return false;
    firstFrameSent = true;
    try {
      state.sdk?.game?.firstFrameReady?.();
      return true;
    } catch {
      return false;
    }
  }

  function signalGameReady() {
    if (readySent) return false;
    readySent = true;
    try {
      state.sdk?.game?.ready?.();
      return true;
    } catch {
      return false;
    }
  }

  window.NeonLanePlatform = {
    init,
    requestAd,
    gameplayStart,
    gameplayStop,
    getStoredBestScore,
    setStoredBestScore,
    adsAllowed,
    track,
    signalFirstFrameReady,
    signalGameReady,
    state,
  };
  setTimeout(() => init(), 0);
})();\n`;
}

function gameSnacksStub() {
  window.GameSnacks = {
    ad: {
      break(options) {
        if (options.beforeReward) options.beforeReward(() => {
          if (options.adViewed) options.adViewed();
          if (options.adBreakDone) options.adBreakDone({ breakStatus: "viewed" });
        });
        if (options.beforeAd) options.beforeAd();
        if (options.afterAd) options.afterAd();
        if (options.adBreakDone) options.adBreakDone({ breakStatus: "done" });
      },
    },
    audio: {
      isEnabled: () => true,
      subscribe: () => {},
    },
    game: {
      firstFrameReady: () => {},
      ready: () => {},
      onPause: () => {},
      onResume: () => {},
      gameOver: () => {},
      levelComplete: () => {},
    },
    score: {
      update: () => {},
    },
    storage: {
      values: {},
      getItem(key) {
        return this.values[key] ?? null;
      },
      setItem(key, value) {
        this.values[key] = String(value);
      },
      removeItem(key) {
        delete this.values[key];
      },
      clear() {
        this.values = {};
      },
    },
  };
}

function serve(directory) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url, "http://127.0.0.1");
      const relative = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname).replace(/^\/+/, "");
      const filePath = path.resolve(directory, relative);
      if (!filePath.startsWith(directory)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }
        response.writeHead(200, { "Content-Type": contentType(filePath) });
        response.end(data);
      });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({ instance: server, port: server.address().port });
    });
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

function listFiles(dir, prefix = "") {
  const found = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(dir, relative));
    else found.push(relative);
  }
  return found;
}

function buildZip(base, files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.replaceAll("\\", "/"));
    const data = fs.readFileSync(path.join(base, file));
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralDir = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDir, end]);
}

function crc32(buffer) {
  const table = crcTable();
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function crcTable() {
  if (crcTable.cache) return crcTable.cache;
  const table = [];
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table.push(value >>> 0);
  }
  crcTable.cache = table;
  return table;
}
