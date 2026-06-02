const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reports = path.join(root, "reports");

const submission = {
  generatedAt: new Date().toISOString(),
  game: {
    title: "Neon Lane Dash",
    shortDescription: "Switch lanes, collect neon sparks, and dodge blockers in fast 45-second arcade runs.",
    longDescription:
      "Neon Lane Dash is a lightweight HTML5 reflex game built for short browser sessions. Players move between three neon lanes, collect sparks to build combo, dodge blockers, and use a short focus ability to slow the road for a moment. It is readable in seconds, works with keyboard or touch controls, and is packaged as a standalone zero-domain browser game for platform-ad validation.",
    genre: ["Arcade", "Reflex", "Runner"],
    tags: ["html5", "arcade", "runner", "reflex", "lane", "casual", "browser", "mobile-friendly"],
    audience: "Casual browser-game players who like short reaction games, one-more-try scoring loops, and mobile-friendly controls.",
    controls: [
      "Keyboard: A/D or arrow keys to switch lanes, Space or F to use focus.",
      "Mouse or touch: tap the left and right lane buttons; tap Focus for a brief slow-road assist.",
    ],
    platforms: ["Desktop browser", "Mobile browser", "Tablet browser"],
    language: "English",
    contentRating: "Everyone / no violence / no gambling / no personal data collection",
    liveUrl: "https://neon-lane-dash.pages.dev/",
    metricsUrl: "https://neon-lane-dash.pages.dev/api/metrics",
    repository: "https://github.com/yanqr213/neon-lane-dash",
    releaseUrl: "https://github.com/yanqr213/neon-lane-dash/releases/tag/platform-submission-v1",
  },
  monetization: {
    currentState: "Standalone build has ads disabled.",
    intendedPlatformAds:
      "Rewarded placements may be used only for optional focus assist, retry, revive, or bonus time after platform approval. CrazyGames and Yandex calls are gated behind an explicit ads flag in the review build. Gameplay buttons are never disguised as monetization controls.",
    adSafety: [
      "No forced ad wall in the standalone build.",
      "No ad-engagement inducement copy.",
      "No external cash or prize reward for ad viewing.",
      "No misleading countdown or fake close buttons.",
    ],
  },
  uploadPackages: {
    distFolder: "dist/",
    itchIoZip: "reports/neon-lane-dash-html5.zip",
    releaseZip: "https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-html5.zip",
    tarGzFallback: "reports/neon-lane-dash-html5.tar.gz",
  },
  assets: {
    desktopScreenshot: "reports/desktop-smoke.png",
    mobileScreenshot: "reports/mobile-smoke.png",
    platformIcon: "reports/neon-lane-dash-icon-512.png",
    platformCover: "reports/neon-lane-dash-cover-16x9.png",
    socialCard: "reports/neon-lane-dash-social-card.png",
    demoVideo: "reports/neon-lane-dash-demo.mp4",
    releaseDemoVideo: "https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-demo.mp4",
    icon: "src/icon.svg",
  },
  platformFields: {
    crazyGames: {
      name: "Neon Lane Dash",
      description:
        "A fast three-lane reflex arcade game. Switch left or right, collect sparks, avoid blockers, and use focus to slow the road during tight moments.",
      controls: "A/D keys, arrow keys, or touch left/right buttons; Space or F for focus.",
      monetizationNote:
        "CrazyGames SDK v3 is dynamically loaded only in CrazyGames context. loadingStop, gameplayStart, and gameplayStop hooks are present. Ads are disabled by default for Basic Launch; rewarded placements are gated behind an explicit ads flag and should only be enabled after platform approval.",
      complianceNotes: [
        "Standalone and Basic Launch builds do not request ads.",
        "External submission-kit CTA is hidden in CrazyGames context.",
        "All game files use relative paths and the current package is under 500KB.",
      ],
    },
    yandexGames: {
      name: "Neon Lane Dash",
      description:
        "Short mobile-friendly lane-dodging runs with simple controls, clear scoring, and optional platform-approved rewarded assists.",
      monetizationNote: "Yandex SDK v2 is dynamically loaded only in Yandex context. LoadingAPI.ready and GameplayAPI start/stop hooks are present. showRewardedVideo and showFullscreenAdv calls are gated and disabled unless the platform context is ready and ads=1 is present.",
      complianceNotes: [
        "Standalone build does not request ads.",
        "External submission-kit CTA is hidden in platform contexts.",
        "The package is self-contained and uses relative local asset paths.",
      ],
    },
    itchIo: {
      projectName: "Neon Lane Dash",
      classification: "Game",
      kind: "HTML",
      price: "No payments",
      embeds: "Run in browser",
      upload: "reports/neon-lane-dash-html5.zip",
      coverText: "Switch lanes, collect sparks, dodge blockers.",
    },
  },
  validationGates: [
    "Build, verify, smoke, package, and submission scripts pass locally.",
    "Production Cloudflare Pages URL returns 200.",
    "Production /api/event accepts anonymous aggregate events and /api/metrics returns funnel counts.",
    "ZIP contains index.html at archive root.",
    "Desktop and mobile screenshots are nonblank.",
    "Demo video exists and is under 25 MB.",
  ],
};

fs.mkdirSync(reports, { recursive: true });
fs.writeFileSync(path.join(reports, "platform-submission.json"), `${JSON.stringify(submission, null, 2)}\n`);
fs.writeFileSync(path.join(reports, "platform-submission.md"), renderMarkdown(submission));
console.log("Platform submission pack written to reports/platform-submission.json and reports/platform-submission.md");

function renderMarkdown(data) {
  return [
    "# Neon Lane Dash Platform Submission",
    "",
    `Generated: ${data.generatedAt}`,
    "",
    "## Game",
    "",
    `Title: ${data.game.title}`,
    "",
    data.game.shortDescription,
    "",
    data.game.longDescription,
    "",
    `Live URL: ${data.game.liveUrl}`,
    "",
    `Metrics URL: ${data.game.metricsUrl}`,
    "",
    `Repository: ${data.game.repository}`,
    "",
    `Release pack: ${data.game.releaseUrl}`,
    "",
    "## Controls",
    "",
    ...data.game.controls.map((control) => `- ${control}`),
    "",
    "## Monetization",
    "",
    data.monetization.currentState,
    "",
    data.monetization.intendedPlatformAds,
    "",
    ...data.monetization.adSafety.map((rule) => `- ${rule}`),
    "",
    "## Assets",
    "",
    ...Object.entries(data.assets).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Upload Packages",
    "",
    ...Object.entries(data.uploadPackages).map(([key, value]) => `- ${key}: ${value}`),
    "",
  ].join("\n");
}
