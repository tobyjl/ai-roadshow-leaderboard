// Configuration Setup - Updated Sheet ID and lowercase Tab Name
const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4'; 
const sheetName = 'leaderboard'; 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

let isAutoMode = true;

// DOM Elements
const sessionSelect = document.getElementById('session-select');
const autoToggleBtn = document.getElementById('auto-toggle-btn');
const testToggleBtn = document.getElementById('test-toggle-btn');
const revealBtn = document.getElementById('reveal-btn');
const lastUpdatedEl = document.getElementById('last-updated');

let lastSuccessTime = null;
// Set to a session string for one render after Reveal is clicked, to trigger the animation.
let justRevealed = null;

// Hide test entries by default; remember the operator's choice across refreshes.
let hideTests = localStorage.getItem('hideTests') !== 'false';

function syncTestToggle() {
    testToggleBtn.classList.toggle('active', hideTests);
    testToggleBtn.innerText = hideTests ? '🧹 Hide Test Entries' : '👁 Show Test Entries';
}

// isRevealed / setRevealed live in schedule.js (shared with the timer page).
function syncRevealBtn() {
    const revealed = isRevealed(sessionSelect.value);
    revealBtn.classList.toggle('active', revealed);
    revealBtn.innerText = revealed ? '🙈 Hide Scores Again' : '🎭 Reveal Scores';
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Session detection and cleanField now live in schedule.js (shared with the timer).

function generateTableHTML(dataList) {
    if (dataList.length === 0) {
        return '<p class="loading">No event scores recorded here yet.</p>';
    }

    let html = '<table class="leaderboard-table">';
    html += '<tr><th>Rank</th><th>Team Name</th><th>Score</th><th>Stalls</th></tr>';

    dataList.forEach((item, index) => {
        html += `<tr>
                    <td>#${index + 1}</td>
                    <td>${item.name}</td>
                    <td><strong>${item.score}</strong> / 40</td>
                    <td><span class="stall-badge">${item.stalls || '-'}</span></td>
                 </tr>`;
    });

    html += '</table>';
    return html;
}

// Current-session panel: scores hidden until Reveal, then a dramatic reveal.
function generateSessionHTML(dataList, revealed, animate) {
    if (dataList.length === 0) {
        return '<p class="loading">No teams recorded for this session yet.</p>';
    }

    if (!revealed) {
        // Live scores while teams are still on the circuit; a team's score only
        // hides once their final (4th) stall is in, holding it for the reveal.
        const active = dataList.filter(t => !t.complete).sort((a, b) => b.score - a.score);
        const locked = dataList.filter(t => t.complete).sort((a, b) => a.name.localeCompare(b.name));
        let html = '<table class="leaderboard-table">';
        html += '<tr><th>Team Name</th><th>Score</th><th>Stalls</th></tr>';
        [...active, ...locked].forEach(item => {
            const scoreCell = item.complete
                ? '<span class="pending ready">🔒 Locked in</span>'
                : `<strong>${item.score}</strong> / 40`;
            html += `<tr>
                        <td>${item.name}</td>
                        <td>${scoreCell}</td>
                        <td><span class="stall-badge">${item.stalls || '-'}</span></td>
                     </tr>`;
        });
        html += '</table>';
        return html;
    }

    // Revealed — ranked scoreboard, optionally animated in.
    const ranked = [...dataList].sort((a, b) => b.score - a.score);
    let html = `<table class="leaderboard-table${animate ? ' revealing' : ''}">`;
    html += '<tr><th>Rank</th><th>Team Name</th><th>Score</th><th>Stalls</th></tr>';
    ranked.forEach((item, index) => {
        const delay = animate ? ` style="animation-delay:${index * 0.45}s"` : '';
        const scoreCell = animate
            ? `<strong class="countup" data-target="${item.score}">0</strong> / 40`
            : `<strong>${item.score}</strong> / 40`;
        html += `<tr${delay}>
                    <td>#${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${scoreCell}</td>
                    <td><span class="stall-badge">${item.stalls || '-'}</span></td>
                 </tr>`;
    });
    html += '</table>';
    return html;
}

// Count each revealed score up from zero for a bit of drama.
function runCountUps(container) {
    container.querySelectorAll('.countup').forEach(el => {
        const target = parseInt(el.dataset.target, 10) || 0;
        const start = performance.now();
        const duration = 1400;
        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(eased * target);
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    });
}

function processLeaderboards() {
    if (isAutoMode) {
        sessionSelect.value = getActiveSlot().sessionString;
    }

    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split('\n');
            rows.shift(); 
            
            const allTeams = [];

            rows.forEach(row => {
                if (!row.trim()) return;
                
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (columns.length < 4) return;

                const session = cleanField(columns[1]);
                const name = cleanField(columns[2]);
                const score = parseInt(cleanField(columns[3])) || 0;
                // Graceful fallback if column E is unpopulated or missing trailing cell
                const stalls = columns[4] ? cleanField(columns[4]) : '-';

                if(name) {
                    const codes = parseVisited(stalls);
                    allTeams.push({ session, name, score, stalls, codes, complete: hasAllStalls(codes) });
                }
            });

            // Optionally strip test/placeholder rows from the view.
            const visibleTeams = hideTests
                ? allTeams.filter(team => !isTestEntry(team.name))
                : allTeams;

            // A session flows to All-Time only once it is revealed AND all four of its
            // rostered teams have visited all four stalls.
            const sessionQualifies = {};
            function qualifies(session) {
                if (session in sessionQualifies) return sessionQualifies[session];
                let ok = false;
                const roster = rosterForSessionString(session);
                if (roster && isRevealed(session)) {
                    const rows = visibleTeams.filter(t => t.session === session);
                    ok = roster.every(rn => {
                        const row = rows.find(r => r.name.trim().toLowerCase() === rn.trim().toLowerCase());
                        return row && row.complete;
                    });
                }
                return (sessionQualifies[session] = ok);
            }

            // 1. Process Global Standings (All-Time) — gated per session.
            const allTimeSorted = visibleTeams
                .filter(t => qualifies(t.session))
                .sort((a, b) => b.score - a.score);
            document.getElementById('all-time-container').innerHTML = generateTableHTML(allTimeSorted);

            // 2. Process Session Specific View — hidden until revealed.
            const targetSession = sessionSelect.value;
            const sessionFiltered = visibleTeams.filter(team => team.session === targetSession);
            const revealed = isRevealed(targetSession);
            const animate = justRevealed === targetSession;
            const sessionContainer = document.getElementById('session-container');
            sessionContainer.innerHTML = generateSessionHTML(sessionFiltered, revealed, animate);
            if (animate) {
                runCountUps(sessionContainer);
                justRevealed = null;
            }
            syncRevealBtn();

            lastSuccessTime = new Date();
            lastUpdatedEl.textContent = `Last updated: ${formatTime(lastSuccessTime)}`;
            lastUpdatedEl.classList.remove('stale');
        })
        .catch(error => {
            console.error('Data sync problem:', error);
            const suffix = lastSuccessTime ? ` (last success ${formatTime(lastSuccessTime)})` : '';
            lastUpdatedEl.textContent = `Update failed${suffix}`;
            lastUpdatedEl.classList.add('stale');
        });
}

autoToggleBtn.addEventListener('click', () => {
    isAutoMode = !isAutoMode;
    if (isAutoMode) {
        autoToggleBtn.classList.add('active');
        autoToggleBtn.innerText = "🔄 Auto-Detect Session";
        sessionSelect.disabled = true;
    } else {
        autoToggleBtn.classList.remove('active');
        autoToggleBtn.innerText = "🖐️ Manual Selection";
        sessionSelect.disabled = false;
    }
    processLeaderboards();
});

testToggleBtn.addEventListener('click', () => {
    hideTests = !hideTests;
    localStorage.setItem('hideTests', hideTests);
    syncTestToggle();
    processLeaderboards();
});

revealBtn.addEventListener('click', () => {
    const session = sessionSelect.value;
    const next = !isRevealed(session);
    setRevealed(session, next);
    justRevealed = next ? session : null;   // animate only when revealing
    syncRevealBtn();
    processLeaderboards();
});

sessionSelect.addEventListener('change', () => {
    syncRevealBtn();
    processLeaderboards();
});

syncTestToggle();
syncRevealBtn();
processLeaderboards();
setInterval(processLeaderboards, 15000);