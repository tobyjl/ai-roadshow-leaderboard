const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4'; 
const sheetName = 'Form Responses 1'; 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

let isAutoMode = true;

// DOM Elements
const sessionSelect = document.getElementById('session-select');
const autoToggleBtn = document.getElementById('auto-toggle-btn');

// Calculates active roadmap parameters automatically based on system time 
function getAutoSessionString() {
    const now = new Date();
    const dayOfMonth = now.getDate();
    let dayNum = 1;

    // Evaluate current day execution phase
    if (dayOfMonth === 14) dayNum = 2;
    else if (dayOfMonth === 15) dayNum = 3;
    else if (dayOfMonth === 16) dayNum = 4;
    else dayNum = 1; // Default fallback to Day 1 for testing outside live windows

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = (hours * 60) + minutes;

    // Match appropriate hour slot intervals
    let timeSlot = "9:30am";
    if (totalMinutes >= 870) {       // 14:30 (2:30pm) and later
        timeSlot = "2:30pm";
    } else if (totalMinutes >= 780) { // 13:00 (1:00pm)
        timeSlot = "1:00pm";
    } else if (totalMinutes >= 660) { // 11:00 (11:00am)
        timeSlot = "11:00am";
    }

    return `Day ${dayNum}: ${timeSlot}`;
}

function cleanField(field) {
    if (!field) return '';
    return field.trim().replace(/^"|"$/g, '');
}

function generateTableHTML(dataList) {
    if (dataList.length === 0) {
        return '<p class="loading">No event scores recorded here yet.</p>';
    }

    let html = '<table class="leaderboard-table">';
    html += '<tr><th>Rank</th><th>Team Name</th><th>Score</th></tr>';
    
    dataList.forEach((item, index) => {
        html += `<tr>
                    <td>#${index + 1}</td>
                    <td>${item.name}</td>
                    <td><strong>${item.score}</strong> / 40</td>
                 </tr>`;
    });
    
    html += '</table>';
    return html;
}

function processLeaderboards() {
    // If auto mode is engaged, force override dropdown selection
    if (isAutoMode) {
        sessionSelect.value = getAutoSessionString();
    }

    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split('\n');
            rows.shift(); // Remove row headers
            
            const allTeams = [];

            rows.forEach(row => {
                if (!row.trim()) return;
                
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (columns.length < 4) return;

                const session = cleanField(columns[1]);
                const name = cleanField(columns[2]);
                const score = parseInt(cleanField(columns[3])) || 0;

                if(name) {
                    allTeams.push({ session, name, score });
                }
            });

            // 1. Process Global Standings (All-Time)
            const allTimeSorted = [...allTeams].sort((a, b) => b.score - a.score);
            document.getElementById('all-time-container').innerHTML = generateTableHTML(allTimeSorted);

            // 2. Process Session Specific View
            const targetSession = sessionSelect.value;
            const sessionFiltered = allTeams.filter(team => team.session === targetSession);
            const sessionSorted = sessionFiltered.sort((a, b) => b.score - a.score);
            document.getElementById('session-container').innerHTML = generateTableHTML(sessionSorted);
        })
        .catch(error => {
            console.error('Data sync problem:', error);
        });
}

// Intercept manual override adjustments
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

sessionSelect.addEventListener('change', processLeaderboards);

// Start polling loops
processLeaderboards();
setInterval(processLeaderboards, 10000);