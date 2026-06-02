(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalStats = document.getElementById("modalStats");
  const modalPrimary = document.getElementById("modalPrimary");
  const modalSecondary = document.getElementById("modalSecondary");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const focusButton = document.getElementById("focusButton");
  const leftButton = document.getElementById("leftButton");
  const rightButton = document.getElementById("rightButton");
  const laneDots = [document.getElementById("laneDotA"), document.getElementById("laneDotB"), document.getElementById("laneDotC")];

  const scoreValue = document.getElementById("scoreValue");
  const comboValue = document.getElementById("comboValue");
  const timeValue = document.getElementById("timeValue");
  const shieldValue = document.getElementById("shieldValue");
  const bestValue = document.getElementById("bestValue");
  const laneLabel = document.getElementById("laneLabel");
  const bestKey = "neon-lane-dash-best";

  const lanes = [
    { id: 0, label: "Left", x: 390, color: "#38bdf8" },
    { id: 1, label: "Center", x: 640, color: "#34d399" },
    { id: 2, label: "Right", x: 890, color: "#ff5d8f" },
  ];

  const state = {
    running: false,
    paused: false,
    over: false,
    score: 0,
    combo: 1,
    streak: 0,
    shields: 1,
    timeLeft: 45,
    speed: 330,
    lane: 1,
    targetLane: 1,
    playerX: lanes[1].x,
    spawnTimer: 0,
    focusUntil: 0,
    distance: 0,
    dodges: 0,
    sparks: 0,
    hits: 0,
    best: 0,
    objects: [],
    particles: [],
    lastTick: 0,
    platformPaused: false,
  };

  window.NeonLanePlatform.init();
  syncPlatformBestScore();

  async function reset(practice = false) {
    await requestBreakAd();
    state.running = true;
    state.paused = false;
    state.platformPaused = false;
    state.over = false;
    state.score = 0;
    state.combo = 1;
    state.streak = 0;
    state.shields = practice ? 2 : 1;
    state.timeLeft = practice ? 35 : 45;
    state.speed = practice ? 280 : 330;
    state.lane = 1;
    state.targetLane = 1;
    state.playerX = lanes[1].x;
    state.spawnTimer = 0;
    state.focusUntil = 0;
    state.distance = 0;
    state.dodges = 0;
    state.sparks = 0;
    state.hits = 0;
    state.objects = [];
    state.particles = [];
    state.lastTick = performance.now();
    modal.classList.add("hidden");
    startButton.textContent = "Restart Dash";
    window.NeonLanePlatform.gameplayStart();
    window.NeonLanePlatform.track("run_start", { practice });
    updateHud();
  }

  function tick(now) {
    const delta = Math.min(0.05, (now - state.lastTick) / 1000 || 0);
    state.lastTick = now;

    if (state.running && !state.paused && !state.platformPaused && !state.over) {
      const focusActive = now < state.focusUntil;
      const speed = focusActive ? state.speed * 0.62 : state.speed;
      state.timeLeft -= delta;
      state.distance += speed * delta;
      state.speed += delta * 8.5;
      state.spawnTimer -= delta;
      state.playerX += (lanes[state.targetLane].x - state.playerX) * Math.min(1, delta * 14);
      if (state.spawnTimer <= 0) spawnObject();
      updateObjects(delta, speed);
      updateParticles(delta);
      if (state.timeLeft <= 0) endRun(true);
      updateHud();
    }

    draw(now);
    window.NeonLanePlatform.signalFirstFrameReady?.();
    requestAnimationFrame(tick);
  }

  function spawnObject() {
    const hard = state.speed > 430;
    const lane = Math.floor(Math.random() * lanes.length);
    const typeRoll = Math.random();
    const type = typeRoll < 0.58 ? "spark" : typeRoll < 0.9 ? "blocker" : "gate";
    state.objects.push({
      type,
      lane,
      x: lanes[lane].x,
      y: -48,
      size: type === "spark" ? 34 : type === "gate" ? 70 : 58,
      scored: false,
      color: type === "spark" ? lanes[lane].color : type === "gate" ? "#fbbf24" : "#f43f5e",
    });
    state.spawnTimer = Math.max(0.22, (hard ? 0.56 : 0.68) - Math.random() * 0.22 - state.speed / 1800);
  }

  function updateObjects(delta, speed) {
    const playerY = 574;
    for (const item of state.objects) {
      item.y += speed * delta;
      if (!item.scored && Math.abs(item.y - playerY) < 48 && item.lane === state.targetLane) {
        item.scored = true;
        if (item.type === "spark") collectSpark(item);
        else if (item.type === "gate") collectGate(item);
        else hitBlocker(item);
      }
      if (!item.scored && item.type === "blocker" && item.y > playerY + 60) {
        item.scored = true;
        state.dodges += 1;
        state.streak += 1;
        state.combo = Math.min(10, 1 + Math.floor(state.streak / 5));
      }
    }
    state.objects = state.objects.filter((item) => item.y < canvas.height + 90 && !item.remove);
  }

  function collectSpark(item) {
    const gained = 90 * state.combo;
    state.score += gained;
    state.sparks += 1;
    state.streak += 1;
    state.combo = Math.min(10, 1 + Math.floor(state.streak / 5));
    pop(item.x, item.y, `+${gained}`, item.color);
    window.NeonLanePlatform.track("spark_collect", { lane: item.lane, score: state.score });
    item.remove = true;
  }

  function collectGate(item) {
    const bonus = Math.min(3, Math.floor(state.streak / 8) + 1);
    state.shields = Math.min(3, state.shields + 1);
    state.score += 150 * bonus;
    state.streak += 2;
    pop(item.x, item.y, "Shield", "#fbbf24");
    window.NeonLanePlatform.track("shield_collect", { lane: item.lane, score: state.score });
    item.remove = true;
  }

  function hitBlocker(item) {
    state.hits += 1;
    state.streak = 0;
    state.combo = 1;
    window.NeonLanePlatform.track("blocker_hit", { lane: item.lane, score: state.score });
    if (state.shields > 0) {
      state.shields -= 1;
      pop(item.x, item.y, "Shield -1", "#fbbf24");
      item.remove = true;
      return;
    }
    pop(item.x, item.y, "Crash", "#f43f5e");
    item.remove = true;
    endRun(false);
  }

  function move(direction) {
    if (!state.running || state.paused || state.over) return;
    state.targetLane = Math.max(0, Math.min(2, state.targetLane + direction));
    state.lane = state.targetLane;
    pulse(direction < 0 ? leftButton : rightButton);
    window.NeonLanePlatform.track("lane_shift", { lane: state.targetLane });
    updateHud();
  }

  async function useFocus() {
    if (!state.running || state.paused || state.over) return;
    if (performance.now() < state.focusUntil) return;
    if (window.NeonLanePlatform.adsAllowed() && state.score < 180 && state.sparks > 2) {
      state.paused = true;
      const watched = await window.NeonLanePlatform.requestAd("rewarded", {
        onUnavailable: () => {},
        onError: () => {},
      });
      state.paused = false;
      if (!watched) state.score = Math.max(0, state.score - 50);
    } else {
      state.score = Math.max(0, state.score - 80);
    }
    state.focusUntil = performance.now() + 2600;
    window.NeonLanePlatform.track("focus_used", { score: state.score });
    updateHud();
  }

  function endRun(cleared) {
    if (state.over) return;
    state.over = true;
    state.running = false;
    startButton.textContent = "Start Dash";
    window.NeonLanePlatform.gameplayStop();
    window.NeonLanePlatform.track("run_end", {
      score: state.score,
      sparks: state.sparks,
      dodges: state.dodges,
      hits: state.hits,
    });
    const best = saveBestScore(state.score);
    showModal(
      cleared ? "Dash complete" : "Lane crashed",
      best.isNew
        ? "New best score. One cleaner run can push the combo even higher."
        : cleared
        ? "Clean finish. Replay for a faster, higher-combo run."
        : "One more run is usually enough to beat the last score.",
      "Play again",
      "Practice",
      [
        ["Score", state.score],
        ["Best", state.best],
        ["Sparks", state.sparks],
      ],
      () => reset(false),
      () => reset(true)
    );
  }

  async function requestBreakAd() {
    if (!window.NeonLanePlatform.adsAllowed()) return false;
    const provider = window.NeonLanePlatform.state.provider;
    const firstStart = !state.over && state.score === 0;
    if (firstStart && provider !== "gamedistribution") return false;
    state.paused = true;
    await window.NeonLanePlatform.requestAd("interstitial", {
      onUnavailable: () => {},
      onError: () => {},
    });
    state.paused = false;
  }

  function setPlatformPaused(paused) {
    state.platformPaused = paused;
    state.paused = paused;
  }

  function draw(now) {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#101820");
    sky.addColorStop(0.58, "#142235");
    sky.addColorStop(1, "#0e131b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    drawRoad(now);
    drawObjects();
    drawRunner(now);
    drawParticles();
    drawFocusOverlay(now);
    drawIntroCopy();
  }

  function drawRoad(now) {
    ctx.save();
    ctx.fillStyle = "#182434";
    roundRect(260, 32, 760, 648, 22);
    ctx.fill();
    ctx.strokeStyle = "#2c405b";
    ctx.lineWidth = 4;
    ctx.stroke();

    lanes.forEach((lane, index) => {
      ctx.strokeStyle = lane.color;
      ctx.globalAlpha = index === state.targetLane ? 0.8 : 0.35;
      ctx.lineWidth = index === state.targetLane ? 7 : 3;
      ctx.beginPath();
      ctx.moveTo(lane.x, 48);
      ctx.lineTo(lane.x, 674);
      ctx.stroke();
    });

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#f7f3e8";
    ctx.lineWidth = 2;
    const offset = (state.distance % 86);
    for (let y = -86 + offset; y < 720; y += 86) {
      ctx.beginPath();
      ctx.moveTo(292, y);
      ctx.lineTo(988, y + 36);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObjects() {
    for (const item of state.objects) {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.type === "spark") {
        ctx.fillStyle = item.color;
        star(0, 0, 5, item.size * 0.52, item.size * 0.24);
        ctx.fill();
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 18;
        ctx.fill();
      } else if (item.type === "gate") {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 8;
        roundRect(-34, -34, 68, 68, 14);
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "900 26px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("+", 0, 9);
      } else {
        ctx.fillStyle = "#f43f5e";
        roundRect(-34, -30, 68, 60, 12);
        ctx.fill();
        ctx.fillStyle = "#101820";
        ctx.font = "900 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("!", 0, 9);
      }
      ctx.restore();
    }
  }

  function drawRunner(now) {
    ctx.save();
    ctx.translate(state.playerX, 574);
    const bob = Math.sin(now / 90) * 4;
    ctx.fillStyle = "#f7f3e8";
    roundRect(-36, -36 + bob, 72, 72, 18);
    ctx.fill();
    ctx.strokeStyle = lanes[state.targetLane].color;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#101820";
    ctx.font = "900 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("D", 0, 9 + bob);
    if (state.shields > 0) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, bob, 52, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.font = "900 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(particle.text, particle.x, particle.y);
      ctx.restore();
    }
  }

  function drawFocusOverlay(now) {
    if (now >= state.focusUntil) return;
    ctx.save();
    ctx.strokeStyle = "#38bdf8";
    ctx.globalAlpha = 0.28 + Math.sin(now / 90) * 0.08;
    ctx.lineWidth = 12;
    roundRect(280, 52, 720, 608, 24);
    ctx.stroke();
    ctx.restore();
  }

  function drawIntroCopy() {
    if (state.running) return;
    ctx.save();
    ctx.fillStyle = "rgba(16, 24, 32, 0.68)";
    roundRect(358, 214, 564, 134, 14);
    ctx.fill();
    ctx.fillStyle = "#f7f3e8";
    ctx.font = "900 34px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Switch lanes. Grab sparks. Dodge blockers.", canvas.width / 2, 268);
    ctx.fillStyle = "#b9c7d6";
    ctx.font = "700 18px system-ui";
    ctx.fillText("A/D, arrows, or touch buttons.", canvas.width / 2, 306);
    ctx.restore();
  }

  function updateParticles(delta) {
    state.particles.forEach((particle) => {
      particle.y -= 58 * delta;
      particle.life -= 1.1 * delta;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function pop(x, y, text, color) {
    state.particles.push({ x, y: y - 48, text, color, life: 1 });
  }

  function saveBestScore(score) {
    const next = Math.max(state.best, Number(score || 0));
    const isNew = next > state.best;
    state.best = next;
    window.NeonLanePlatform.setStoredBestScore?.(bestKey, next);
    updateHud();
    return { value: next, isNew };
  }

  async function syncPlatformBestScore() {
    try {
      const stored = await window.NeonLanePlatform.getStoredBestScore?.(bestKey);
      if (stored === null || stored === undefined) return;
      state.best = Math.max(state.best, Number(stored) || 0);
      updateHud();
    } catch {
      // Platform storage is best-effort; local score remains available.
    }
  }

  function updateHud() {
    scoreValue.textContent = String(state.score);
    comboValue.textContent = `x${state.combo}`;
    timeValue.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
    shieldValue.textContent = String(state.shields);
    bestValue.textContent = String(state.best);
    laneLabel.textContent = lanes[state.targetLane].label;
    laneDots.forEach((dot, index) => dot.classList.toggle("active", index === state.targetLane));
  }

  function showModal(title, body, primary, secondary, stats, onPrimary, onSecondary) {
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modalPrimary.textContent = primary;
    modalSecondary.textContent = secondary;
    modalStats.innerHTML = stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
    modalPrimary.onclick = onPrimary;
    modalSecondary.onclick = onSecondary;
    modal.classList.remove("hidden");
  }

  function pulse(button) {
    button.classList.add("active");
    setTimeout(() => button.classList.remove("active"), 140);
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function star(cx, cy, points, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  startButton.addEventListener("click", () => reset(false));
  restartButton.addEventListener("click", () => reset(false));
  focusButton.addEventListener("click", useFocus);
  leftButton.addEventListener("click", () => move(-1));
  rightButton.addEventListener("click", () => move(1));
  document.querySelector(".bottom-strip a")?.addEventListener("click", () => window.NeonLanePlatform.track("cta_click", { target: "submission-kit" }));
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "a" || event.key === "ArrowLeft") move(-1);
    if (key === "d" || event.key === "ArrowRight") move(1);
    if (key === " " || key === "f") useFocus();
    if (event.key === "Enter" && !state.running) reset(false);
  });
  window.addEventListener("nld:platform-pause", () => setPlatformPaused(true));
  window.addEventListener("nld:platform-resume", () => setPlatformPaused(false));

  showModal(
    "Neon lane ready",
    "Collect sparks, dodge blockers, and keep the dash alive for a short arcade run.",
    "Play",
    "Practice",
    [
      ["Keys", "A/D"],
      ["Goal", "45s"],
      ["Ads", "Platform"],
    ],
    () => reset(false),
    () => reset(true)
  );
  updateHud();
  window.NeonLanePlatform.signalGameReady?.();
  requestAnimationFrame(tick);
})();
