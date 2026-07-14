// Configuration Setup - Updated Sheet ID and lowercase Tab Name
const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4'; 
const sheetName = 'leaderboard'; 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

let isAutoMode = true;

// DOM Elements
const sessionSelect = document.getElementById('session-select');
const autoToggleBtn = document.getElementById('auto-toggle-btn');
const testToggleBtn = document.getElementById('test-toggle-btn');
const lastUpdatedEl = document.getElementById('last-updated');

let lastSuccessTime = null;

// Hide test entries by default; remember the operator's choice across refreshes.
let hideTests = localStorage.getItem('hideTests') !== 'false';

function syncTestToggle() {
    testToggleBtn.classList.toggle('active', hideTests);
    testToggleBtn.innerText = hideTests ? '🧹 Hide Test Entries' : '👁 Show Test Entries';
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
                    allTeams.push({ session, name, score, stalls });
                }
            });

            // Optionally strip test/placeholder rows from the view.
            const visibleTeams = hideTests
                ? allTeams.filter(team => !isTestEntry(team.name))
                : allTeams;

            // 1. Process Global Standings (All-Time)
            const allTimeSorted = [...visibleTeams].sort((a, b) => b.score - a.score);
            document.getElementById('all-time-container').innerHTML = generateTableHTML(allTimeSorted);

            // 2. Process Session Specific View
            const targetSession = sessionSelect.value;
            const sessionFiltered = visibleTeams.filter(team => team.session === targetSession);
            const sessionSorted = sessionFiltered.sort((a, b) => b.score - a.score);
            document.getElementById('session-container').innerHTML = generateTableHTML(sessionSorted);

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

sessionSelect.addEventListener('change', processLeaderboards);

syncTestToggle();
processLeaderboards();
setInterval(processLeaderboards, 15000);