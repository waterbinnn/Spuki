// The Spuki console, rebuilt for the web: the same body render, wheel, disc and volume keys as the
// app (Sources/Spuki/UI/Console.swift), and its five screens redrawn on a canvas at the app's
// own coordinates. It plays the sample track (sound.js) through the EQ it shows.
import { TRACK } from "./sound.js";

// --- 5×7 dot-matrix face (Sources/Spuki/UI/DotMatrix.swift) ---
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "·": ["00000", "00000", "00000", "01100", "01100", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "▶": ["10000", "11000", "11100", "11110", "11100", "11000", "10000"],
  "◀": ["00001", "00011", "00111", "01111", "00111", "00011", "00001"],
};
const width = (s, px) => Math.max(s.length, 1) * 6 * px - px;

// --- Sounds (Sources/SpukiDSP/EQSettings.swift) ---
const LABELS = ["31", "62", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];
const MODES = [
  ["flat", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["bass boost", [7, 6, 4, 1, 0, 0, 0, 0, 0, 0]],
  ["bass cut", [-6, -5, -3, -1, 0, 0, 0, 0, 0, 0]],
  ["bright", [0, 0, 0, 0, 0, 1, 2, 4, 5, 5]],
  ["treble cut", [0, 0, 0, 0, 0, 0, -1, -3, -5, -6]],
  ["warm", [3, 3, 2, 1, 0, 0, -1, -2, -3, -3]],
  ["vocal", [-2, -2, -1, 0, 2, 4, 4, 2, 0, -1]],
  ["small speaker", [-4, -2, 3, 3, 1, 0, 1, 1, 0, -1]],
  ["spoken", [-6, -4, -2, 0, 2, 3, 4, 3, 1, -2]],
  ["loudness", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { loudness: true }],
  ["night", [-3, -2, -1, 0, 0, 0, 0, -1, -2, -2], { night: true }],
  ["pop", [-1, 0, 1, 2, 3, 3, 2, 1, 0, -1]],
  ["rock", [4, 4, 3, 1, -1, -1, 0, 2, 3, 3]],
  ["hip-hop", [5, 5, 2, 0, -1, -1, 1, 1, 2, 2]],
  ["r&b", [5, 6, 4, 1, -1, -1, 1, 2, 2, 3]],
  ["electronic", [4, 4, 1, 0, -2, -1, 0, 2, 3, 4]],
  ["dance", [6, 5, 3, 1, 1, 2, 3, 3, 2, 1]],
  ["jazz", [3, 2, 1, 0, 0, 1, 1, 1, 2, 3]],
  ["lounge", [-2, -1, 0, 2, 2, 2, 0, -1, 0, 1]],
  ["acoustic", [3, 3, 2, 1, 1, 1, 2, 2, 2, 1]],
  ["classical", [3, 3, 2, 1, 0, 0, 0, 1, 2, 3]],
];

// --- Where things sit, in points (DeckLayout) ---
const BODY = { w: 600, h: 600 };
const SIZE = { w: 606, h: 600 };               // the body plus the volume keys past its right edge
const SCREEN = { x: 12, y: 24, w: 576, h: 300 };
const WHEEL = { x: 300, y: 462, d: 220 };
const CENTRE = 84;                             // the disc in the middle of the wheel
const SIDE_KEYS = [[84, 132], [142, 190]];     // volume up, down
// The wheel's edges, clockwise from the top.
const EDGES = ["MODE", "▶▶", "▶||", "◀◀"];
const LEGEND_R = (WHEEL.d / 2 + CENTRE / 2 + 2) / 2;

// --- Colours (enum Console) ---
const CREAM = "237, 230, 207";
const cream = (a = 1) => `rgba(${CREAM}, ${a})`;
const GLASS = "rgb(9, 8, 8)";
const DIM = cream(0.45);
// The one accent, the pink of the logo's note: what is picked, lit or playing.
const PINK = "#ff5ea3";
const GHOST = cream(0.08);

const PAGES = ["home", "eq", "mode", "design", "set"];
const fmtDb = (v, unit = true) => {
  const n = v === 0 ? "0" : (v > 0 ? "+" : "") + (Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1));
  return unit ? n + "DB" : n;
};
const clock = (s) => {
  const t = Math.max(0, Math.floor(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export function createConsole(root, { speakers, speaker, onSpeaker, onChange, audio }) {
  // ---------- State ----------
  const s = {
    page: "home",
    eqOn: true, powered: true, loudness: false, night: false,
    bands: [...MODES[12][1]], volume: 0.72,
    source: { mode: "rock" },
    slots: [{ origin: "warm", bands: [4, 4, 3, 1, 0, 0, -1, -2, -3, -3] }, null, null],
    position: 0, playing: false,      // nothing plays until someone presses play
    readout: null,          // { label, value, lo, hi, text, until }
    saving: false, savedTo: null,
    modeScroll: 0,
    applied: { ...speaker() }, pending: { ...speaker() },
    atLogin: true, onTop: false, updates: true,
    spectrum: new Array(44).fill(0),
  };

  const modeOf = (name) => MODES.find((m) => m[0] === name);
  const originName = () => (s.source.mode ?? s.slots[s.source.slot]?.origin ?? "flat");
  const modeLabel = () => (s.source.mode ?? `M${s.source.slot + 1}`);
  const modeNumber = () => (s.source.mode ? `${MODES.findIndex((m) => m[0] === s.source.mode) + 1}.` : `M${s.source.slot + 1}`);
  // "EQ" when the bands were moved off the mode they came from.
  const edited = (origin, bands) => (modeOf(origin)?.[1].some((g, i) => g !== bands[i]) ? "EQ" : "");
  const toneText = () => edited(originName(), s.bands);
  const heard = () => s.bands.map((b) => (s.eqOn ? b : 0));
  const unchanged = () => {
    const m = s.source.mode && modeOf(s.source.mode);
    return !!m && m[1].every((g, i) => g === s.bands[i])
      && !!m[2]?.loudness === s.loudness && !!m[2]?.night === s.night;
  };
  const savedSlot = () => s.slots.findIndex((x) => x && x.bands.every((g, i) => g === s.bands[i]));

  function changed() { onChange?.(publicState()); }
  function publicState() {
    const h = heard();
    return {
      playing: s.playing && s.powered, powered: s.powered, volume: s.volume,
      eqOn: s.eqOn, bands: [...s.bands],
      loudness: s.loudness, night: s.night,
      lows: (h[0] + h[1] + h[2]) / 3 + (s.loudness ? 3 : 0),
    };
  }

  function applyMode(name) {
    const m = modeOf(name);
    s.source = { mode: name };
    s.bands = [...m[1]];
    s.loudness = !!m[2]?.loudness;
    s.night = !!m[2]?.night;
    changed();
  }
  function loadSlot(i) {
    const x = s.slots[i];
    if (!x) return;
    s.source = { slot: i };
    s.bands = [...x.bands];
    changed();
  }
  // Undoes edits back to the mode or slot that is picked, which stays picked (AppState.resetEQ).
  function resetEQ() {
    if (s.source.mode) applyMode(s.source.mode);
    else loadSlot(s.source.slot);
  }
  function storeSlot(i) {
    s.slots[i] = { origin: originName(), bands: [...s.bands] };
    s.source = { slot: i };
    s.saving = false;
    s.savedTo = { i, until: performance.now() + 1500 };
  }

  // ---------- DOM: body, screen, wheel, disc, volume keys ----------
  // The logo's note (PixelNote's eighth note), six cells by eight.
  const NOTE = ["..####", "..#..#", "..#.##", "..#...", "..#...", "..#...", "###...", "###..."];
  const note = NOTE.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ""))).join("");
  root.innerHTML = `
    <div class="deck">
      ${SIDE_KEYS.map(([y0, y1], i) => `
        <button class="deck-side" style="top:${y0}px;height:${y1 - y0}px" aria-label="Volume ${i ? "down" : "up"}" data-i="${i}"><img src="console/side-key.png" alt="" draggable="false"></button>`).join("")}
      <div class="deck-face">
        <img class="deck-body" src="console/body.jpg" alt="" draggable="false">
        <canvas class="deck-grain"></canvas>
        <canvas class="deck-screen"></canvas>
        <canvas class="deck-wheel" style="left:${WHEEL.x - WHEEL.d / 2}px;top:${WHEEL.y - WHEEL.d / 2}px;width:${WHEEL.d}px;height:${WHEEL.d}px"></canvas>
        <div class="deck-disc" style="left:${WHEEL.x - CENTRE / 2 - 2}px;top:${WHEEL.y - CENTRE / 2 - 2}px;width:${CENTRE + 4}px;height:${CENTRE + 4}px" role="button" aria-label="Play or mute">
          <img src="console/disc.png" alt="" draggable="false">
          <svg class="deck-note" viewBox="0 0 6 8" shape-rendering="crispEdges">${note}</svg>
        </div>
      </div>
    </div>`;
  const deck = root.querySelector(".deck");
  const screen = root.querySelector(".deck-screen");
  const ctx = screen.getContext("2d");
  const wheel = root.querySelector(".deck-wheel");
  const wctx = wheel.getContext("2d");
  const discEl = root.querySelector(".deck-disc");
  const disc = discEl.querySelector("img");
  const noteEl = root.querySelector(".deck-note");

  // Fine grain over the body, like bead-blasted plastic (BodyGrain): a fixed tile, soft-light.
  {
    const g = root.querySelector(".deck-grain");
    g.width = BODY.w * 2;
    g.height = BODY.h * 2;
    const gc = g.getContext("2d");
    const img = gc.createImageData(g.width, g.height);
    let seed = 0x5eed;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = seed >>> 24;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gc.putImageData(img, 0, 0);
  }

  // Scale the 606×600 deck to whatever the panel gives it.
  let scale = 1;
  new ResizeObserver(() => {
    scale = root.clientWidth / SIZE.w;
    deck.style.transform = `scale(${scale})`;
    const dpr = Math.min(devicePixelRatio, 2) * scale;
    screen.width = Math.round(SCREEN.w * dpr);
    screen.height = Math.round(SCREEN.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wheel.width = wheel.height = Math.round(WHEEL.d * dpr);
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(root);

  // ---------- Drawing helpers ----------
  let hits = [];
  function text(str, x, y, color = cream(), px = 1.5, ghost = false, c2d = ctx) {
    const dot = px * 0.82;
    [...str.toUpperCase()].forEach((ch, i) => {
      const rows = GLYPHS[ch] ?? GLYPHS[" "];
      rows.forEach((row, r) => [...row].forEach((bit, c) => {
        if (bit === "1") c2d.fillStyle = color;
        else if (ghost) c2d.fillStyle = cream(0.08);
        else return;
        c2d.fillRect(x + (i * 6 + c) * px, y + r * px, dot, dot);
      }));
    });
    return width(str, px);
  }
  function clipped(str, x, y, w, color, px) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - 1, w, px * 7 + 2);
    ctx.clip();
    text(str, x, y, color, px);
    ctx.restore();
  }
  function hit(x, y, w, h, action, extra = {}) { hits.push({ x, y, w, h, action, ...extra }); }
  // LCDKey: outlined, filled when lit.
  function key(label, x, y, lit, action) {
    const w = width(label, 1.4) + 16;
    if (lit) { ctx.fillStyle = PINK; ctx.fillRect(x, y, w, 22); }
    ctx.strokeStyle = lit ? PINK : cream(0.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
    text(label, x + 8, y + 6.1, lit ? GLASS : cream(), 1.4);
    if (action) hit(x, y, w, 22, action);
    return w;
  }
  function idleKey(label, x, y) {
    const w = width(label, 1.4) + 16;
    ctx.strokeStyle = GHOST;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
    text(label, x + 8, y + 6.1, DIM, 1.4);
    return w;
  }
  function rule(x, y, w) {
    ctx.fillStyle = cream(0.2);
    for (let d = 0; d < w; d += 4) ctx.fillRect(x + d, y, 1.2, 1.2);
  }
  function lcdSwitch(on, x, y, toggle) {
    [["ON", on], ["OFF", !on]].forEach(([l, lit], i) => {
      if (lit) { ctx.fillStyle = PINK; ctx.fillRect(x + i * 42, y, 42, 24); }
      text(l, x + i * 42 + (42 - width(l, 1.6)) / 2, y + 6.4, lit ? GLASS : DIM, 1.6);
    });
    ctx.strokeStyle = cream();
    ctx.strokeRect(x + 0.5, y + 0.5, 83, 23);
    hit(x, y, 84, 24, toggle);
  }
  function curve(gains, x, y, w, h, color) {
    ctx.fillStyle = color;
    gains.forEach((g, i) => {
      const cx = x + (w * (i + 0.5)) / gains.length;
      const cy = y + h / 2 - (g / 12) * (h / 2);
      ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    });
  }

  // The faint dot grid of the LCD, drawn once.
  const grid = document.createElement("canvas");
  grid.width = SCREEN.w * 2;
  grid.height = SCREEN.h * 2;
  {
    const g = grid.getContext("2d");
    g.scale(2, 2);
    g.fillStyle = GLASS;
    g.fillRect(0, 0, SCREEN.w, SCREEN.h);
    g.fillStyle = cream(0.045);
    for (let y = 3; y < SCREEN.h; y += 6) for (let x = 3; x < SCREEN.w; x += 6) g.fillRect(x, y, 0.9, 0.9);
  }

  // ---------- Pages ----------
  function statusLine() {
    let x = 14;
    x += text("SPUKI.OS", x, 9.5, cream(), 1.3) + 10;
    text(s.powered ? "48.0KHZ" : "---", x, 9.5, DIM, 1.3);
    let r = SCREEN.w - 14;
    for (const p of [...PAGES].reverse()) {
      const w = width(p, 1.3) + 5;
      r -= w;
      if (p === s.page) { ctx.fillStyle = PINK; ctx.fillRect(r, 7, w, 14.1); }
      text(p, r + 2.5, 9.5, p === s.page ? GLASS : DIM, 1.3);
      hit(r - 4, 2, w + 8, 24, () => { s.page = p; s.saving = false; });
      r -= 10;
    }
    rule(0, 27, SCREEN.w);
  }

  function home(now) {
    const t = TRACK;
    const top = 42;
    let x = 16;
    x += text(clock(s.position), x, top, cream(), 3.4, true) + 12;
    x += text("|", x, top, DIM, 3.4) + 12;
    text(clock(t.duration), x, top, cream(), 3.4, true);
    // ■■■■□········
    const lit = Math.floor((34 * s.position) / t.duration);
    for (let i = 0; i < 34; i++) {
      const cx = 16 + i * 8.4, cy = top + 23.8 + 10;
      if (i < lit) { ctx.fillStyle = cream(); ctx.fillRect(cx, cy, 6, 6); }
      else if (i === lit) { ctx.strokeStyle = cream(); ctx.strokeRect(cx + 0.5, cy + 0.5, 5, 5); }
      else { ctx.fillStyle = DIM; ctx.fillRect(cx + 2.2, cy + 2.2, 1.6, 1.6); }
    }
    // Mode badge: ■ 13. R
    const num = modeNumber(), initial = originName()[0].toUpperCase();
    let r = SCREEN.w - 16 - width(initial, 4.2);
    text(initial, r, top, cream(), 4.2);
    r -= 10 + width(num, 4.2);
    text(num, r, top, cream(), 4.2);
    ctx.fillStyle = PINK;
    ctx.fillRect(r - 18, top + 29.4 - 10, 8, 8);
    const title = s.source.mode ?? `${s.slots[s.source.slot].origin}`;
    text(title, SCREEN.w - 16 - width(title, 1.2), top + 35.4, DIM, 1.2);
    // ▶ TITLE - ARTIST
    const ty = top + 43.8 + 12;
    const w = text(s.playing ? "▶" : "||", 16, ty, cream(), 1.6);
    clipped(`${t.title} - ${t.artist}`, 16 + w + 8, ty, 500, cream(), 1.6);
    // Spectrum
    const sy = ty + 11.2 + 12, sh = 268 - sy, sw = SCREEN.w - 32;
    const pitchX = sw / 44, pitchY = sh / 10, cell = Math.min(pitchX, pitchY) * 0.72;
    s.spectrum.forEach((v, c) => {
      const lit = Math.round(v * 10);
      for (let row = 0; row < 10; row++) {
        const fromBottom = 9 - row;
        const cx = 16 + c * pitchX + (pitchX - cell) / 2, cy = sy + row * pitchY + (pitchY - cell) / 2;
        if (fromBottom < lit) {
          ctx.fillStyle = fromBottom === lit - 1 ? cream() : cream(0.55);
          ctx.fillRect(cx, cy, cell, cell);
        } else {
          const d = cell * 0.28;
          ctx.fillStyle = GHOST;
          ctx.fillRect(cx + (cell - d) / 2, cy + (cell - d) / 2, d, d);
        }
      }
    });
    // Ticker
    const on = (b) => (b ? "ON" : "OFF");
    const run = [`MODE ${modeLabel()}`, `VOL ${Math.round(s.volume * 100)}%`,
      `EQ ${on(s.eqOn)}`, `LOUD ${on(s.loudness)}`, `NIGHT ${on(s.night)}`, "MACBOOK PRO SPEAKERS"].join(" · ") + "   ·   ";
    const rw = width(run, 1.4) + 8.4;
    const off = ((now / 1000) * 26) % rw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, 278, SCREEN.w - 32, 14);
    ctx.clip();
    for (let k = 0; k < 3; k++) text(run, 16 - off + k * rw, 280.2, cream(), 1.4);
    ctx.restore();
  }

  function saveControl(x, y, vertical) {
    if (s.savedTo) return text(`SAVED TO M${s.savedTo.i + 1}`, x, y + 6, cream(), 1.4);
    if (s.saving) {
      let cx = x, cy = y;
      const step = (w) => { if (vertical) cy += 28; else cx += w + 8; };
      const lw = text("SAVE AS", cx, cy + 6.5, DIM, 1.3);
      step(lw);
      s.slots.forEach((slot, i) => {
        const w = key(`M${i + 1} ${slot ? slot.origin.slice(0, 8) : "EMPTY"}`, cx, cy, false, () => storeSlot(i));
        step(w);
      });
      return key("CANCEL", cx, cy, false, () => (s.saving = false));
    }
    const slot = savedSlot();
    if (slot >= 0 && s.source.slot === slot) return idleKey(`SAVED M${slot + 1}`, x, y);
    if (unchanged()) return idleKey("SAVE", x, y);
    return key("SAVE", x, y, true, () => (s.saving = true));
  }

  function eqPage() {
    const y0 = 40;
    let x = 16;
    if (!s.saving) {
      x += key(`EQ.${s.eqOn ? "ON" : "OFF"}`, x, y0, s.eqOn, () => { s.eqOn = !s.eqOn; changed(); }) + 10;
      x += key("RESET", x, y0, false, resetEQ) + 10;
    }
    const w = saveControl(x, y0, false);
    if (!s.saving) {
      x += w + 10;
      clipped(`${modeLabel()} ${toneText()}`, x, y0 + 6.5, SCREEN.w - 16 - x, cream(), 1.3);
    }
    // DotEQ
    const gx = 44.4, gy = 72, gw = SCREEN.w - 16 - gx, gh = 182;
    text("+12", 16 + 20.4 - width("+12", 1.2), gy, DIM, 1.2);
    text("0", 16 + 20.4 - width("0", 1.2), gy + gh / 2 - 4.2, DIM, 1.2);
    text("-12", 16 + 20.4 - width("-12", 1.2), gy + gh - 8.4, DIM, 1.2);
    ctx.globalAlpha = s.eqOn ? 1 : 0.35;
    const pitch = gh / 13, colW = gw / 10, cell = Math.min(pitch * 0.7, 9);
    const row = (db) => Math.round((12 - Math.min(Math.max(db, -12), 12)) / 2);
    const zero = row(0);
    s.bands.forEach((b, i) => {
      const total = row(b);
      const cx = gx + colW * (i + 0.5);
      for (let r = 0; r < 13; r++) {
        const y = gy + r * pitch + (pitch - cell) / 2;
        if (r === total) { ctx.fillStyle = cream(); ctx.fillRect(cx - cell, y, cell * 2, cell); }
        else if (r >= Math.min(zero, total) && r <= Math.max(zero, total)) {
          ctx.fillStyle = cream(0.55);
          ctx.fillRect(cx - cell / 2, y, cell, cell);
        } else { ctx.fillStyle = GHOST; ctx.fillRect(cx - 0.8, y + cell / 2 - 0.8, 1.6, 1.6); }
      }
      text(LABELS[i], cx - width(LABELS[i], 1.2) / 2, gy + gh + 7, DIM, 1.2);
      hit(gx + colW * i, gy - 6, colW, gh + 12, null, { band: i, top: gy, h: gh });
    });
    ctx.globalAlpha = 1;
    const peak = Math.max(0, ...heard());
    const auto = `AUTO -${(peak * 0.9 + (s.loudness ? 2 : 0)).toFixed(1)}DB`;
    let r = SCREEN.w - 16 - width(auto, 1.2);
    text(auto, r, 279.6, DIM, 1.2);
    const pk = `PEAK ${fmtDb(Math.round(peak * 10) / 10)}`;
    text(pk, r - 10 - width(pk, 1.2), 279.6, DIM, 1.2);
  }

  const LIST = { x: 224, y: 44, w: 336, h: 240 };
  function modePage() {
    text("MODE", 16, 44, DIM, 1.3);
    ctx.fillStyle = PINK;
    ctx.fillRect(16, 63.1 + 42 - 13, 10, 10);
    text(modeNumber(), 36, 63.1, cream(), 6);
    clipped(s.source.mode ?? s.slots[s.source.slot].origin, 16, 115.1, 190, cream(), 1.8);
    clipped(toneText() || " ", 16, 137.7, 190, DIM, 1.2);
    if (s.saving) saveControl(16, 150, true);
    else {
      saveControl(16, 230, true);
      let x = 16;
      x += key(`LOUD.${s.loudness ? "ON" : "OFF"}`, x, 262, s.loudness, () => { s.loudness = !s.loudness; changed(); }) + 8;
      key(`NIGHT.${s.night ? "ON" : "OFF"}`, x, 262, s.night, () => { s.night = !s.night; changed(); });
    }
    // The list: three slots, a rule, every mode.
    ctx.save();
    ctx.beginPath();
    ctx.rect(LIST.x, LIST.y, LIST.w, LIST.h);
    ctx.clip();
    let y = LIST.y - s.modeScroll;
    const rowBox = (on, action) => {
      if (on) { ctx.fillStyle = PINK; ctx.fillRect(LIST.x, y, LIST.w, 26); }
      else { ctx.strokeStyle = GHOST; ctx.strokeRect(LIST.x + 0.5, y + 0.5, LIST.w - 1, 25); }
      if (action && y + 26 > LIST.y && y < LIST.y + LIST.h) hit(LIST.x, Math.max(y, LIST.y), LIST.w, Math.min(26, LIST.y + LIST.h - y), action);
    };
    s.slots.forEach((slot, i) => {
      const on = s.source.slot === i, fg = on ? GLASS : cream();
      rowBox(on, slot ? () => loadSlot(i) : null);
      let x = LIST.x + 10;
      x += text(`M${i + 1}`, x, y + 7.8, on ? fg : DIM, 1.6) + 12;
      if (slot) {
        x += text(slot.origin, x, y + 7.8, fg, 1.6) + 12;
        clipped(edited(slot.origin, slot.bands), x, y + 8.8, LIST.x + LIST.w - 130 - x, on ? cream(0.6) : DIM, 1.2);
        curve(slot.bands, LIST.x + LIST.w - 120, y + 5, 110, 16, on ? GLASS : cream());
      } else text("EMPTY", x, y + 7.8, DIM, 1.6);
      y += 30;
    });
    rule(LIST.x, y + 1, LIST.w);
    y += 10;
    MODES.forEach(([name, bands], i) => {
      const on = s.source.mode === name, fg = on ? GLASS : cream();
      rowBox(on, () => applyMode(name));
      text(String(i + 1).padStart(2, "0"), LIST.x + 10, y + 7.8, on ? fg : DIM, 1.6);
      clipped(name, LIST.x + 10 + width("00", 1.6) + 12, y + 7.8, 180, fg, 1.6);
      curve(bands, LIST.x + LIST.w - 120, y + 5, 110, 16, fg);
      y += 30;
    });
    ctx.restore();
    s.modeMax = Math.max(0, y + s.modeScroll - LIST.y - LIST.h);
  }

  const previews = new Map();
  const images = new Map();
  const image = (src) => {
    if (!images.has(src)) { const img = new Image(); img.src = src; images.set(src, img); }
    return images.get(src);
  };
  function preview(id, finish, horn) {
    const key = `${id}/${finish ?? ""}/${horn ?? ""}`;
    if (!previews.has(key)) {
      previews.set(key, [
        image(`console/speakers/${id}${finish ? "-" + finish : ""}.png`),
        ...(horn ? [image(`console/speakers/${id}-horn-${horn}.png`)] : []),
        image(`console/speakers/${id}-cone.png`),
      ]);
    }
    return previews.get(key);
  }
  // Load every preview up front, so DESIGN never opens on an empty frame.
  for (const sp of speakers) {
    for (const f of sp.finishes ?? [[null]]) preview(sp.id, f[0], sp.horns?.[0][0]);
    for (const h of sp.horns ?? []) preview(sp.id, sp.finishes[0][0], h[0]);
  }
  const same = (a, b) => a.id === b.id && (a.finish ?? null) === (b.finish ?? null) && (a.horn ?? null) === (b.horn ?? null);

  // A row of colour chips; the picked one ringed.
  function chips(list, picked, x0, cy, pick) {
    list.forEach(([id, , hex], i) => {
      const cx = x0 + 12 + i * 28;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();
      if (id === picked) {
        ctx.beginPath();
        ctx.arc(cx, cy, 11.25, 0, Math.PI * 2);
        ctx.strokeStyle = PINK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      hit(cx - 12, cy - 12, 24, 24, () => pick(id));
    });
  }

  function designPage() {
    const m = speakers.find((x) => x.id === s.pending.id);
    for (const img of preview(m.id, s.pending.finish, s.pending.horn)) {
      if (!img.complete || !img.naturalWidth) continue;
      const k = Math.min(212 / img.naturalWidth, 240 / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      ctx.drawImage(img, 16 + (212 - w) / 2, 44 + (240 - h) / 2, w, h);
    }
    const x0 = 246;
    text("MODEL", x0, 44, DIM, 1.3);
    let x = x0;
    for (const sp of speakers) {
      x += key(sp.name, x, 63.1, sp.id === m.id, () => {
        s.pending = { id: sp.id, finish: sp.finishes?.[0][0] ?? null, horn: sp.horns?.[0][0] ?? null };
      }) + 6;
    }
    text(m.name, x0, 101.1, cream(), 4);
    if (m.finishes) {
      const f = m.finishes.find((q) => q[0] === s.pending.finish) ?? m.finishes[0];
      if (!m.horns) {
        text(f[1], x0, 145.1, DIM, 1.4);
        chips(m.finishes, f[0], x0, 176, (id) => (s.pending = { id: m.id, finish: id }));
      } else {
        // Front and horn picked apart: any front goes with any horn.
        const h = m.horns.find((q) => q[0] === s.pending.horn) ?? m.horns[0];
        text(`FRONT  ${f[1]}`, x0, 141.1, DIM, 1.4);
        chips(m.finishes, f[0], x0, 167, (id) => (s.pending = { ...s.pending, finish: id }));
        text(`HORN  ${h[1]}`, x0, 192.1, DIM, 1.4);
        chips(m.horns, h[0], x0, 218, (id) => (s.pending = { ...s.pending, horn: id }));
      }
    }
    if (same(s.pending, s.applied)) idleKey("ON THE DESKTOP", x0, 262);
    else {
      const w = key("SAVE", x0, 262, true, () => {
        s.applied = { ...s.pending };
        onSpeaker?.(s.applied);
      });
      key("CANCEL", x0 + w + 8, 262, false, () => (s.pending = { ...s.applied }));
    }
  }

  function setPage() {
    const rows = [
      ["OPEN AT LOGIN", "START WITH THE MAC", () => lcdSwitch(s.atLogin, SCREEN.w - 16 - 84, 0, () => (s.atLogin = !s.atLogin))],
      ["SPEAKER ON TOP", "KEEP IT ABOVE OTHER WINDOWS", () => lcdSwitch(s.onTop, SCREEN.w - 16 - 84, 0, () => (s.onTop = !s.onTop))],
      ["CHECK FOR UPDATES", "ASKS GITHUB ONCE A DAY", () => lcdSwitch(s.updates, SCREEN.w - 16 - 84, 0, () => (s.updates = !s.updates))],
      ["QUIT SPUKI", "STOPS THE EQ. SOUND GOES BACK TO NORMAL", () => key("QUIT", SCREEN.w - 16 - (width("QUIT", 1.4) + 16), 0, false, () => onQuit?.())],
    ];
    rows.forEach(([name, about, control], i) => {
      const y = 36 + i * 46;
      text(name, 16, y + 8.3, cream(), 2);
      text(about, 16, y + 8.3 + 14 + 7, DIM, 1.2);
      ctx.save();
      ctx.translate(0, y + (46 - (i === 3 ? 22 : 24)) / 2);
      const before = hits.length;
      control();
      for (const h of hits.slice(before)) h.y += y + (46 - (i === 3 ? 22 : 24)) / 2;
      ctx.restore();
      rule(16, y + 45, SCREEN.w - 32);
    });
    text("SPUKI.OS 0.1.2", 16, SCREEN.h - 12 - 8.4, DIM, 1.2);
  }

  function readoutView(now) {
    const r = s.readout;
    ctx.fillStyle = "rgba(9, 8, 8, 0.94)";
    ctx.fillRect(0, 28, SCREEN.w, SCREEN.h - 28);
    const cy = 28 + (SCREEN.h - 28 - 101) / 2;
    text(r.label, (SCREEN.w - width(r.label, 2)) / 2, cy, cream(), 2);
    text(r.text, (SCREEN.w - width(r.text, 7)) / 2, cy + 28, cream(), 7);
    const f = (r.value - r.lo) / (r.hi - r.lo), at = Math.round(f * 24), mid = 12, centred = r.lo < 0;
    const x0 = (SCREEN.w - (24 * 8 + 23 * 3)) / 2;
    for (let i = 0; i < 24; i++) {
      const on = centred ? i >= Math.min(mid, at) && i < Math.max(mid, at) : i < at;
      ctx.fillStyle = on ? PINK : GHOST;
      ctx.fillRect(x0 + i * 11, cy + 91, 8, 10);
    }
    if (now > r.until) s.readout = null;
  }

  function draw(now) {
    hits = [];
    ctx.drawImage(grid, 0, 0, SCREEN.w, SCREEN.h);
    statusLine();
    ({ home, eq: eqPage, mode: modePage, design: designPage, set: setPage })[s.page === "eq" ? "eq" : s.page](now);
    if (s.readout) readoutView(now);
    if (s.savedTo && now > s.savedTo.until) s.savedTo = null;
    // ScanSheen: a soft reflection across the glass.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(SCREEN.w, 0, 0, SCREEN.h);
    g.addColorStop(0, "rgba(255,255,255,0.045)");
    g.addColorStop(1, "rgba(255,255,255,0.008)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(SCREEN.w * 0.62, 0);
    ctx.lineTo(SCREEN.w, 0);
    ctx.lineTo(SCREEN.w, SCREEN.h);
    ctx.lineTo(SCREEN.w * 0.34, SCREEN.h);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Deck controls ----------
  function showVolume() {
    s.readout = { label: "VOL", value: s.volume, lo: 0, hi: 1.6, text: `${Math.round(s.volume * 100)}%`, until: performance.now() + 1300 };
  }
  // The wheel's MODE edge: the next mode, and where in the list it went (the MODE page shows that itself).
  function nextMode() {
    const i = (MODES.findIndex((m) => m[0] === originName()) + 1) % MODES.length;
    applyMode(MODES[i][0]);
    if (s.page !== "mode") {
      s.readout = { label: "MODE", value: i, lo: 0, hi: MODES.length - 1, text: MODES[i][0], until: performance.now() + 1300 };
    }
  }
  function press(edge) {
    if (edge === 0) return nextMode();
    if (edge === 2) s.playing = !s.playing;
    else {
      // One track: either way starts it over.
      audio?.seek(0);
      s.position = 0;
      s.playing = true;
    }
    changed();
  }

  // The wheel: press one of its four edges; sliding off before letting go cancels, like a key.
  let down = null;
  const edgeAt = (e) => {
    const r = wheel.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width - 0.5) * WHEEL.d, dy = ((e.clientY - r.top) / r.height - 0.5) * WHEEL.d;
    const d = Math.hypot(dx, dy);
    if (d < CENTRE / 2 + 2 || d > WHEEL.d / 2) return null;
    return Math.floor((((Math.atan2(dx, -dy) * 180) / Math.PI + 405) % 360) / 90);
  };
  wheel.addEventListener("pointerdown", (e) => {
    down = edgeAt(e);
    if (down !== null) wheel.setPointerCapture(e.pointerId);
  });
  wheel.addEventListener("pointermove", (e) => {
    if (down === null) wheel.style.cursor = edgeAt(e) === null ? "default" : "pointer";
  });
  wheel.addEventListener("pointerup", (e) => {
    if (down !== null && edgeAt(e) === down) press(down);
    down = null;
  });
  wheel.addEventListener("pointercancel", () => (down = null));
  function drawWheel() {
    const c = wctx, r = WHEEL.d / 2, inner = CENTRE / 2 + 2;
    c.clearRect(0, 0, WHEEL.d, WHEEL.d);
    if (down !== null) {
      // A pressed edge sinks a little.
      const mid = ((down * 90 - 90) * Math.PI) / 180, q = Math.PI / 4;
      c.beginPath();
      c.arc(r, r, r, mid - q, mid + q);
      c.arc(r, r, inner, mid + q, mid - q, true);
      c.fillStyle = "rgba(0, 0, 0, 0.45)";
      c.fill();
    }
    EDGES.forEach((l, i) => {
      const a = (i * Math.PI) / 2, w = width(l, 1.6);
      const x = r + LEGEND_R * Math.sin(a) - w / 2, y = r - LEGEND_R * Math.cos(a) - 5.6 + (down === i ? 0.6 : 0);
      text(l, x, y, i === 2 ? PINK : "rgb(128, 128, 128)", 1.6, false, c);
    });
  }

  // The volume keys on the right edge: + above, - below, 5% a press; held, they keep going.
  root.querySelectorAll(".deck-side").forEach((b) => {
    const dir = b.dataset.i === "0" ? 1 : -1;
    let timer = null;
    const step = () => {
      s.volume = Math.min(Math.max(Math.round((s.volume + dir * 0.05) * 100) / 100, 0), 1.6);
      showVolume();
      changed();
    };
    const stop = () => { clearTimeout(timer); timer = null; };
    b.addEventListener("pointerdown", (e) => {
      b.setPointerCapture(e.pointerId);
      step();
      const again = (wait) => (timer = setTimeout(() => { step(); again(80); }, wait));
      again(400);
    });
    b.addEventListener("pointerup", stop);
    b.addEventListener("pointercancel", stop);
  });

  // The disc mutes, as in the app. Here it also starts the sample when nothing plays yet, so the
  // first thing anyone presses makes a sound.
  discEl.addEventListener("click", () => {
    if (!s.playing) Object.assign(s, { playing: true, powered: true });
    else s.powered = !s.powered;
    changed();
  });

  // Screen: tap keys and tabs, drag EQ columns, scroll the mode list.
  const local = (e) => {
    const r = screen.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SCREEN.w, ((e.clientY - r.top) / r.height) * SCREEN.h];
  };
  const find = (x, y) => hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
  let dragBand = null, dragList = null;
  function setBand(h, y) {
    const db = Math.round((12 - ((y - h.top) / h.h) * 24) / 2) * 2;
    const v = Math.min(Math.max(db, -12), 12);
    if (s.bands[h.band] !== v) { s.bands[h.band] = v; changed(); }
  }
  screen.addEventListener("pointerdown", (e) => {
    const [x, y] = local(e);
    const h = find(x, y);
    if (h?.action) return h.action();
    if (h?.band !== undefined) {
      dragBand = h;
      screen.setPointerCapture(e.pointerId);
      return setBand(h, y);
    }
    if (s.page === "mode" && x >= LIST.x && y >= LIST.y) {
      dragList = { y: e.clientY, from: s.modeScroll };
      screen.setPointerCapture(e.pointerId);
    }
  });
  screen.addEventListener("pointermove", (e) => {
    const [x, y] = local(e);
    if (dragBand) return setBand(dragBand, y);
    if (dragList) {
      s.modeScroll = Math.min(Math.max(dragList.from - (e.clientY - dragList.y) / scale, 0), s.modeMax ?? 0);
      return;
    }
    screen.style.cursor = find(x, y) ? "pointer" : "default";
  });
  screen.addEventListener("pointerup", () => { dragBand = null; dragList = null; });
  screen.addEventListener("dblclick", (e) => {
    const h = find(...local(e));
    if (h?.band !== undefined) { s.bands[h.band] = 0; changed(); }
  });
  screen.addEventListener("wheel", (e) => {
    if (s.page !== "mode") return;
    e.preventDefault();
    s.modeScroll = Math.min(Math.max(s.modeScroll + e.deltaY, 0), s.modeMax ?? 0);
  }, { passive: false });

  // ---------- Loop ----------
  let last = performance.now(), spin = 0, onQuit = null;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (audio) s.position = audio.position;
    // The spectrum of what is actually coming out, after the EQ; it falls away when nothing plays.
    const levels = audio?.levels(44);
    s.spectrum = s.spectrum.map((v, c) => (levels
      ? v + (levels[c] - v) * Math.min(1, dt * (levels[c] > v ? 25 : 8))
      : Math.max(0, v - dt * 1.5)));
    if (s.playing && s.powered) spin = (spin + dt * 24) % 360;
    disc.style.transform = `rotate(${spin}deg)`;
    noteEl.classList.toggle("off", !s.powered);
    if (root.offsetParent) { draw(now); drawWheel(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  changed();

  return {
    // The page's own picker moved the speaker: the DESIGN page follows.
    setSpeaker(sp) { s.applied = { ...sp }; s.pending = { ...sp }; },
    onQuit(fn) { onQuit = fn; },
    // The page's own play button.
    togglePlay() {
      s.playing = !s.playing;
      if (s.playing) s.powered = true;
      changed();
    },
    get state() { return publicState(); },
  };
}
