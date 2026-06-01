# Operations

## Immediate Goal

Validate a zero-domain, no-sales monetization path by making Neon Lane Dash good enough for HTML5 game platform review.

## Submission Checklist

1. Run `npm.cmd run build`.
2. Run `npm.cmd run verify`.
3. Run `npm.cmd run verify:analytics`.
4. Run `npm.cmd run verify:crazygames`.
5. Run `npm.cmd run smoke`.
6. Run `npm.cmd run assets:platform`.
7. Run `npm.cmd run verify:assets`.
8. Run `npm.cmd run demo:video`.
9. Run `npm.cmd run submission`.
10. Run `npm.cmd run package`.
11. Upload `reports/neon-lane-dash-html5.zip` for HTML5 platform upload, use the `dist/` contents for platforms that request loose files, or use the public Release pack: https://github.com/yanqr213/neon-lane-dash/releases/tag/platform-submission-v1.
12. Include `reports/neon-lane-dash-cover-16x9.png`, `reports/neon-lane-dash-icon-512.png`, `reports/desktop-smoke.png`, `reports/mobile-smoke.png`, and `reports/neon-lane-dash-demo.mp4` as submission media when useful.

## Recommended Platform Order

1. CrazyGames: best fit for HTML5 arcade review and later platform ads, but not instant revenue.
2. Yandex Games: useful second zero-domain HTML5 platform with ad monetization after review.
3. itch.io: easiest zero-domain public page, useful for collecting plays and screenshots, but ad revenue is not the main path.
4. Cloudflare Pages: fallback demo hosting if a platform submission needs a public URL.
5. Douyin mini-game: later port only after account/audit requirements are clear.

## Ad Safety Rules

- Keep standalone ads disabled.
- Rewarded ads may only be optional focus assist, retry, revive, or bonus time.
- Never instruct users to click ads.
- Never label ads as gameplay buttons.
- Never make false claims about rewards, rankings, payouts, or revenue.

## Morning Review Gates

- `reports/verification.json` status is `passed`.
- `reports/analytics-verification.json` status is `passed`.
- `reports/crazygames-verification.json` status is `passed` and covers CrazyGames plus Yandex SDK hooks.
- `reports/smoke.json` status is `passed`.
- `reports/platform-assets-verification.json` status is `passed`.
- `reports/demo-video.json` status is `passed`.
- `reports/platform-submission.json` exists and includes live URL, controls, and ad-safety notes.
- Desktop and mobile screenshots show a nonblank playable canvas.
- Platform icon, cover, and social-card assets exist.
- Packaged ZIP is present, has `index.html` at archive root, and is under 10 MB.
- No secrets are present in source files.
- `/api/metrics` returns aggregate counts after at least one tracked play session.
- GitHub Release `platform-submission-v1` contains ZIP, MP4, submission notes, and verification reports.

## Revenue Reality

This route is lower cash risk than buying a domain, but it is not same-day payout. The first monetizable proof is platform acceptance plus measurable plays. The first ad-revenue proof requires platform ad eligibility and payout setup.
