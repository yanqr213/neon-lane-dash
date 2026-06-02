const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const reports = path.join(root, "reports");
const frames = [
  path.join(reports, "mobile-smoke.png"),
  path.join(reports, "desktop-smoke.png"),
];
const outputs = [
  {
    name: "neon-lane-dash-demo.mp4",
    width: 720,
    height: 1280,
    label: "legacy vertical demo video",
  },
  {
    name: "neon-lane-dash-crazygames-landscape-video.mp4",
    width: 1920,
    height: 1080,
    label: "CrazyGames landscape preview video",
  },
  {
    name: "neon-lane-dash-crazygames-portrait-video.mp4",
    width: 720,
    height: 1080,
    label: "CrazyGames portrait preview video",
  },
];
const concatFile = path.join(reports, "demo-video-input.txt");

for (const frame of frames) {
  if (!fs.existsSync(frame)) {
    console.error("Run npm run smoke before npm run demo:video.");
    process.exit(1);
  }
}

const concat = [
  `file '${escapeForConcat(frames[0])}'`,
  "duration 4",
  `file '${escapeForConcat(frames[1])}'`,
  "duration 4",
  `file '${escapeForConcat(frames[1])}'`,
].join("\n");
fs.writeFileSync(concatFile, concat);

const generated = [];
for (const item of outputs) {
  const output = path.join(reports, item.name);
  const result = spawnSync("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-vf",
    `scale=${item.width}:${item.height}:force_original_aspect_ratio=decrease,pad=${item.width}:${item.height}:(ow-iw)/2:(oh-ih)/2:color=101820,fps=24`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ], { cwd: root, encoding: "utf8" });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  generated.push({
    label: item.label,
    output: path.relative(root, output),
    width: item.width,
    height: item.height,
    bytes: fs.statSync(output).size,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceScreenshots: frames.map((frame) => path.relative(root, frame)),
  outputs: generated,
  status: "passed",
};
fs.writeFileSync(path.join(reports, "demo-video.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Demo videos written: ${generated.map((item) => item.output).join(", ")}`);

function escapeForConcat(filePath) {
  return filePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
}
