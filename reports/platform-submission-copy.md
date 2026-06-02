# Neon Lane Dash Submission Copy Pack

Generated: 2026-06-02T00:16:48.637Z

## No-domain decision

- Submit to CrazyGames first because it has a self-serve developer portal, platform-hosted distribution, SDK-based ads, and payout setup through Tipalti after revenue eligibility.
- Submit to Yandex Games second because it supports platform catalog discovery, SDK-based ad monetization, and publisher-console metrics.
- Publish an itch.io mirror only as a free browser-play backup and feedback surface, not as the main advertising route.

## Parked routes

- GameDistribution can be evaluated after the first two platforms because it is a revenue-share distributor, but it adds another SDK and lower control over downstream portals.
- Douyin and Bilibili mini-game routes are not first because they require extra platform accounts, local mini-game packaging, domestic compliance review, and more account-side setup.

## 1. CrazyGames

Submission URL: https://developer.crazygames.com/

Monetization expectation: Basic Launch can validate quality first. Ads and revenue share depend on platform selection, ad eligibility, and payment setup.

Source notes:

- CrazyGames documents Basic Launch ads as disabled/no revenue share until later eligibility.
- CrazyGames payouts require billing setup and have a minimum payout threshold.

Copy fields:

### title

Neon Lane Dash

### shortDescription

Switch lanes, collect neon sparks, and dodge blockers in fast 45-second arcade runs.

### longDescription

Neon Lane Dash is a lightweight HTML5 reflex game built for short browser sessions. Players move between three neon lanes, collect sparks to build combo, dodge blockers, and use a short focus ability to slow the road for a moment. It is readable in seconds, works with keyboard or touch controls, and is packaged as a standalone zero-domain browser game for platform-ad validation.

### genre

Arcade, Reflex, Runner

### tags

html5, arcade, runner, reflex, lane, casual, browser, mobile-friendly

### controls

A/D keys, arrow keys, or touch left/right buttons; Space or F for focus.

### deviceSupport

Desktop browser, Mobile browser, Tablet browser

### language

English

### contentRating

Everyone / no violence / no gambling / no personal data collection

### uploadPackage

https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-html5.zip

### livePreview

https://neon-lane-dash.pages.dev/

### sdkAndAdsNote

CrazyGames SDK v3 is dynamically loaded only in CrazyGames context. loadingStop, gameplayStart, and gameplayStop hooks are present. Ads are disabled by default for Basic Launch; rewarded placements are gated behind an explicit ads flag and should only be enabled after platform approval.

### complianceNote

Standalone and Basic Launch builds do not request ads. External submission-kit CTA is hidden in CrazyGames context. All game files use relative paths and the current package is under 500KB.

## 2. Yandex Games

Submission URL: https://yandex.com/dev/games/

Monetization expectation: Internal monetization can be enabled after publishing and payment details are accepted in the Yandex/YAN partner flow.

Source notes:

- Yandex Games monetization depends on real plays, user retention, ratings, and ad requests through the SDK.
- The build includes LoadingAPI.ready, GameplayAPI start/stop, and gated rewarded/fullscreen ad calls.

Copy fields:

### title

Neon Lane Dash

### shortDescription

Switch lanes, collect neon sparks, and dodge blockers in fast 45-second arcade runs.

### longDescription

Short mobile-friendly lane-dodging runs with simple controls, clear scoring, and optional platform-approved rewarded assists.

### genre

Arcade, Reflex, Runner

### tags

html5, arcade, runner, reflex, lane, casual, browser, mobile-friendly

### controls

Keyboard: A/D or arrow keys to switch lanes, Space or F to use focus. Mouse or touch: tap the left and right lane buttons; tap Focus for a brief slow-road assist.

### orientation

Responsive landscape-first layout with desktop keyboard and mobile touch controls.

### language

English

### ageRating

Everyone; no violence, gambling, personal data collection, or payments in the standalone build.

### uploadPackage

https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-html5.zip

### livePreview

https://neon-lane-dash.pages.dev/

### sdkAndAdsNote

Yandex SDK v2 is dynamically loaded only in Yandex context. LoadingAPI.ready and GameplayAPI start/stop hooks are present. showRewardedVideo and showFullscreenAdv calls are gated and disabled unless the platform context is ready and ads=1 is present.

### complianceNote

Standalone build does not request ads. External submission-kit CTA is hidden in platform contexts. The package is self-contained and uses relative local asset paths.

## 3. itch.io

Submission URL: https://itch.io/game/new

Monetization expectation: Use as a free browser mirror and feedback page. Keep payments disabled during validation.

Source notes:

- The HTML ZIP is packaged with index.html at the root and can run as an embedded browser game.
- This is not the primary ad-revenue route.

Copy fields:

### projectName

Neon Lane Dash

### classification

Game

### kindOfProject

HTML

### pricing

No payments

### embedSetting

Run in browser

### shortText

Switch lanes, collect neon sparks, and dodge blockers in fast 45-second arcade runs.

### description

Neon Lane Dash is a lightweight HTML5 reflex game built for short browser sessions. Players move between three neon lanes, collect sparks to build combo, dodge blockers, and use a short focus ability to slow the road for a moment. It is readable in seconds, works with keyboard or touch controls, and is packaged as a standalone zero-domain browser game for platform-ad validation.

Controls: Keyboard: A/D or arrow keys to switch lanes, Space or F to use focus. Mouse or touch: tap the left and right lane buttons; tap Focus for a brief slow-road assist.

This is a free validation build. It has no forced ads, no login, and no in-app purchases.

### tags

html5, arcade, runner, reflex, lane, casual, browser, mobile-friendly

### uploadPackage

reports/neon-lane-dash-html5.zip

### coverText

Switch lanes, collect sparks, dodge blockers.

## Asset links

- icon512: reports/neon-lane-dash-icon-512.png
- releaseIcon512: https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-icon-512.png
- cover16x9: reports/neon-lane-dash-cover-16x9.png
- releaseCover16x9: https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-cover-16x9.png
- socialCard: reports/neon-lane-dash-social-card.png
- releaseSocialCard: https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-social-card.png
- desktopScreenshot: reports/desktop-smoke.png
- mobileScreenshot: reports/mobile-smoke.png
- demoVideo: reports/neon-lane-dash-demo.mp4
- releaseDemoVideo: https://github.com/yanqr213/neon-lane-dash/releases/download/platform-submission-v1/neon-lane-dash-demo.mp4
- releasePage: https://github.com/yanqr213/neon-lane-dash/releases/tag/platform-submission-v1

## Validation gate

- Use the HTML5 ZIP with index.html at the archive root.
- Keep standalone ads disabled until the platform accepts or requests monetization activation.
- Do not use ad-click inducement copy in titles, buttons, screenshots, or descriptions.
- Use platform SDK lifecycle hooks for loading and gameplay state.
- Hide external links in CrazyGames and Yandex embedded contexts.
