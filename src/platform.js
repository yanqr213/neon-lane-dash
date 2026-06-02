(function () {
  const CRAZYGAMES_SDK_URL = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
  const YANDEX_SDK_URL = "https://yandex.ru/games/sdk/v2";
  const PLAYGAMA_BRIDGE_URL = "https://bridge.playgama.com/v1/stable/playgama-bridge.js";
  const GAMEPIX_SDK_URL = "https://gamepix.blob.core.windows.net/gpxlib/dev/gamepix.js";
  const GAMEDISTRIBUTION_SDK_URL = "https://html5.api.gamedistribution.com/main.min.js";
  const LOCAL_EVENT_KEY = "neon-lane-dash-events";
  let initPromise = null;
  let firstFrameSent = false;
  let readySent = false;
  const state = {
    ready: false,
    provider: "local",
    sdk: null,
    gamePixLoaded: false,
    gameDistributionGameId: "",
    gameDistributionRewardedComplete: false,
  };

  if (isCrazyGamesContext()) document.documentElement.classList.add("platform-crazygames");
  if (isYandexContext()) document.documentElement.classList.add("platform-yandex");
  if (isPlaygamaContext()) document.documentElement.classList.add("platform-playgama");
  if (isGamePixContext()) document.documentElement.classList.add("platform-gamepix");
  if (isGameDistributionContext()) document.documentElement.classList.add("platform-gamedistribution");
  if (isGameSnacksContext()) document.documentElement.classList.add("platform-gamesnacks");

  function init() {
    if (!initPromise) initPromise = initSdk();
    return initPromise;
  }

  async function initSdk() {
    if (isGameSnacksContext() || window.GameSnacks) return initGameSnacks();
    if (isCrazyGamesContext() || window.CrazyGames?.SDK) return initCrazyGames();
    if (isYandexContext() || window.YaGames) return initYandexGames();
    if (isPlaygamaContext() || window.bridge) return initPlaygama();
    if (isGamePixContext() || window.GamePix) return initGamePix();
    if (isGameDistributionContext() || window.gdsdk) return initGameDistribution();
    return state;
  }

  async function initGameSnacks() {
    if (!window.GameSnacks) return state;
    state.provider = "gamesnacks";
    state.sdk = window.GameSnacks;
    try {
      window.GameSnacks.game?.onPause?.(() => window.dispatchEvent(new CustomEvent("nld:platform-pause")));
      window.GameSnacks.game?.onResume?.(() => window.dispatchEvent(new CustomEvent("nld:platform-resume")));
      window.GameSnacks.audio?.subscribe?.((enabled) => {
        window.dispatchEvent(new CustomEvent(enabled ? "nld:platform-audio-on" : "nld:platform-audio-off"));
      });
      state.ready = true;
    } catch (error) {
      console.warn("GameSnacks SDK setup failed", error);
    }
    return state;
  }

  async function initCrazyGames() {
    await loadScript(CRAZYGAMES_SDK_URL);
    if (window.CrazyGames?.SDK) {
      state.provider = "crazygames";
      state.sdk = window.CrazyGames.SDK;
      try {
        await state.sdk.init();
        await state.sdk.game?.loadingStop?.();
        state.ready = true;
      } catch (error) {
        console.warn("Platform SDK init failed", error);
      }
    }
    return state;
  }

  async function initYandexGames() {
    await loadScript(YANDEX_SDK_URL);
    if (window.YaGames) {
      state.provider = "yandex-games";
      try {
        state.sdk = await window.YaGames.init();
        state.sdk.features?.LoadingAPI?.ready?.();
        state.ready = true;
      } catch (error) {
        console.warn("Yandex Games SDK init failed", error);
      }
    }
    return state;
  }

  async function initPlaygama() {
    await loadScript(PLAYGAMA_BRIDGE_URL);
    if (window.bridge) {
      state.provider = "playgama";
      state.sdk = window.bridge;
      try {
        await window.bridge.initialize();
        window.bridge.advertisement?.setMinimumDelayBetweenInterstitial?.(30);
        setupPlaygamaLifecycle();
        state.ready = true;
      } catch (error) {
        console.warn("Playgama Bridge init failed", error);
      }
    }
    return state;
  }

  async function initGamePix() {
    await loadScript(GAMEPIX_SDK_URL);
    if (window.GamePix) {
      state.provider = "gamepix";
      state.sdk = window.GamePix;
      state.ready = true;
      try {
        window.GamePix.on = window.GamePix.on || {};
        window.GamePix.on.pause = () => window.dispatchEvent(new CustomEvent("nld:platform-pause"));
        window.GamePix.on.resume = () => window.dispatchEvent(new CustomEvent("nld:platform-resume"));
        window.GamePix.on.soundOn = () => {};
        window.GamePix.on.soundOff = () => {};
        window.GamePix.game?.gameLoading?.(100);
        window.GamePix.game?.gameLoaded?.(() => {
          state.gamePixLoaded = true;
        });
      } catch (error) {
        console.warn("GamePix SDK setup failed", error);
      }
    }
    return state;
  }

  async function initGameDistribution() {
    const gameId = gameDistributionGameId();
    state.provider = "gamedistribution";
    state.gameDistributionGameId = gameId;
    if (!gameId && !window.gdsdk) return state;
    window.GD_OPTIONS = window.GD_OPTIONS || {
      gameId,
      prefix: "nld__",
      advertisementSettings: { debug: false, autoplay: false, locale: "en" },
      onEvent: (event) => handleGameDistributionEvent(event),
    };
    await loadScript(GAMEDISTRIBUTION_SDK_URL);
    if (window.gdsdk) {
      state.sdk = window.gdsdk;
      state.ready = true;
    }
    return state;
  }

  function loadScript(src) {
    if (src === CRAZYGAMES_SDK_URL && window.CrazyGames?.SDK) return Promise.resolve();
    if (src === YANDEX_SDK_URL && window.YaGames) return Promise.resolve();
    if (src === PLAYGAMA_BRIDGE_URL && window.bridge) return Promise.resolve();
    if (src === GAMEPIX_SDK_URL && window.GamePix) return Promise.resolve();
    if (src === GAMEDISTRIBUTION_SDK_URL && window.gdsdk) return Promise.resolve();
    return new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => resolve(), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  async function requestAd(kind, callbacks = {}) {
    await init();
    if (!adsAllowed()) {
      callbacks.onUnavailable?.();
      return false;
    }
    if (state.provider === "yandex-games") return requestYandexAd(kind, callbacks);
    if (state.provider === "playgama") return requestPlaygamaAd(kind, callbacks);
    if (state.provider === "gamepix") return requestGamePixAd(kind, callbacks);
    if (state.provider === "gamedistribution") return requestGameDistributionAd(kind, callbacks);
    if (state.provider === "gamesnacks") return requestGameSnacksAd(kind, callbacks);
    if (!state.ready || !state.sdk?.ad?.requestAd) {
      callbacks.onUnavailable?.();
      return false;
    }
    try {
      await state.sdk.ad.requestAd(kind, {
        adStarted: callbacks.onStart || (() => {}),
        adFinished: callbacks.onFinish || (() => {}),
        adError: callbacks.onError || (() => {}),
      });
      return true;
    } catch (error) {
      console.warn("Platform ad failed", error);
      callbacks.onError?.(error);
      return false;
    }
  }

  function requestYandexAd(kind, callbacks = {}) {
    if (!state.ready || !state.sdk?.adv) {
      callbacks.onUnavailable?.();
      return Promise.resolve(false);
    }
    if (kind === "rewarded" && state.sdk.adv.showRewardedVideo) {
      return new Promise((resolve) => {
        let rewarded = false;
        try {
          state.sdk.adv.showRewardedVideo({
            callbacks: {
              onOpen: callbacks.onStart || (() => {}),
              onRewarded: () => {
                rewarded = true;
                callbacks.onRewarded?.();
              },
              onClose: () => {
                callbacks.onFinish?.();
                resolve(rewarded);
              },
              onError: (error) => {
                callbacks.onError?.(error);
                resolve(false);
              },
            },
          });
        } catch (error) {
          callbacks.onError?.(error);
          resolve(false);
        }
      });
    }
    if (state.sdk.adv.showFullscreenAdv) {
      return new Promise((resolve) => {
        try {
          state.sdk.adv.showFullscreenAdv({
            callbacks: {
              onOpen: callbacks.onStart || (() => {}),
              onClose: () => {
                callbacks.onFinish?.();
                resolve(true);
              },
              onError: (error) => {
                callbacks.onError?.(error);
                resolve(false);
              },
            },
          });
        } catch (error) {
          callbacks.onError?.(error);
          resolve(false);
        }
      });
    }
    callbacks.onUnavailable?.();
    return Promise.resolve(false);
  }

  function requestPlaygamaAd(kind, callbacks = {}) {
    if (!state.ready || !state.sdk?.advertisement) {
      callbacks.onUnavailable?.();
      return Promise.resolve(false);
    }
    const ads = state.sdk.advertisement;
    try {
      if (kind === "rewarded" && ads.isRewardedSupported && ads.showRewarded) {
        return new Promise((resolve) => {
          let active = true;
          const finish = (value) => {
            if (!active) return;
            active = false;
            callbacks.onFinish?.();
            resolve(value);
          };
          const onState = (adState) => {
            if (!active) return;
            if (adState === "opened") callbacks.onStart?.();
            if (adState === "rewarded") {
              callbacks.onRewarded?.();
              finish(true);
            }
            if (adState === "closed" || adState === "failed") finish(false);
          };
          try {
            ads.on?.(state.sdk.EVENT_NAME?.REWARDED_STATE_CHANGED, onState);
            ads.showRewarded("rewarded_assist");
          } catch (error) {
            callbacks.onError?.(error);
            finish(false);
          }
        });
      }
      if (ads.isInterstitialSupported && ads.showInterstitial) {
        callbacks.onStart?.();
        const result = ads.showInterstitial("run_break");
        return Promise.resolve(result).then(() => {
          callbacks.onFinish?.();
          return true;
        }).catch((error) => {
          callbacks.onError?.(error);
          return false;
        });
      }
    } catch (error) {
      callbacks.onError?.(error);
      return Promise.resolve(false);
    }
    callbacks.onUnavailable?.();
    return Promise.resolve(false);
  }

  function requestGamePixAd(kind, callbacks = {}) {
    callbacks.onUnavailable?.({ provider: "gamepix", kind });
    return Promise.resolve(false);
  }

  function requestGameDistributionAd(kind, callbacks = {}) {
    if (!state.ready || !window.gdsdk?.showAd) {
      callbacks.onUnavailable?.();
      return Promise.resolve(false);
    }
    try {
      callbacks.onStart?.();
      state.gameDistributionRewardedComplete = false;
      const result = window.gdsdk.showAd(kind === "rewarded" ? "rewarded" : undefined);
      return Promise.resolve(result).then(() => {
        const completed = kind !== "rewarded" || state.gameDistributionRewardedComplete;
        if (completed && kind === "rewarded") callbacks.onRewarded?.();
        callbacks.onFinish?.();
        return completed;
      }).catch((error) => {
        callbacks.onError?.(error);
        return false;
      });
    } catch (error) {
      callbacks.onError?.(error);
      return Promise.resolve(false);
    }
  }

  function requestGameSnacksAd(kind, callbacks = {}) {
    if (!state.ready || !state.sdk?.ad?.break) {
      callbacks.onUnavailable?.();
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
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
    });
  }

  function track(eventName, payload = {}) {
    const event = {
      eventName,
      payload,
      at: new Date().toISOString(),
      provider: state.provider,
    };
    if (state.provider !== "gamesnacks") {
      try {
        const events = JSON.parse(readLocalValue(LOCAL_EVENT_KEY) || "[]");
        events.push(event);
        writeLocalValue(LOCAL_EVENT_KEY, JSON.stringify(events.slice(-50)));
      } catch {
        // Local analytics are best-effort for platform review builds.
      }
    }
    reportPlatformEvent(eventName, payload);
    if (state.provider !== "gamesnacks") sendRemoteEvent(eventName, payload);
    window.dispatchEvent(new CustomEvent("nld:event", { detail: event }));
  }

  function reportPlatformEvent(eventName, payload = {}) {
    if (state.provider === "gamepix" && eventName === "run_end" && window.GamePix?.game?.ping) {
      try {
        window.GamePix.game.ping("game_over", { score: Number(payload.score || 0), level: "main", achievements: {} });
      } catch {
        // Platform analytics are best-effort in review builds.
      }
    }
    if (state.provider === "gamesnacks") {
      try {
        if (eventName === "run_end") {
          const score = Number(payload.score || 0);
          state.sdk?.score?.update?.(score);
          state.sdk?.game?.gameOver?.();
          if (score > 0) state.sdk?.game?.levelComplete?.(1);
        }
      } catch {
        // GameSnacks telemetry is best-effort.
      }
    }
  }

  function sendRemoteEvent(eventName, payload = {}) {
    const body = JSON.stringify({
      name: eventName,
      source: trafficSource(),
      path: window.location.pathname || "/",
      detail: safeDetail(payload),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function trafficSource() {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source");
    if (utm) return normalizeSource(utm);
    const referrer = document.referrer || "";
    if (!referrer) return "direct";
    if (referrer.includes("github.com")) return "github";
    if (referrer.includes("printable-tools-lab")) return "printable-tools-lab";
    if (referrer.includes("crazygames")) return "crazygames";
    if (referrer.includes("yandex")) return "yandex-games";
    if (referrer.includes("playgama")) return "playgama";
    if (referrer.includes("gamepix")) return "gamepix";
    if (referrer.includes("gamedistribution")) return "gamedistribution";
    if (referrer.includes("itch.io")) return "itch";
    return "referral";
  }

  function normalizeSource(value) {
    const source = String(value || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (["github", "printable-tools-lab", "crazygames", "yandex-games", "playgama", "gamepix", "gamedistribution", "itch", "community", "short-video"].includes(source)) return source;
    return source ? "referral" : "direct";
  }

  function safeDetail(payload) {
    const output = {};
    for (const [key, value] of Object.entries(payload || {})) {
      if (["target", "lane", "practice", "score", "sparks", "dodges", "hits"].includes(key)) output[key] = value;
    }
    return output;
  }

  async function gameplayStart() {
    await init();
    signalGameReady();
    if (state.provider === "playgama" && state.sdk?.platform?.sendMessage) {
      try {
        await state.sdk.platform.sendMessage("level_started");
        return true;
      } catch (error) {
        console.warn("Playgama level_started event failed", error);
        return false;
      }
    }
    if (state.provider === "yandex-games" && state.sdk?.features?.GameplayAPI?.start) {
      try {
        state.sdk.features.GameplayAPI.start();
        return true;
      } catch (error) {
        console.warn("Yandex gameplay start event failed", error);
        return false;
      }
    }
    if (!state.ready || !state.sdk?.game?.gameplayStart) return false;
    try {
      await state.sdk.game.gameplayStart();
      return true;
    } catch (error) {
      console.warn("Gameplay start event failed", error);
      return false;
    }
  }

  async function gameplayStop() {
    await init();
    if (state.provider === "playgama" && state.sdk?.platform?.sendMessage) {
      try {
        await state.sdk.platform.sendMessage("level_completed");
        return true;
      } catch (error) {
        console.warn("Playgama level_completed event failed", error);
        return false;
      }
    }
    if (state.provider === "yandex-games" && state.sdk?.features?.GameplayAPI?.stop) {
      try {
        state.sdk.features.GameplayAPI.stop();
        return true;
      } catch (error) {
        console.warn("Yandex gameplay stop event failed", error);
        return false;
      }
    }
    if (!state.ready || !state.sdk?.game?.gameplayStop) return false;
    try {
      await state.sdk.game.gameplayStop();
      return true;
    } catch (error) {
      console.warn("Gameplay stop event failed", error);
      return false;
    }
  }

  async function getStoredBestScore(key) {
    await init();
    if (state.provider === "gamesnacks" && state.sdk?.storage?.getItem) {
      try {
        const value = state.sdk.storage.getItem(key);
        if (value === null || value === undefined || value === "") return 0;
        return Math.max(0, Number(value) || 0);
      } catch (error) {
        console.warn("GameSnacks storage read failed", error);
        return 0;
      }
    }
    if (state.provider !== "playgama" || !state.sdk?.storage?.get) {
      const value = readLocalValue(key);
      if (value === null || value === undefined || value === "") return 0;
      return Math.max(0, Number(value) || 0);
    }
    try {
      const value = await state.sdk.storage.get(key);
      if (value === null || value === undefined || value === "") return Math.max(0, Number(readLocalValue(key) || 0));
      return Math.max(0, Number(value) || 0);
    } catch (error) {
      console.warn("Playgama storage read failed", error);
      return Math.max(0, Number(readLocalValue(key) || 0));
    }
  }

  async function setStoredBestScore(key, value) {
    await init();
    if (state.provider === "gamesnacks" && state.sdk?.storage?.setItem) {
      try {
        state.sdk.storage.setItem(key, String(Math.max(0, Number(value) || 0)));
        return true;
      } catch (error) {
        console.warn("GameSnacks storage write failed", error);
        return false;
      }
    }
    if (state.provider !== "playgama" || !state.sdk?.storage?.set) {
      return writeLocalValue(key, String(Math.max(0, Number(value) || 0)));
    }
    try {
      await state.sdk.storage.set(key, String(Math.max(0, Number(value) || 0)));
      writeLocalValue(key, String(Math.max(0, Number(value) || 0)));
      return true;
    } catch (error) {
      console.warn("Playgama storage write failed", error);
      return writeLocalValue(key, String(Math.max(0, Number(value) || 0)));
    }
  }

  function isCrazyGamesContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("crazygames") || referrer.includes("crazygames") || params.get("platform") === "crazygames" || params.get("cg_sdk") === "1";
  }

  function isYandexContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("yandex") || referrer.includes("yandex") || params.get("platform") === "yandex" || params.get("ysdk") === "1";
  }

  function isPlaygamaContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("playgama") || referrer.includes("playgama") || params.get("platform") === "playgama" || params.get("pg_bridge") === "1";
  }

  function isGamePixContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("gamepix") || referrer.includes("gamepix") || params.get("platform") === "gamepix" || params.get("gpx") === "1";
  }

  function isGameDistributionContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("gamedistribution") || referrer.includes("gamedistribution") || params.get("platform") === "gamedistribution" || params.get("gd_sdk") === "1" || params.has("gd_game_id");
  }

  function isGameSnacksContext() {
    const host = window.location.hostname || "";
    const referrer = document.referrer || "";
    const params = new URLSearchParams(window.location.search);
    return host.includes("gamesnacks") || referrer.includes("gamesnacks") || params.get("platform") === "gamesnacks" || Boolean(window.GameSnacks);
  }

  function gameDistributionGameId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("gd_game_id") || params.get("gameId") || "";
  }

  function handleGameDistributionEvent(event = {}) {
    const name = event.name || "";
    if (name === "SDK_GAME_PAUSE" || name === "CONTENT_PAUSE_REQUESTED") window.dispatchEvent(new CustomEvent("nld:platform-pause"));
    if (name === "SDK_GAME_START" || name === "CONTENT_RESUME_REQUESTED") window.dispatchEvent(new CustomEvent("nld:platform-resume"));
    if (name === "SDK_READY") state.ready = true;
    if (name === "SDK_REWARDED_WATCH_COMPLETE") state.gameDistributionRewardedComplete = true;
  }

  function setupPlaygamaLifecycle() {
    const bridge = window.bridge;
    const events = bridge?.EVENT_NAME || {};
    if (!bridge?.platform) return;
    try {
      bridge.platform.sendMessage?.("game_ready");
      bridge.platform.on?.(events.PAUSE_STATE_CHANGED, (paused) => {
        window.dispatchEvent(new CustomEvent(paused ? "nld:platform-pause" : "nld:platform-resume"));
      });
      bridge.platform.on?.(events.AUDIO_STATE_CHANGED, (enabled) => {
        window.dispatchEvent(new CustomEvent(enabled ? "nld:platform-audio-on" : "nld:platform-audio-off"));
      });
      if (bridge.platform.isAudioEnabled === false) window.dispatchEvent(new CustomEvent("nld:platform-audio-off"));
    } catch (error) {
      console.warn("Playgama lifecycle setup failed", error);
    }
  }

  function adsAllowed() {
    const params = new URLSearchParams(window.location.search);
    if (!state.ready || params.get("ads") === "0") return false;
    if (state.provider === "gamesnacks") return true;
    if (state.provider === "playgama") return true;
    return params.get("ads") === "1";
  }

  function signalFirstFrameReady() {
    if (firstFrameSent || state.provider !== "gamesnacks") return false;
    firstFrameSent = true;
    try {
      state.sdk?.game?.firstFrameReady?.();
      return true;
    } catch {
      return false;
    }
  }

  function signalGameReady() {
    if (readySent || state.provider !== "gamesnacks") return false;
    readySent = true;
    try {
      state.sdk?.game?.ready?.();
      return true;
    } catch {
      return false;
    }
  }

  function readLocalValue(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeLocalValue(key, value) {
    try {
      localStorage.setItem(key, value);
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
  setTimeout(() => track("page_view", { target: "game" }), 0);
})();
