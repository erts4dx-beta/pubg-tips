(() => {
"use strict";
const TIPS = window.TIPS, CATS = window.CATS, SOURCES = window.SOURCES;
const IMP = {
  core:  {label:"핵심",   chap:"제1장", h:"핵심 수칙", d:"반드시 숙지. 모르면 바로 손해 보는 것들", n:1},
  imp:   {label:"중요",   chap:"제2장", h:"중요 사항", d:"알면 확실히 유리해지는 것들",          n:2},
  minor: {label:"사소한 팁", chap:"제3장", h:"사소한 팁", d:"작은 디테일·편의 기능·짧은 상식",       n:3}
};
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* number tips per chapter: 1-01, 2-07 ... */
const catOrder = Object.keys(CATS);
TIPS.forEach((t, i) => t._i = i);
TIPS.sort((a, b) => (catOrder.indexOf(a.cat) - catOrder.indexOf(b.cat)) || (a._i - b._i));
const counters = {core:0, imp:0, minor:0};
TIPS.forEach(t => { counters[t.imp]++; t.no = IMP[t.imp].n + "-" + String(counters[t.imp]).padStart(2,"0"); });

/* ledger */
$$("#ledger td").forEach(td => { const k = td.dataset.k; td.textContent = k === "all" ? TIPS.length : counters[k]; });

/* ── tabs ── */
const panels = $$(".panel");
function showTab(name){
  if (!panels.some(p => p.dataset.panel === name)) name = "tips";
  panels.forEach(p => p.hidden = p.dataset.panel !== name);
  $$(".tabs a").forEach(a => { if (a.dataset.tab === name) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  document.body.dataset.tab = name;
}
window.addEventListener("hashchange", () => { showTab(location.hash.slice(1)); window.scrollTo({top: $(".tabs").offsetTop}); });
showTab(location.hash.slice(1) || "tips");

/* ── filters ── */
const state = {imp:"all", cats:new Set(Object.keys(CATS)), q:"", patch:false};
const catBox = $("#catFilter");
Object.entries(CATS).forEach(([k, v]) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "cat-btn"; b.dataset.cat = k; b.setAttribute("aria-pressed","true");
  b.innerHTML = `<span>${v}</span><span class="n" data-n="${k}"></span>`;
  catBox.appendChild(b);
});
catBox.addEventListener("click", e => {
  const b = e.target.closest(".cat-btn"); if (!b) return;
  const k = b.dataset.cat;
  // first click when all selected = solo that category (faster), afterwards toggle
  if (state.cats.size === Object.keys(CATS).length) state.cats = new Set([k]);
  else if (state.cats.has(k)) { state.cats.delete(k); if (!state.cats.size) state.cats = new Set(Object.keys(CATS)); }
  else state.cats.add(k);
  render();
});
$("#catReset").addEventListener("click", () => { state.cats = new Set(Object.keys(CATS)); render(); });
$("#impFilter").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.imp = b.dataset.imp; render();
});
let qT; $("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 80); });
$("#onlyPatch").addEventListener("change", e => { state.patch = e.target.checked; render(); });

function hl(text){
  const safe = esc(text);
  if (!state.q) return safe;
  const terms = state.q.split(/\s+/).filter(Boolean).map(t => esc(t).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  if (!terms.length) return safe;
  return safe.replace(new RegExp("(" + terms.join("|") + ")", "gi"), "<mark>$1</mark>");
}
function matchQ(t){
  if (!state.q) return true;
  const hay = (t.t + " " + t.b + " " + CATS[t.cat] + " " + IMP[t.imp].label + " " + (t.tag||"")).toLowerCase();
  return state.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}
function render(){
  $$("#impFilter button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.imp === state.imp)));
  $$(".cat-btn").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
  // category counts respect imp/q/patch filters
  const base = TIPS.filter(t => (state.imp === "all" || t.imp === state.imp) && matchQ(t) && (!state.patch || t.tag));
  $$("[data-n]").forEach(s => s.textContent = base.filter(t => t.cat === s.dataset.n).length);
  const list = base.filter(t => state.cats.has(t.cat));
  const box = $("#tipList");
  if (!list.length){
    box.innerHTML = `<div class="empty">해당 조건의 팁이 없습니다</div>`;
  } else {
    box.innerHTML = Object.keys(IMP).map(k => {
      const items = list.filter(t => t.imp === k);
      if (!items.length) return "";
      const I = IMP[k];
      return `<section class="chapter c-${k}">
        <header class="chap-h"><span class="chap-no">${I.chap}</span><h2>${I.h}</h2><p>${I.d}</p><span class="chap-c">${items.length}항</span></header>
        <div class="grid">${items.map(tipHTML).join("")}</div></section>`;
    }).join("");
  }
  $("#count").textContent = `표시 ${list.length} / 전체 ${TIPS.length}항`;
}
function tipHTML(t){
  const tag = t.tag ? `<span class="tape" title="${t.tag} 패치에서 변경/추가">${t.tag} 패치</span>` : "";
  const chk = t.chk ? `<span class="tape tape-chk">확인 필요</span>` : "";
  const src = t.src.map(s => `<a href="${SOURCES[s][1]}" target="_blank" rel="noopener" title="${esc(SOURCES[s][0])}">${s}</a>`).join("");
  return `<article class="tip" id="tip-${t.no}">
    <div class="tip-no">${t.no}</div>
    <div><h3>${hl(t.t)}</h3><p>${hl(t.b)}</p>
    <div class="tip-meta"><span class="stamp s-${t.imp}">${IMP[t.imp].label}</span><span class="cat-tag">${CATS[t.cat]}</span>${tag}${chk}<span class="srcs">출처${src}</span></div></div>
  </article>`;
}
render();

/* sources list */
const used = {};
TIPS.forEach(t => t.src.forEach(s => (used[s] = used[s] || []).push(t.no)));
$("#srcList").innerHTML = Object.entries(SOURCES).map(([k,[name,url]]) =>
  `<li><span class="sid">${k}</span><span><a href="${url}" target="_blank" rel="noopener">${esc(name)}</a><span class="used">인용 ${used[k] ? used[k].length : 0}회${used[k] ? " · " + used[k].slice(0,8).join(", ") + (used[k].length > 8 ? " …" : "") : ""}</span></span></li>`).join("");

/* ═════════════ 사플 테스트 (Web Audio) ═════════════ */
const DIRS = [
  {k:"N",  name:"정면",    clock:"12시", key:["8","Numpad8","ArrowUp"]},
  {k:"NE", name:"우전방",  clock:"1:30", key:["9","Numpad9"]},
  {k:"E",  name:"우측",    clock:"3시",  key:["6","Numpad6","ArrowRight"]},
  {k:"SE", name:"우후방",  clock:"4:30", key:["3","Numpad3"]},
  {k:"S",  name:"후방",    clock:"6시",  key:["2","Numpad2","ArrowDown"]},
  {k:"SW", name:"좌후방",  clock:"7:30", key:["1","Numpad1"]},
  {k:"W",  name:"좌측",    clock:"9시",  key:["4","Numpad4","ArrowLeft"]},
  {k:"NW", name:"좌전방",  clock:"10:30",key:["7","Numpad7"]}
];
const DIFF = {
  easy:   {label:"훈련병", steps:6, shots:3, replays:Infinity, jitter:0,  wind:0,    near:[3,5],  far:[16,24], desc:"긴 소리(발소리 6보·총성 3발), 다시 듣기 무제한. 정확히 8방위에서만 재생."},
  normal: {label:"일반",   steps:4, shots:2, replays:2,        jitter:0,  wind:0,    near:[3,7],  far:[18,32], desc:"발소리 4보·총성 2발, 다시 듣기 2회. 거리 폭이 넓어짐."},
  hard:   {label:"숙련",   steps:2, shots:1, replays:1,        jitter:12, wind:0.09, near:[3,9],  far:[22,45], desc:"짧은 소리(2보·1발), 다시 듣기 1회, 바람 소음, 방향 ±12° 흔들림."}
};
const compass = $("#compass");
DIRS.forEach((d, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "dir"; b.dataset.i = i; b.disabled = true;
  b.setAttribute("aria-label", `${d.name} (${d.clock} 방향)`);
  b.innerHTML = `${d.name}<small>${d.clock}</small>`;
  const a = i * 45 * Math.PI / 180, R = 38; // percent radius
  b.style.left = (50 + R * Math.sin(a)) + "%";
  b.style.top  = (50 - R * Math.cos(a)) + "%";
  compass.appendChild(b);
});

let ctx = null, master = null, noiseBuf = null, windNode = null;
function audio(){
  if (!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Web Audio API를 지원하지 않는 브라우저입니다.");
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.85;
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setListener(0);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function setListener(yawDeg){
  const L = ctx.listener, y = yawDeg * Math.PI / 180;
  const fx = Math.sin(y), fz = -Math.cos(y), t = ctx.currentTime;
  if (L.forwardX){
    L.positionX.setValueAtTime(0,t); L.positionY.setValueAtTime(0,t); L.positionZ.setValueAtTime(0,t);
    L.forwardX.setValueAtTime(fx,t); L.forwardY.setValueAtTime(0,t); L.forwardZ.setValueAtTime(fz,t);
    L.upX.setValueAtTime(0,t); L.upY.setValueAtTime(1,t); L.upZ.setValueAtTime(0,t);
  } else { L.setPosition(0,0,0); L.setOrientation(fx,0,fz,0,1,0); }
}
function noise(t, dur, dest){
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  s.connect(dest); s.start(t, Math.random() * 1.5, dur + 0.05); return s;
}
function env(g, t, peak, atk, dec){
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
}
function filt(type, f, q=0.8){ const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; }

/* synthesized footstep: heel thump + scuff (band noise) + gravel crunch */
function footstep(t, dest, foot){
  const tone = 1 + (foot ? 0.06 : -0.06) + (Math.random() - .5) * 0.08;
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(95 * tone, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
  env(og, t, 0.9, 0.004, 0.11); o.connect(og).connect(dest); o.start(t); o.stop(t + 0.2);
  const bp = filt("bandpass", (520 + Math.random() * 280) * tone, 1.1), g1 = ctx.createGain();
  env(g1, t + 0.012, 0.75, 0.006, 0.13); noise(t, 0.2, bp); bp.connect(g1).connect(dest);
  for (let k = 0; k < 4; k++){ // crunchy grains
    const hp = filt("highpass", 2200 + Math.random() * 1800, 0.7), g2 = ctx.createGain(), tt = t + 0.02 + Math.random() * 0.07;
    env(g2, tt, 0.22 + Math.random() * 0.2, 0.002, 0.025 + Math.random() * 0.03); noise(tt, 0.08, hp); hp.connect(g2).connect(dest);
  }
}
/* synthesized gunshot: crack transient + body sweep + low boom + tail */
function gunshot(t, dest, far){
  const hp = filt("highpass", 1400, 0.7), g1 = ctx.createGain();
  env(g1, t, far ? 0.5 : 1.0, 0.0008, 0.05); noise(t, 0.08, hp); hp.connect(g1).connect(dest);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(far ? 2200 : 7000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.22);
  const g2 = ctx.createGain(); env(g2, t, 1.0, 0.002, 0.28); noise(t, 0.35, lp); lp.connect(g2).connect(dest);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
  env(og, t, 0.9, 0.003, 0.3); o.connect(og).connect(dest); o.start(t); o.stop(t + 0.4);
  const lp2 = filt("lowpass", far ? 420 : 700, 0.5), g3 = ctx.createGain(), tail = far ? 1.3 : 0.7;
  env(g3, t + 0.05, far ? 0.32 : 0.18, 0.04, tail); noise(t, tail + 0.2, lp2); lp2.connect(g3).connect(dest);
}
function startWind(level){
  stopWind(); if (!level) return;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const lp = filt("lowpass", 380, 0.4), g = ctx.createGain(); g.gain.value = 0;
  g.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.4);
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.23; lg.gain.value = 160;
  lfo.connect(lg).connect(lp.frequency); lfo.start();
  s.connect(lp).connect(g).connect(master); s.start();
  windNode = {s, lfo, g};
}
function stopWind(){ if (windNode){ try{ windNode.s.stop(); windNode.lfo.stop(); }catch(e){} windNode = null; } }

let busyUntil = 0;
function playRound(r, yaw = 0){
  audio(); setListener(yaw);
  const t0 = ctx.currentTime + 0.12;
  const a = (r.dir * 45 + r.jit) * Math.PI / 180;
  const p = ctx.createPanner();
  p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 2; p.rolloffFactor = 0.65; p.maxDistance = 1000;
  const x = r.dist * Math.sin(a), z = -r.dist * Math.cos(a);
  if (p.positionX){ p.positionX.value = x; p.positionY.value = 0; p.positionZ.value = z; } else p.setPosition(x, 0, z);
  const air = filt("lowpass", r.far ? 2600 : 16000, 0.5); // air absorption for distant sources
  const pre = ctx.createGain(); pre.gain.value = r.type === "shot" ? 0.9 : 1.6;
  pre.connect(air).connect(p).connect(master);
  const D = DIFF[game.diff];
  let end = t0;
  if (r.type === "steps"){
    const iv = r.run ? 0.31 : 0.5;
    for (let i = 0; i < D.steps; i++){ const tt = t0 + i * iv + Math.random() * 0.03; footstep(tt, pre, i % 2); end = tt + 0.25; }
  } else {
    const iv = D.shots > 1 && Math.random() < 0.5 ? 0.13 : 0.55;
    for (let i = 0; i < D.shots; i++){ const tt = t0 + i * iv; gunshot(tt, pre, r.far); end = tt + (r.far ? 1.5 : 0.9); }
  }
  busyUntil = performance.now() + (end - ctx.currentTime) * 1000;
  // head-turn visual
  $(".me-arrow").style.transform = `rotate(${yaw}deg)`;
  if (yaw) setTimeout(() => { $(".me-arrow").style.transform = ""; }, Math.max(600, (end - ctx.currentTime) * 1000));
}

/* game state */
const game = {diff:"easy", useDist:false, total:10, i:0, score:0, exact:0, adj:0, fb:0, distHit:0, cur:null, answered:true, replays:0, pickDir:null, pickDist:null, running:false};
const rand = (a, b) => a + Math.random() * (b - a);
function newRound(){
  const D = DIFF[game.diff];
  const far = Math.random() < 0.5;
  game.cur = {
    dir: Math.floor(Math.random() * 8),
    jit: D.jitter ? rand(-D.jitter, D.jitter) : 0,
    far, dist: far ? rand(...D.far) : rand(...D.near),
    type: Math.random() < 0.5 ? "steps" : "shot",
    run: Math.random() < 0.6
  };
  game.answered = false; game.replays = D.replays; game.pickDir = null; game.pickDist = null;
  $$(".dir").forEach(b => { b.className = "dir"; b.disabled = false; });
  $$(".dbtn").forEach(b => b.className = "dbtn");
  setStatus(`라운드 <b>${game.i + 1}</b> — 소리를 듣고 방향을 고르세요.${game.useDist ? " 거리(근/원)도 선택해야 판정됩니다." : ""}`);
  playRound(game.cur);
  updUI();
}
function setStatus(h){ $("#status").innerHTML = h; }
function updUI(){
  $("#sRound").textContent = `${Math.min(game.i + (game.answered ? 0 : 1), game.total)} / ${game.total}`;
  $("#sScore").textContent = game.score;
  const done = game.i;
  $("#sAcc").textContent = done ? Math.round(game.exact / done * 100) + "%" : "-";
  $("#sAdj").textContent = game.adj;
  $("#sFB").textContent = game.fb;
  $("#sDist").textContent = game.useDist && done ? `${game.distHit} / ${done}` : (game.useDist ? "0" : "끔");
  const live = game.running && !game.answered;
  $("#replayBtn").disabled = !live || game.replays <= 0;
  $("#turnL").disabled = $("#turnR").disabled = !live || game.replays <= 0;
  $("#replayLeft").textContent = live ? (game.replays === Infinity ? "(∞)" : `(${game.replays})`) : "";
  $("#nextBtn").disabled = !(game.running && game.answered && game.i < game.total);
  $("#distRow").hidden = !game.useDist;
  const best = JSON.parse(localStorage.getItem("fm-best") || "{}")[bestKey()];
  $("#sBest").textContent = best ? `${best.score}점 · 정확도 ${best.acc}% (${DIFF[game.diff].label}, ${game.total}R${game.useDist ? ", 거리 포함" : ""})` : "기록 없음";
}
const bestKey = () => `${game.diff}-${game.total}-${game.useDist ? 1 : 0}`;
function circDiff(a, b){ const d = Math.abs(a - b) % 8; return Math.min(d, 8 - d); }
const mirrorFB = i => (12 - i) % 8; // front<->back mirror: N<->S, NE<->SE, NW<->SW, E/W stay
function tryJudge(){
  if (game.answered || game.pickDir === null) return;
  if (game.useDist && game.pickDist === null) return;
  game.answered = true;
  const r = game.cur, g = game.pickDir, d = circDiff(g, r.dir);
  let pts = d === 0 ? 100 : d === 1 ? 40 : 0;
  if (d === 0) game.exact++; else if (d === 1) game.adj++;
  const isFB = d !== 0 && mirrorFB(r.dir) === g && r.dir % 4 !== 2;
  if (isFB) game.fb++;
  let distOk = null;
  if (game.useDist){ distOk = (game.pickDist === "far") === r.far; if (distOk){ pts += 30; game.distHit++; } }
  game.score += pts; game.i++;
  $$(".dir").forEach(b => { b.disabled = true; const i = +b.dataset.i; if (i === r.dir) b.classList.add("right"); else if (i === g) b.classList.add("wrong"); });
  $$(".dbtn").forEach(b => { if ((b.dataset.dist === "far") === r.far) b.classList.add("right"); });
  const D = DIRS[r.dir], what = r.type === "steps" ? (r.run ? "달리는 발소리" : "걷는 발소리") : "총성";
  const verdict = d === 0 ? "<b>정답</b>" : d === 1 ? "<b>근접</b>(바로 옆 방향)" : isFB ? "<b>오답 — 앞뒤 혼동</b>" : "<b>오답</b>";
  setStatus(`${verdict} +${pts}점 · 정답: ${D.clock} ${D.name}, ${r.far ? "원거리" : "근거리"}(약 ${Math.round(r.dist)}m), ${what}${distOk === null ? "" : distOk ? " · 거리 적중" : " · 거리 틀림"}`);
  const li = document.createElement("li");
  li.innerHTML = `<span>R${game.i}</span><span>${D.name}${r.far ? "·원" : "·근"} ← 선택 ${DIRS[g].name}${game.useDist ? (game.pickDist === "far" ? "·원" : "·근") : ""}</span><span class="${d === 0 ? "ok" : "no"}">+${pts}</span>`;
  $("#log").prepend(li);
  if (game.i >= game.total) finish();
  updUI();
}
function finish(){
  game.running = false; stopWind();
  const acc = Math.round(game.exact / game.total * 100);
  const grade = acc >= 80 ? ["우수 사수","s-imp"] : acc >= 50 ? ["합격","s-minor"] : ["재교육","s-core"];
  const store = JSON.parse(localStorage.getItem("fm-best") || "{}"), k = bestKey();
  if (!store[k] || store[k].score < game.score){ store[k] = {score:game.score, acc}; localStorage.setItem("fm-best", JSON.stringify(store)); }
  const old = $(".result"); if (old) old.remove();
  const div = document.createElement("div"); div.className = "result";
  div.innerHTML = `<span class="stamp ${grade[1]}">${grade[0]}</span><div><b>훈련 종료</b> — ${game.total}라운드 ${game.score}점, 방향 정확도 ${acc}%, 인접 ${game.adj}회, 앞뒤 혼동 ${game.fb}회${game.useDist ? `, 거리 적중 ${game.distHit}/${game.total}` : ""}.<br>${game.fb >= 2 ? "앞뒤 혼동이 잦다면 ‘고개 45°’ 버튼으로 머리를 돌려 비교하는 연습을 해보세요." : "난이도를 올리거나 거리 맞히기를 켜 보세요."}</div>`;
  $("#status").after(div);
  $("#startBtn").textContent = "다시 시작";
}
function start(){
  try { audio(); } catch(e){ setStatus(e.message); return; }
  Object.assign(game, {i:0, score:0, exact:0, adj:0, fb:0, distHit:0, running:true, total:+$("#roundSel").value, useDist:$("#useDist").checked});
  $("#log").innerHTML = ""; const old = $(".result"); if (old) old.remove();
  $("#startBtn").textContent = "처음부터";
  startWind(DIFF[game.diff].wind);
  newRound();
}
function replay(yaw){
  if (game.answered || game.replays <= 0 || performance.now() < busyUntil) return;
  game.replays--; playRound(game.cur, yaw); updUI();
}

compass.addEventListener("click", e => {
  const b = e.target.closest(".dir"); if (!b || b.disabled) return;
  game.pickDir = +b.dataset.i;
  $$(".dir").forEach(x => x.classList.toggle("sel", x === b));
  tryJudge();
});
$("#distRow").addEventListener("click", e => {
  const b = e.target.closest(".dbtn"); if (!b || game.answered || !game.running) return;
  game.pickDist = b.dataset.dist;
  $$(".dbtn").forEach(x => x.classList.toggle("sel", x === b));
  tryJudge();
});
$("#startBtn").addEventListener("click", start);
$("#nextBtn").addEventListener("click", () => { if (!game.answered || game.i >= game.total) return; newRound(); });
$("#replayBtn").addEventListener("click", () => replay(0));
$("#turnL").addEventListener("click", () => replay(-45));
$("#turnR").addEventListener("click", () => replay(45));
$("#useDist").addEventListener("change", e => { if (!game.running){ game.useDist = e.target.checked; updUI(); } else e.target.checked = game.useDist; });
$("#roundSel").addEventListener("change", e => { if (!game.running){ game.total = +e.target.value; updUI(); } else e.target.value = game.total; });
$("#diffSel").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || game.running) return;
  game.diff = b.dataset.diff;
  $$("#diffSel button").forEach(x => x.setAttribute("aria-checked", String(x === b)));
  $("#diffDesc").textContent = DIFF[game.diff].desc; updUI();
});
$("#diffDesc").textContent = DIFF.easy.desc;
$("#hpCheck").addEventListener("click", () => {
  try { audio(); } catch(e){ setStatus(e.message); return; }
  const tick = (t, pan, f) => {
    const sp = ctx.createStereoPanner(); sp.pan.value = pan;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = f;
    const lp = filt("lowpass", 2400); env(g, t, 0.25, 0.005, 0.25);
    o.connect(lp).connect(g).connect(sp).connect(master); o.start(t); o.stop(t + 0.3);
  };
  const t = ctx.currentTime + 0.05;
  tick(t, -1, 520); tick(t + 0.35, -1, 520); tick(t + 1.0, 1, 780); tick(t + 1.35, 1, 780);
  setStatus("확인음: 먼저 <b>왼쪽</b> 귀에서 낮은 음 2번, 다음 <b>오른쪽</b> 귀에서 높은 음 2번이 들려야 합니다. 반대로 들리면 헤드폰을 바꿔 쓰세요.");
});
document.addEventListener("keydown", e => {
  if (document.body.dataset.tab !== "soundtest" || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = DIRS.findIndex(d => d.key.includes(e.code) || d.key.includes(e.key));
  if (i >= 0 && game.running && !game.answered){ e.preventDefault(); compass.querySelector(`.dir[data-i="${i}"]`).click(); return; }
  const k = e.key.toLowerCase();
  if (k === "r"){ replay(0); }
  else if ((k === "n" || k === "f") && game.useDist && game.running && !game.answered){ $(`.dbtn[data-dist="${k === "n" ? "near" : "far"}"]`).click(); }
  else if (k === "enter" && game.running && game.answered && game.i < game.total){ newRound(); }
});
updUI();

/* test hook for automated checks (no UI effect) */
window.__fm = {game, DIRS, start, play: r => playRound(r), judge: (dir, dist) => { game.pickDir = dir; game.pickDist = dist || null; tryJudge(); }};
})();
