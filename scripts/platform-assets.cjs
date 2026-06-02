const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const reports = path.join(root, "reports");
const svgDir = path.join(reports, "platform-svg");

const assets = [
  {
    name: "neon-lane-dash-icon-512.png",
    width: 512,
    height: 512,
    svg: iconSvg,
    label: "512x512 platform icon",
  },
  {
    name: "neon-lane-dash-cover-16x9.png",
    width: 1280,
    height: 720,
    svg: coverSvg,
    label: "1280x720 platform cover",
  },
  {
    name: "neon-lane-dash-crazygames-landscape-1920x1080.png",
    width: 1920,
    height: 1080,
    svg: coverSvg,
    label: "1920x1080 CrazyGames landscape cover",
  },
  {
    name: "neon-lane-dash-crazygames-portrait-800x1200.png",
    width: 800,
    height: 1200,
    svg: portraitCoverSvg,
    label: "800x1200 CrazyGames portrait cover",
  },
  {
    name: "neon-lane-dash-playgama-portrait-1080x1920.png",
    width: 1080,
    height: 1920,
    svg: portraitCoverSvg,
    label: "1080x1920 Playgama portrait cover",
  },
  {
    name: "neon-lane-dash-crazygames-square-800x800.png",
    width: 800,
    height: 800,
    svg: squareCoverSvg,
    label: "800x800 CrazyGames square cover",
  },
  {
    name: "neon-lane-dash-social-card.png",
    width: 1200,
    height: 630,
    svg: socialSvg,
    label: "1200x630 social preview card",
  },
];

fs.mkdirSync(reports, { recursive: true });
fs.rmSync(svgDir, { recursive: true, force: true });
fs.mkdirSync(svgDir, { recursive: true });

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const generated = [];
  for (const asset of assets) {
    const svgPath = path.join(svgDir, asset.name.replace(/\.png$/, ".svg"));
    const pngPath = path.join(reports, asset.name);
    const svg = asset.svg(asset.width, asset.height);
    fs.writeFileSync(svgPath, svg, "utf8");
    await page.setViewportSize({ width: asset.width, height: asset.height });
    await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: "load" });
    await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: asset.width, height: asset.height } });
    generated.push({
      name: asset.name,
      label: asset.label,
      path: path.relative(root, pngPath),
      width: asset.width,
      height: asset.height,
      bytes: fs.statSync(pngPath).size,
    });
  }
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    assets: generated,
  };
  fs.writeFileSync(path.join(reports, "platform-assets.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Generated ${generated.length} platform image assets.`);
}

function iconSvg(width, height) {
  return baseSvg(width, height, `
    <rect width="${width}" height="${height}" rx="64" fill="#101820"/>
    <path d="M104 430 222 82h68L408 430h-70l-24-82H198l-24 82z" fill="#f7f3e8"/>
    <path d="M214 292h84l-42-142z" fill="#34d399"/>
    <path d="M118 146h72M322 146h72M88 278h80M344 278h80" stroke="#38bdf8" stroke-width="26" stroke-linecap="round"/>
    <circle cx="256" cy="348" r="22" fill="#ff5d8f"/>
  `);
}

function coverSvg(width, height) {
  return baseSvg(width, height, `
    <rect width="${width}" height="${height}" fill="#101820"/>
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="28" fill="#172334" stroke="#31445f" stroke-width="3"/>
    <text x="92" y="126" font-size="32" font-weight="900" fill="#38bdf8">HTML5 REFLEX ARCADE</text>
    <text x="92" y="210" font-size="86" font-weight="900" fill="#f7f3e8">Neon Lane Dash</text>
    <text x="92" y="268" font-size="31" font-weight="750" fill="#b9c7d6">Switch lanes, collect sparks, dodge blockers.</text>
    ${lane(700, 430, "#38bdf8")}
    ${lane(880, 430, "#34d399")}
    ${lane(1060, 430, "#ff5d8f")}
    ${runner(880, 564)}
    ${spark(700, 438, "#38bdf8")}
    ${spark(1060, 416, "#ff5d8f")}
    ${blocker(880, 382)}
  `);
}

function portraitCoverSvg(width, height) {
  return baseSvg(width, height, `
    <rect width="${width}" height="${height}" fill="#101820"/>
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="24" fill="#172334" stroke="#31445f" stroke-width="3"/>
    <text x="${width / 2}" y="138" text-anchor="middle" font-size="27" font-weight="900" fill="#38bdf8">HTML5 REFLEX ARCADE</text>
    <text x="${width / 2}" y="238" text-anchor="middle" font-size="76" font-weight="900" fill="#f7f3e8">Neon</text>
    <text x="${width / 2}" y="322" text-anchor="middle" font-size="76" font-weight="900" fill="#f7f3e8">Lane Dash</text>
    <text x="${width / 2}" y="384" text-anchor="middle" font-size="28" font-weight="750" fill="#b9c7d6">Collect sparks. Dodge blockers.</text>
    ${lane(252, 706, "#38bdf8")}
    ${lane(400, 706, "#34d399")}
    ${lane(548, 706, "#ff5d8f")}
    ${runner(400, 916)}
    ${spark(252, 604, "#38bdf8")}
    ${spark(548, 560, "#ff5d8f")}
    ${blocker(400, 548)}
    <rect x="136" y="1030" width="528" height="78" rx="16" fill="#34d399"/>
    <text x="${width / 2}" y="1082" text-anchor="middle" font-size="31" font-weight="900" fill="#101820">Fast 45-second runs</text>
  `);
}

function squareCoverSvg(width, height) {
  return baseSvg(width, height, `
    <rect width="${width}" height="${height}" fill="#101820"/>
    <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="24" fill="#172334" stroke="#31445f" stroke-width="3"/>
    <text x="${width / 2}" y="128" text-anchor="middle" font-size="26" font-weight="900" fill="#38bdf8">REFLEX ARCADE</text>
    <text x="${width / 2}" y="220" text-anchor="middle" font-size="68" font-weight="900" fill="#f7f3e8">Neon Lane</text>
    <text x="${width / 2}" y="292" text-anchor="middle" font-size="68" font-weight="900" fill="#f7f3e8">Dash</text>
    ${lane(254, 512, "#38bdf8")}
    ${lane(400, 512, "#34d399")}
    ${lane(546, 512, "#ff5d8f")}
    ${runner(400, 650)}
    ${spark(254, 440, "#38bdf8")}
    ${blocker(546, 422)}
  `);
}

function socialSvg(width, height) {
  return baseSvg(width, height, `
    <rect width="${width}" height="${height}" fill="#101820"/>
    <rect x="54" y="54" width="${width - 108}" height="${height - 108}" rx="26" fill="#172334"/>
    <text x="92" y="132" font-size="34" font-weight="900" fill="#34d399">FREE HTML5 LANE GAME</text>
    <text x="92" y="222" font-size="84" font-weight="900" fill="#f7f3e8">Neon Lane Dash</text>
    <text x="92" y="284" font-size="30" font-weight="750" fill="#b9c7d6">Fast runs. Simple controls. One more try.</text>
    ${lane(760, 386, "#38bdf8")}
    ${lane(920, 386, "#34d399")}
    ${lane(1080, 386, "#ff5d8f")}
    ${runner(920, 502)}
    ${spark(760, 410, "#38bdf8")}
    ${blocker(1080, 396)}
    <rect x="92" y="430" width="250" height="76" rx="14" fill="#34d399"/>
    <text x="217" y="480" text-anchor="middle" font-size="30" font-weight="900" fill="#101820">Play free</text>
  `);
}

function lane(x, y, color) {
  return `
    <g>
      <line x1="${x}" y1="${y - 160}" x2="${x}" y2="${y + 210}" stroke="${color}" stroke-width="8" opacity="0.75"/>
      <line x1="${x - 42}" y1="${y - 160}" x2="${x - 42}" y2="${y + 210}" stroke="#31445f" stroke-width="3"/>
      <line x1="${x + 42}" y1="${y - 160}" x2="${x + 42}" y2="${y + 210}" stroke="#31445f" stroke-width="3"/>
    </g>
  `;
}

function runner(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <rect x="-40" y="-40" width="80" height="80" rx="18" fill="#f7f3e8" stroke="#34d399" stroke-width="7"/>
      <text x="0" y="11" text-anchor="middle" font-size="30" font-weight="900" fill="#101820">D</text>
      <circle cx="0" cy="0" r="60" fill="none" stroke="#fbbf24" stroke-width="5"/>
    </g>
  `;
}

function spark(x, y, color) {
  return `
    <g transform="translate(${x} ${y})">
      <path d="M0-42 12-12 42 0 12 12 0 42-12 12-42 0-12-12z" fill="${color}"/>
    </g>
  `;
}

function blocker(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <rect x="-40" y="-34" width="80" height="68" rx="12" fill="#f43f5e"/>
      <text x="0" y="13" text-anchor="middle" font-size="34" font-weight="900" fill="#101820">!</text>
    </g>
  `;
}

function baseSvg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>text{font-family:Arial,Helvetica,sans-serif;letter-spacing:0}</style>${body}</svg>`;
}
