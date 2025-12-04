// ==========================================
// Football Match System - Core Logic
// ==========================================

// 1. Configuration
const GROUPS = {
    'A': ['Real Madrid', 'PSG', 'Milan'],
    'B': ['Man. City', 'Barcelona', 'Chelsea']
};

// 2. Data Management
// No longer needed: initializeMatches, getMatches (handled by Firebase listeners)

// 3. Standings Calculation Engine
function calculateGroupStandings(groupName, matches) {
    const teams = GROUPS[groupName];
    // matches passed as argument instead of calling getMatches()

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
function renderStandingsTable(groupName, elementId, matches) {
    const data = calculateGroupStandings(groupName, matches);
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

const TEAM_LOGOS = {
    'Real Madrid': 'images/real_madrid.svg',
    'PSG': 'images/psg.svg',
    'Milan': 'images/milan.svg',
    'Man. City': 'images/man_city.svg',
    'Barcelona': 'images/barcelona.svg',
    'Chelsea': 'images/chelsea.svg'
};

function getTeamLogo(teamName) {
    return TEAM_LOGOS[teamName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&size=64&rounded=true&bold=true`;
}

function renderMatchList(matches) {
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
                        <img src="${getTeamLogo(match.homeTeam)}" alt="${match.homeTeam}" class="team-logo">
                        <div class="team-name">${match.homeTeam}</div>
                        <div class="team-score">${isDone ? match.homeScore : '-'}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-info">
                        <img src="${getTeamLogo(match.awayTeam)}" alt="${match.awayTeam}" class="team-logo">
                        <div class="team-name">${match.awayTeam}</div>
                        <div class="team-score">${isDone ? match.awayScore : '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 5. Main Update Loop - REPLACED WITH FIREBASE LISTENERS
function startFirebaseListeners() {
    // Listen for Matches
    db.ref('matches').on('value', (snapshot) => {
        const matches = snapshot.val() || [];
        renderStandingsTable('A', 'groupAStandings', matches);
        renderStandingsTable('B', 'groupBStandings', matches);
        renderMatchList(matches);
    });

    // Listen for Top Scorers
    db.ref('scorers').on('value', (snapshot) => {
        const scorers = snapshot.val() || [];
        renderTopScorers(scorers);
    });
}

// 6. Initialization & Events
document.addEventListener('DOMContentLoaded', startFirebaseListeners);

// ==========================================
// Top Scorer Logic
// ==========================================

function renderTopScorers(scorers) {
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
