// 1. Setup - Your specific Sheet ID and Tab Name
const sheetId = '1fGmyoWkhOx_pgC-22gJTxtvreKdOAOyyZbeZ1tM71T4'; 
const sheetName = 'leaderboard'; 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

function fetchLeaderboard() {
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            // Split the CSV into rows
            const rows = csvText.split('\n');
            rows.shift(); // Remove the first row (the Google Sheet headers)
            
            // Start building the HTML table with headers
            let html = '<table class="leaderboard-table">';
            html += '<tr><th>Rank</th><th>Name</th><th>Score</th></tr>';
            
            rows.forEach((row, index) => {
                if (!row.trim()) return; // Skip empty rows at the bottom
                
                const columns = row.split('","'); 
                const name = columns[0].replace(/"/g, ''); 
                const score = (columns[1] || '').replace(/"/g, ''); 
                const rank = index + 1; // Auto-calculates rank based on row order
                
                // Append a new row for EVERY person in the loop
                html += `<tr>
                            <td>#${rank}</td>
                            <td>${name}</td>
                            <td>${score} pts</td>
                         </tr>`;
            });
            
            html += '</table>'; // Close the table tag after the loop finishes
            document.getElementById('leaderboard-container').innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('leaderboard-container').innerHTML = '<p>Error loading leaderboard.</p>';
        });
}

// Load immediately on page load
fetchLeaderboard();

// Auto-refresh every 10 seconds (10000 milliseconds)
setInterval(fetchLeaderboard, 10000);