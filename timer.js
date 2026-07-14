/* ============================================================
   E.ON Next Roadshow — Live Timer logic
   Sequence: Stall1 → transit → Stall2 → transit → Stall3 → transit → Stall4
   4 stalls @ 10:00, 3 transits @ 1:30. Total run 44:30.
   ============================================================ */

// ---- Phase definition ----
const STALL_SECONDS = 10 * 60; // 600
const TRANSIT_SECONDS = 90;    // 1:30

const PHASES = [
    { type: 'stall',   stall: 1,        duration: STALL_SECONDS },
    { type: 'transit', from: 1, to: 2,  duration: TRANSIT_SECONDS },
    { type: 'stall',   stall: 2,        duration: STALL_SECONDS },
    { type: 'transit', from: 2, to: 3,  duration: TRANSIT_SECONDS },
    { type: 'stall',   stall: 3,        duration: STALL_SECONDS },
    { type: 'transit', from: 3, to: 4,  duration: TRANSIT_SECONDS },
    { type: 'stall',   stall: 4,        duration: STALL_SECONDS },
];
const TOTAL_SECONDS = PHASES.reduce((s, p) => s + p.duration, 0);

// ---- State ----
let phaseIndex = 0;
let remainingMs = PHASES[0].duration * 1000;
let phaseEndTime = null;   // wall-clock target while running
let isRunning = false;
let finished = false;
let tickInterval = null;

// ---- DOM ----
const bodyEl      = document.body;
const clockEl     = document.getElementById('clock');
const phaseLabel  = document.getElementById('phase-label');
const phaseSub    = document.getElementById('phase-sub');
const overallEl   = document.getElementById('overall');
const startBtn    = document.getElementById('start-btn');
const resetBtn    = document.getElementById('reset-btn');
const skipBtn     = document.getElementById('skip-btn');
const flashEl     = document.getElementById('flash-overlay');
const journeyEl   = document.getElementById('journey');
const assignEl    = document.getElementById('assignments');
const missingEl   = document.getElementById('missing-flag');

// ============================================================
//  Time helpers
// ============================================================
function fmt(totalSeconds) {
    totalSeconds = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function totalRemainingSeconds() {
    let s = remainingMs / 1000;
    for (let i = phaseIndex + 1; i < PHASES.length; i++) s += PHASES[i].duration;
    return s;
}

// ============================================================
//  Audio (Web Audio API — unlocked by the operator's Start click)
// ============================================================
let audioCtx = null;
function ensureAudio() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(freq, offset, duration, gainVal = 0.3) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime + offset;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainVal, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.start(t);
    o.stop(t + duration + 0.03);
}
function playChime(kind) {
    ensureAudio();
    if (kind === 'transit') {          // urgent: move now
        beep(880, 0, 0.16); beep(880, 0.20, 0.16); beep(1174, 0.40, 0.4);
    } else if (kind === 'stall') {     // arriving at a stall: calm two-tone
        beep(587, 0, 0.22); beep(880, 0.24, 0.4);
    } else if (kind === 'finish') {    // celebratory rising run
        beep(587, 0, 0.2); beep(740, 0.22, 0.2); beep(880, 0.44, 0.2); beep(1174, 0.66, 0.6);
    }
}

// ============================================================
//  Visual flash
// ============================================================
function flash(color) {
    flashEl.style.background = color;
    flashEl.classList.remove('fire');
    // force reflow so the animation restarts every time
    void flashEl.offsetWidth;
    flashEl.classList.add('fire');
}

function alertPhaseChange(kind) {
    if (kind === 'transit')      flash('#ff4822');
    else if (kind === 'stall')   flash('#ffffff');
    else if (kind === 'finish')  flash('#2f9e6f');
    playChime(kind);
}

// ============================================================
//  Rendering
// ============================================================
function phaseThemeClass() {
    if (finished) return 'phase-finished';
    if (!isRunning && phaseEndTime === null) return 'phase-idle';
    return PHASES[phaseIndex].type === 'transit' ? 'phase-transit' : 'phase-stall';
}

function updateJourney() {
    journeyEl.querySelectorAll('.stop, .leg').forEach(el => {
        const idx = parseInt(el.dataset.phase, 10);
        el.classList.remove('active', 'done');
        if (finished || idx < phaseIndex) el.classList.add('done');
        else if (idx === phaseIndex && !finished) el.classList.add('active');
    });
}

function isIdle() {
    return phaseEndTime === null && !isRunning && phaseIndex === 0
        && remainingMs === PHASES[0].duration * 1000;
}

// How many stall-rounds are fully finished at the current phase (0–4).
function completedRounds() {
    if (finished) return 4;
    if (isIdle()) return 0;
    const p = PHASES[phaseIndex];
    return p.type === 'stall' ? p.stall - 1 : (phaseIndex + 1) / 2;
}

function updateDisplay() {
    bodyEl.className = phaseThemeClass();

    if (finished) {
        clockEl.textContent = '0:00';
        clockEl.classList.remove('ending');
        phaseLabel.textContent = '✅ Complete';
        phaseSub.textContent = 'All four rounds complete — well done!';
        overallEl.textContent = `Total run ${fmt(TOTAL_SECONDS)}`;
        startBtn.textContent = '▶ Start';
        updateJourney();
        renderAssignments();
        return;
    }

    const p = PHASES[phaseIndex];
    const secs = remainingMs / 1000;
    clockEl.textContent = fmt(secs);

    if (isIdle()) {
        phaseLabel.textContent = 'Ready to start';
        phaseSub.textContent = '4 rounds · 10:00 at each stall · 1:30 to rotate';
    } else if (p.type === 'stall') {
        phaseLabel.textContent = `Round ${p.stall} of 4`;
        phaseSub.textContent = isRunning ? '10 minutes — teams at their stalls' : 'Paused';
    } else {
        phaseLabel.textContent = 'Rotate →';
        phaseSub.textContent = isRunning ? 'Each team, head to your next stall' : 'Paused';
    }

    // Pulse the clock in the last 10 seconds of a running phase
    clockEl.classList.toggle('ending', isRunning && secs <= 10);

    overallEl.textContent = `Total remaining ${fmt(totalRemainingSeconds())} · of ${fmt(TOTAL_SECONDS)}`;
    startBtn.textContent = isRunning ? '⏸ Pause' : (phaseEndTime === null ? '▶ Start' : '▶ Resume');
    updateJourney();
    renderAssignments();
    renderMissingFlag();
}

// Per-team codes for the active session, kept fresh by refreshBoard() below.
let sessionCodes = {};
let lastMissingHtml = null;

// Flag teams that should have a stall scored by now (based on completed rounds) but don't.
function renderMissingFlag() {
    if (!missingEl) return;
    const teams = getRosterForActive();
    const done = completedRounds();
    const missing = [];

    for (let i = 0; i < 4; i++) {
        const codes = sessionCodes[teams[i].trim().toLowerCase()] || [];
        for (let r = 0; r < done; r++) {
            const code = expectedCode(i, r);
            if (!codes.includes(code)) {
                missing.push({ team: teams[i], stall: ((i + r) % 4) + 1, code });
            }
        }
    }

    const html = missing.length === 0
        ? ''
        : `<div class="missing-title">⚠ Missing scores</div>` +
          missing.map(m => `<div class="missing-item">${m.team} · <strong>Stall ${m.stall}</strong> (${m.code})</div>`).join('');

    if (html !== lastMissingHtml) {
        missingEl.innerHTML = html;
        missingEl.classList.toggle('has-missing', missing.length > 0);
        lastMissingHtml = html;
    }
}

// Per-team panel: stall occupancy during a round, per-team moves during a rotation.
function renderAssignments() {
    if (finished) { assignEl.innerHTML = ''; return; }

    const teams = getRosterForActive();
    const p = PHASES[phaseIndex];

    if (p.type === 'stall') {
        // Round r (0-indexed) = p.stall - 1. Show which team is at each stall.
        const r = p.stall - 1;
        const occ = occupancyForRound(r);
        assignEl.innerHTML = occ.map((teamIdx, s) => `
            <div class="assign-chip stall">
                <span class="chip-stall">Stall ${s + 1}</span>
                <span class="chip-team">${teams[teamIdx]}</span>
            </div>`).join('');
    } else {
        // Transit after round r. Show each team's next stall.
        const r = (phaseIndex - 1) / 2;
        const moves = movementsAfterRound(r);
        assignEl.innerHTML = moves.map(m => `
            <div class="assign-chip move">
                <span class="chip-team">${teams[m.teamIndex]}</span>
                <span class="chip-arrow">→</span>
                <span class="chip-stall">Stall ${m.to}</span>
            </div>`).join('');
    }
}

// ============================================================
//  Timer engine
// ============================================================
function tick() {
    remainingMs = phaseEndTime - Date.now();
    if (remainingMs <= 0) {
        advancePhase();
        return;
    }
    updateDisplay();
}

function advancePhase() {
    if (phaseIndex >= PHASES.length - 1) {
        finished = true;
        isRunning = false;
        clearInterval(tickInterval);
        remainingMs = 0;
        alertPhaseChange('finish');
        updateDisplay();
        return;
    }
    phaseIndex++;
    remainingMs = PHASES[phaseIndex].duration * 1000;
    phaseEndTime = Date.now() + remainingMs;
    alertPhaseChange(PHASES[phaseIndex].type);
    updateDisplay();
}

function start() {
    if (finished) { reset(); }
    if (isRunning) return;
    ensureAudio();
    isRunning = true;
    phaseEndTime = Date.now() + remainingMs;
    clearInterval(tickInterval);
    tickInterval = setInterval(tick, 200);
    updateDisplay();
}

function pause() {
    if (!isRunning) return;
    remainingMs = Math.max(0, phaseEndTime - Date.now());
    isRunning = false;
    clearInterval(tickInterval);
    updateDisplay();
}

function toggle() { isRunning ? pause() : start(); }

function reset() {
    clearInterval(tickInterval);
    isRunning = false;
    finished = false;
    phaseIndex = 0;
    remainingMs = PHASES[0].duration * 1000;
    phaseEndTime = null;
    updateDisplay();
}

function skip() {
    // Operator override: jump to the next phase immediately.
    if (finished) return;
    const wasRunning = isRunning;
    advancePhase();                       // moves on, sets phaseEndTime, may finish
    if (finished || wasRunning) return;   // running case is already correct
    // Was paused before the skip — stay paused on the new phase.
    isRunning = false;
    clearInterval(tickInterval);
    remainingMs = PHASES[phaseIndex].duration * 1000;
    updateDisplay();
}

// ---- Controls ----
startBtn.addEventListener('click', toggle);
resetBtn.addEventListener('click', reset);
skipBtn.addEventListener('click', skip);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
});

// ============================================================
//  Live "Current Session" leaderboard (mirrors the main board)
// ============================================================
const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4';
const sheetName = 'leaderboard';
const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

const sideContainer = document.getElementById('side-container');
const sideSession   = document.getElementById('side-session');
const sideUpdated   = document.getElementById('side-updated');
let lastBoardSuccess = null;

function clockTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderBoard(rows, revealed) {
    if (rows.length === 0) {
        return '<p class="loading">No scores recorded for this session yet.</p>';
    }

    if (!revealed) {
        // Suspense: show progress, not scores, until the operator reveals.
        const byName = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        let html = '<table class="leaderboard-table"><tr><th>Team</th><th>Status</th><th>Stalls</th></tr>';
        byName.forEach(item => {
            const status = item.complete
                ? '<span class="pending ready">🔒 Ready</span>'
                : `<span class="pending">${item.codes.length} / 4</span>`;
            html += `<tr>
                <td>${item.name}</td>
                <td>${status}</td>
                <td><span class="stall-badge">${item.stalls || '-'}</span></td>
            </tr>`;
        });
        return html + '</table>';
    }

    const ranked = [...rows].sort((a, b) => b.score - a.score);
    let html = '<table class="leaderboard-table"><tr><th>Rank</th><th>Team</th><th>Score</th><th>Stalls</th></tr>';
    ranked.forEach((item, i) => {
        html += `<tr>
            <td>#${i + 1}</td>
            <td>${item.name}</td>
            <td><strong>${item.score}</strong> / 40</td>
            <td><span class="stall-badge">${item.stalls || '-'}</span></td>
        </tr>`;
    });
    return html + '</table>';
}

function refreshBoard() {
    const active = getActiveSlot();
    const target = active.sessionString;
    sideSession.textContent = `Day ${active.dayNum} · Session ${active.sessionNum} (${active.label})`;

    fetch(sheetUrl)
        .then(r => r.text())
        .then(csv => {
            const rows = csv.split('\n');
            rows.shift();
            const teams = [];
            const codesByName = {};
            rows.forEach(row => {
                if (!row.trim()) return;
                const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (cols.length < 4) return;
                const session = cleanField(cols[1]);
                const name = cleanField(cols[2]);
                const score = parseInt(cleanField(cols[3])) || 0;
                const stalls = cols[4] ? cleanField(cols[4]) : '-';
                if (name && session === target && !isTestEntry(name)) {
                    const codes = parseVisited(stalls);
                    codesByName[name.trim().toLowerCase()] = codes;
                    teams.push({ name, score, stalls, codes, complete: hasAllStalls(codes) });
                }
            });
            sessionCodes = codesByName;
            sideContainer.innerHTML = renderBoard(teams, isRevealed(target));
            renderMissingFlag();

            lastBoardSuccess = new Date();
            sideUpdated.textContent = `Last updated: ${clockTime(lastBoardSuccess)}`;
            sideUpdated.classList.remove('stale');
        })
        .catch(err => {
            console.error('Board sync problem:', err);
            const suffix = lastBoardSuccess ? ` (last success ${clockTime(lastBoardSuccess)})` : '';
            sideUpdated.textContent = `Update failed${suffix}`;
            sideUpdated.classList.add('stale');
        });
}

// ---- Boot ----
reset();
refreshBoard();
setInterval(refreshBoard, 15000);
