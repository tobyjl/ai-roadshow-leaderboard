/* ============================================================
   E.ON Next Roadshow — shared schedule / roster / rotation
   Loaded before app.js and timer.js so both pages agree.

   Event days (test days 13th/14th dropped):
     15th  → Day 1
     16th  → Day 2
   Sessions (by time of day), matching the sheet's "Session" column
   format "Day N: <slot>":
     Session 1 = 9:30am   (before 11:00)
     Session 2 = 11:00am  (11:00–12:59)
     Session 3 = 1:00pm   (13:00–14:29)
     Session 4 = 2:30pm   (14:30+)
   ============================================================ */

// Team roster, indexed [dayNum][sessionNum] → [Team1, Team2, Team3, Team4].
// Team N starts the session at Stall N.
const ROSTER = {
    1: {
        1: ['Cortex Turbo', 'Aether Glow',     'Quantum Ohm',    'Cyber Grid'],
        2: ['Zero Battery',  'Synthetic Wave',  'Byte Force',     'Vector Flux'],
        3: ['Binary Surge',  'Pixel Power',     'Neural Pulse',   'Apex Fusion'],
        4: ['Nova Charge',   'Logic Lightning', 'Alpha Amperage', 'Vertex Breaker'],
    },
    2: {
        1: ['Phantom Amp',   'Signal Solar',    'Macro Megawatt', 'Tensor Spark'],
        2: ['Digital Joule', 'Neon Turbine',    'Kinetic Flare',  'Omega Beam'],
        3: ['Cipher Thermal','Plasma Vortex',   'Helix Dynamo',   'Silicon Watt'],
        4: ['Matrix Volt',   'Ghost Current',   'Catalyst Storm', 'Static Core'],
    },
};

const SESSION_SLOTS = [
    { sessionNum: 1, slot: '9:30am',  fromMin: 0,   label: '09:30' },
    { sessionNum: 2, slot: '11:00am', fromMin: 660, label: '11:00' },
    { sessionNum: 3, slot: '1:00pm',  fromMin: 780, label: '13:00' },
    { sessionNum: 4, slot: '2:30pm',  fromMin: 870, label: '14:30' },
];

// Map a calendar date to the event day number. 15th → 1, 16th → 2, else 1.
function dayNumForDate(date) {
    return date.getDate() === 16 ? 2 : 1;
}

// Work out the active day + session from the current time.
function getActiveSlot(now = new Date()) {
    const dayNum = dayNumForDate(now);
    const mins = now.getHours() * 60 + now.getMinutes();

    let s = SESSION_SLOTS[0];
    for (const cand of SESSION_SLOTS) {
        if (mins >= cand.fromMin) s = cand;
    }

    return {
        dayNum,
        sessionNum: s.sessionNum,
        slot: s.slot,
        label: s.label,
        // Must match the sheet's "Session" column exactly.
        sessionString: `Day ${dayNum}: ${s.slot}`,
    };
}

// Team names for the active session (falls back to generic labels off-schedule).
function getRosterForActive(now = new Date()) {
    const { dayNum, sessionNum } = getActiveSlot(now);
    return (ROSTER[dayNum] && ROSTER[dayNum][sessionNum])
        || ['Team 1', 'Team 2', 'Team 3', 'Team 4'];
}

/* ---- Rotation maths ----
   4 teams, 4 stalls, +1 rotation each round (wrapping Stall 4 → Stall 1).
   Team i (0-indexed) during round r (0-indexed) is at stall (i + r) mod 4. */

// occupancy[stallIndex] = teamIndex currently at that stall for the given round.
function occupancyForRound(r) {
    const stalls = [];
    for (let s = 0; s < 4; s++) stalls[s] = ((s - r) % 4 + 4) % 4;
    return stalls;
}

// Movements when rotating out of `r` into the next round: [{teamIndex, from, to}] (1-indexed stalls).
function movementsAfterRound(r) {
    const moves = [];
    for (let i = 0; i < 4; i++) {
        moves.push({
            teamIndex: i,
            from: ((i + r) % 4) + 1,
            to: ((i + r + 1) % 4) + 1,
        });
    }
    // Order by the stall a team is leaving, so it reads left-to-right with the circuit.
    moves.sort((a, b) => a.from - b.from);
    return moves;
}

// Shared CSV cell cleaner.
function cleanField(field) {
    if (!field) return '';
    return field.trim().replace(/^"|"$/g, '');
}

// Test/placeholder rows — any team name containing "TEST" (case-insensitive).
function isTestEntry(name) {
    return (name || '').trim().toUpperCase().includes('TEST');
}
