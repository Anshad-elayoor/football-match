// ==========================================
// Football Match System - Core Logic
// ==========================================

// 1. Configuration
const GROUPS = {
    'A': ['Real Madrid', 'PSG', 'Milan'],
    'B': ['Man. City', 'Barcelona', 'Chelsea']
};

// 2. Data Management
// 2. Data Management
function initializeMatches() {
    const initialMatches = [
        { id: 1, homeTeam: 'Real Madrid', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
        { id: 2, homeTeam: 'PSG', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
        { id: 3, homeTeam: 'Milan', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false },
        { id: 4, homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
        { id: 5, homeTeam: 'Milan', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
        { id: 6, homeTeam: 'Real Madrid', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false },
        { id: 7, homeTeam: 'PSG', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
        { id: 8, homeTeam: 'Milan', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
        { id: 9, homeTeam: 'PSG', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false }
    ];
    localStorage.setItem('matchData', JSON.stringify(initialMatches));
    return initialMatches;
}

function getMatches() {
    const data = localStorage.getItem('matchData');
    if (!data) return initializeMatches(); // Initialize if no data found
    return JSON.parse(data);
}

// 3. Standings Calculation Engine
function calculateGroupStandings(groupName) {
    const teams = GROUPS[groupName];
    const matches = getMatches();

    // Initialize empty standings for the group
    let standings = teams.map(team => ({
        name: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
    }));

    // Process each match
    matches.forEach(match => {
        // Skip if match is not completed or scores are missing
        if (!match.completed || match.homeScore === null || match.awayScore === null) return;

        // Find teams in our standings array
        const homeTeam = standings.find(t => t.name === match.homeTeam);
        const awayTeam = standings.find(t => t.name === match.awayTeam);

        // Process if at least one team is in this group
        if (homeTeam || awayTeam) {
            const hScore = parseInt(match.homeScore);
            const aScore = parseInt(match.awayScore);

            // Update Home Team (if in this group)
            if (homeTeam) {
                homeTeam.played++;
                homeTeam.gf += hScore;
                homeTeam.ga += aScore;

                if (hScore > aScore) {
                    homeTeam.won++;
                    homeTeam.points += 3;
                } else if (hScore < aScore) {
                    homeTeam.lost++;
                } else {
                    homeTeam.drawn++;
                    homeTeam.points += 1;
                }
            }

            // Update Away Team (if in this group)
            if (awayTeam) {
                awayTeam.played++;
                awayTeam.gf += aScore;
                awayTeam.ga += hScore;

                if (aScore > hScore) {
                    awayTeam.won++;
                    awayTeam.points += 3;
                } else if (aScore < hScore) {
                    awayTeam.lost++;
                } else {
                    awayTeam.drawn++;
                    awayTeam.points += 1;
                }
            }
        }
    });

    // Calculate Goal Difference
    standings.forEach(t => t.gd = t.gf - t.ga);

    // Sort Standings: Points > GD > GF
    return standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
}

// 4. Rendering Logic
function renderStandingsTable(groupName, elementId) {
    const data = calculateGroupStandings(groupName);
    const tbody = document.getElementById(elementId);

    if (!tbody) return;

    tbody.innerHTML = data.map((team, index) => `
        <div class="table-row">
            <span class="pos">${index + 1}</span>
            <span class="team">${team.name}</span>
            <span class="stat">${team.played}</span>
            <span class="stat">${team.won}</span>
            <span class="stat">${team.drawn}</span>
            <span class="stat">${team.lost}</span>
            <span class="stat">${team.gf}</span>
            <span class="stat">${team.ga}</span>
            <span class="stat">${team.gd > 0 ? '+' + team.gd : team.gd}</span>
            <span class="stat points-col">${team.points}</span>
        </div>
    `).join('');
}

function renderMatchList() {
    const matches = getMatches();
    const container = document.getElementById('matchResults');

    if (!container) return;

    container.innerHTML = matches.map(match => {
        const isDone = match.completed;
        return `
            <div class="match-card ${isDone ? 'completed' : 'pending'}">
                <div class="match-header">
                    <span class="match-number">Match ${match.id}</span>
                    <span class="match-status ${isDone ? 'completed' : 'pending'}">
                        ${isDone ? 'Finished' : 'Upcoming'}
                    </span>
                </div>
                <div class="match-teams">
                    <div class="team-info">
                        <div class="team-name">${match.homeTeam}</div>
                        <div class="team-score">${isDone ? match.homeScore : '-'}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-info">
                        <div class="team-name">${match.awayTeam}</div>
                        <div class="team-score">${isDone ? match.awayScore : '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 5. Main Update Loop
function refreshAll() {
    renderStandingsTable('A', 'groupAStandings');
    renderStandingsTable('B', 'groupBStandings');
    renderMatchList();
    renderTopScorers(); // Add this
}

// 6. Initialization & Events
document.addEventListener('DOMContentLoaded', refreshAll);

// Auto-refresh every 5 seconds to ensure updates without blinking
setInterval(refreshAll, 5000);

// Listen for cross-tab updates
window.addEventListener('storage', refreshAll);

// ==========================================
// Top Scorer Logic
// ==========================================

function getScorers() {
    const data = localStorage.getItem('scorerData');
    return data ? JSON.parse(data) : [];
}

function renderTopScorers() {
    const scorers = getScorers();
    const container = document.getElementById('topScorersList');

    if (!container) return;

    // Sort by goals descending
    scorers.sort((a, b) => b.goals - a.goals);

    // Take top 5 only
    const topScorers = scorers.slice(0, 5);

    if (topScorers.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">No top scorers yet</div>';
        return;
    }

    container.innerHTML = topScorers.map((scorer, index) => `
        <div class="scorer-card" style="background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 15px;">
            <div class="rank" style="font-size: 1.5em; font-weight: bold; color: rgba(255,255,255,0.2); width: 30px;">#${index + 1}</div>
            <div class="player-info" style="flex: 1;">
                <div class="player-name" style="font-weight: bold; font-size: 1.1em; color: #fff;">${scorer.name}</div>
                <div class="player-team" style="font-size: 0.85em; color: #aaa;">${scorer.team}</div>
            </div>
            <div class="goals" style="background: rgba(76, 175, 80, 0.2); color: #4CAF50; padding: 5px 10px; border-radius: 20px; font-weight: bold;">
                ${scorer.goals} ⚽
            </div>
        </div>
    `).join('');
}
