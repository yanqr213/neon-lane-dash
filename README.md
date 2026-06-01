# Neon Lane Dash

Neon Lane Dash is a zero-domain HTML5 reflex game prototype for platform-ad validation. The player switches between three lanes, collects neon sparks, avoids blockers, and uses a short focus assist during tight moments.

The goal is not to replace PrintableTools Lab. It is a second, zero-cost monetization path: upload a self-contained HTML5 game to platforms that can later enable display, interstitial, or rewarded ads after review.

## Why This Direction

- No purchased domain is required for the first validation loop.
- The gameplay is understandable in seconds on desktop or mobile.
- Short runs create a natural retry loop for casual game platforms.
- It can create platform-ready screenshots, icons, covers, and demo video automatically.
- Rewarded ads are optional hooks, not forced ad clicks.

## Current Build

Run:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run verify
npm.cmd run verify:analytics
npm.cmd run verify:crazygames
npm.cmd run smoke
npm.cmd run assets:platform
npm.cmd run verify:assets
npm.cmd run demo:video
npm.cmd run submission
npm.cmd run package
```

Outputs:

- `dist/`: static HTML5 game.
- `reports/analytics-verification.json`: anonymous event and metrics verification.
- `reports/crazygames-verification.json`: CrazyGames Basic Launch readiness checks.
- `reports/neon-lane-dash-icon-512.png`: platform icon.
- `reports/neon-lane-dash-cover-16x9.png`: platform cover image.
- `reports/neon-lane-dash-social-card.png`: social preview card.
- `reports/desktop-smoke.png`: desktop visual check.
- `reports/mobile-smoke.png`: mobile visual check.
- `reports/neon-lane-dash-demo.mp4`: short gameplay demo for platform review.
- `reports/platform-submission.json`: copy-ready platform metadata.
- `reports/platform-submission.md`: human-readable submission notes.
- `reports/neon-lane-dash-html5.tar.gz`: platform upload package.
- `reports/neon-lane-dash-html5.zip`: itch.io-ready HTML5 upload package.
- GitHub Release pack: https://github.com/yanqr213/neon-lane-dash/releases/tag/platform-submission-v1

## Monetization Path

1. Submit the HTML5 build to CrazyGames and Yandex Games first.
2. Use platform review status and anonymous `/api/metrics` counts to test retention and feedback.
3. Add platform-native ad calls only when the platform allows ads.
4. Use rewarded ads only for optional focus assist, retry, revive, or bonus time.
5. Do not block basic gameplay behind ad viewing.
6. Do not ask users to click ads or watch ads for external rewards.

## Anonymous Metrics

The hosted Pages build records only aggregate counts in Cloudflare KV: page views, run starts, run ends, lane shifts, spark collects, shield collects, blocker hits, focus usage, and CTA clicks. It does not store IP addresses, emails, or per-user profiles.

## Account Checklist

- CrazyGames developer account: required for submission and later ad eligibility. No domain purchase is required.
- Yandex Games developer account: useful second platform for HTML5 ad validation.
- itch.io account: optional public HTML5 page; upload `reports/neon-lane-dash-html5.zip`.
- Payout profile: required only after platform revenue becomes payable.
- Douyin mini-game account: optional later port; do not start until platform feedback proves the gameplay loop is worth porting.

## Validation Gates

- Gate 1: Browser smoke passes on desktop and mobile.
- Gate 2: A real user can understand the game in 15 seconds.
- Gate 3: At least one platform submission remains live or pending review.
- Gate 4: 100 plays or equivalent platform analytics before making more levels.
- Gate 5: If platform review rejects the game for quality, improve controls, session length, and visual feedback before adding monetization work.
