// Configuration Setup
const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4'; 
const sheetName = 'leaderboard'; // Switch this to your active data sheet tab name
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

// Track state selection
const sessionSelect = document.getElementById('session-select');

function cleanField(field) {
    if (!field) return '';
    return field.trim().replace(/^"|"$/g, '');
}

function generateTableHTML(dataList) {
    if (dataList.length === 0) {
        return '<p class="loading">No scores logged for this bracket yet.</p>';
    }

    let html = '<table class="leaderboard-table">';
    html += '<tr><th>Rank</th><th>Team Name</th><th>Total Score (Max 40)</th></tr>';
    
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
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split('\n');
            rows.shift(); // Remove headers
            
            const allTeams = [];

            rows.forEach(row => {
                if (!row.trim()) return;
                
                // Match items split cleanly by commas while omitting structure wrappers
                const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if (columns.length < 4) return;

                const session = cleanField(columns[1]);
                const name = cleanField(columns[2]);
                const score = parseInt(cleanField(columns[3])) || 0;

                if(name) {
                    allTeams.push({ session, name, score });
                }
            });

            // --- 1. Compute All-Time Leaderboard ---
            const allTimeSorted = [...allTeams].sort((a, b) => b.score - a.score);
            document.getElementById('all-time-container').innerHTML = generateTableHTML(allTimeSorted);

            // --- 2. Compute Filtered Session Leaderboard ---
            const currentSelectedSession = sessionSelect.value;
            const sessionFiltered = allTeams.filter(team => team.session === currentSelectedSession);
            const sessionSorted = sessionFiltered.sort((a, b) => b.score - a.score);
            document.getElementById('session-container').innerHTML = generateTableHTML(sessionSorted);
        })
        .catch(error => {
            console.error('Error processing spreadsheet data:', error);
            const errorMsg = '<p class="loading">Error synchronizing live scores.</p>';
            document.getElementById('all-time-container').innerHTML = errorMsg;
            document.getElementById('session-container').innerHTML = errorMsg;
        });
}

// Event listener for interactive manual tracking adjustments
sessionSelect.addEventListener('change', processLeaderboards);

// Primary execution loop
processLeaderboards();
setInterval(processLeaderboards, 10000);