// ==========================================
// Admin Panel Logic - Firebase Integration
// ==========================================

// Global state
let currentMatches = [];
let currentScorers = [];

// 1. Initialization
function initializeAdmin() {
    console.log('Initializing Admin Panel...');

    // Listen for Matches
    db.ref('matches').on('value', (snapshot) => {
        const val = snapshot.val();
        console.log('Firebase matches update:', val);

        currentMatches = val;

        if (!currentMatches) {
            console.log('No matches found in Firebase. Seeding initial data...');
            // Seed initial data if empty
            const initialMatches = [
                // Group Stage Matches
                { id: 1, type: 'group', homeTeam: 'Real Madrid', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
                { id: 2, type: 'group', homeTeam: 'PSG', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
                { id: 3, type: 'group', homeTeam: 'Milan', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false },
                { id: 4, type: 'group', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
                { id: 5, type: 'group', homeTeam: 'Milan', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
                { id: 6, type: 'group', homeTeam: 'Real Madrid', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false },
                { id: 7, type: 'group', homeTeam: 'PSG', awayTeam: 'Man. City', homeScore: null, awayScore: null, completed: false },
                { id: 8, type: 'group', homeTeam: 'Milan', awayTeam: 'Barcelona', homeScore: null, awayScore: null, completed: false },
                { id: 9, type: 'group', homeTeam: 'PSG', awayTeam: 'Chelsea', homeScore: null, awayScore: null, completed: false },
                // Knockout Stage Matches
                { id: 10, type: 'semifinal', label: 'Semi Final 1', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false },
                { id: 11, type: 'semifinal', label: 'Semi Final 2', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false },
                { id: 12, type: 'final', label: 'Final', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false }
            ];
            db.ref('matches').set(initialMatches)
                .then(() => console.log('Seeding complete.'))
                .catch(e => console.error('Seeding failed:', e));

            currentMatches = initialMatches;
        } else if (Array.isArray(currentMatches)) {
            // Check if knockout matches exist, if not add them
            const hasKnockout = currentMatches.some(m => m && (m.type === 'semifinal' || m.type === 'final'));
            if (!hasKnockout) {
                console.log('Adding knockout matches to existing data...');
                const knockoutMatches = [
                    { id: 10, type: 'semifinal', label: 'Semi Final 1', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false },
                    { id: 11, type: 'semifinal', label: 'Semi Final 2', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false },
                    { id: 12, type: 'final', label: 'Final', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, completed: false }
                ];
                currentMatches = [...currentMatches, ...knockoutMatches];
                db.ref('matches').set(currentMatches)
                    .then(() => console.log('Knockout matches added.'))
                    .catch(e => console.error('Failed to add knockout matches:', e));
            }
        }

        console.log('Rendering matches with:', currentMatches);
        renderAdminMatches();
        renderKnockoutMatches();
    });

    // Listen for Scorers
    db.ref('scorers').on('value', (snapshot) => {
        console.log('Firebase scorers update:', snapshot.val());
        currentScorers = snapshot.val() || [];
        renderScorersList();
        populatePlayerAutocomplete();
    });
}

// 2. Match Management
function updateMatchScore(id) {
    const matchIndex = currentMatches.findIndex(m => m.id === id);
    if (matchIndex === -1) return;

    const homeInput = document.getElementById(`homeScore-${id}`);
    const awayInput = document.getElementById(`awayScore-${id}`);
    const completedCheckbox = document.getElementById(`completed-${id}`);

    const homeScore = homeInput.value;
    const awayScore = awayInput.value;
    const isCompleted = completedCheckbox.checked;

    // Allow saving with or without scores, but if scores are present, validate them
    if (homeScore !== '' && awayScore !== '') {
        currentMatches[matchIndex].homeScore = parseInt(homeScore);
        currentMatches[matchIndex].awayScore = parseInt(awayScore);
    } else if (homeScore === '' && awayScore === '') {
        currentMatches[matchIndex].homeScore = null;
        currentMatches[matchIndex].awayScore = null;
    } else {
        alert('Please enter both scores or leave both empty');
        return;
    }

    // Respect the checkbox state
    currentMatches[matchIndex].completed = isCompleted;

    // Save to Firebase
    db.ref('matches').set(currentMatches)
        .then(() => showFeedback(id, 'Match Updated!'))
        .catch(error => alert('Error updating score: ' + error.message));
}

function showFeedback(id, message) {
    const btn = document.querySelector(`button[onclick="updateMatchScore(${id})"]`);
    const originalText = btn.innerText;

    btn.innerText = message;
    btn.style.background = '#4CAF50';

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = '';
    }, 2000);
}

function renderAdminMatches() {
    const container = document.getElementById('adminMatches');
    if (!container) return;

    if (!currentMatches) {
        container.innerHTML = '<div style="color: white; text-align: center;">Loading matches...</div>';
        return;
    }

    if (!Array.isArray(currentMatches) || currentMatches.length === 0) {
        container.innerHTML = '<div style="color: white; text-align: center;">No matches found.</div>';
        console.log('Current matches is not an array or empty:', currentMatches);
        return;
    }

    try {
        container.innerHTML = currentMatches.map(match => `
            <div class="admin-match-card">
                <div class="match-info">
                    <span class="match-title">Match ${match ? match.id : '?'}</span>
                    <span class="match-status-badge ${match && match.completed ? 'completed' : 'pending'}">
                        ${match && match.completed ? 'Completed' : 'Pending'}
                    </span>
                </div>
                <div class="match-form">
                    <div class="teams-input-container">
                        <div class="team-input">
                            <label class="team-label">${match ? match.homeTeam : 'Home'}</label>
                            <input type="number" id="homeScore-${match ? match.id : ''}" 
                                   class="score-input"
                                   value="${match && match.homeScore !== null ? match.homeScore : ''}" 
                                   placeholder="0" min="0">
                        </div>
                        <div class="vs-divider">VS</div>
                        <div class="team-input">
                            <label class="team-label">${match ? match.awayTeam : 'Away'}</label>
                            <input type="number" id="awayScore-${match ? match.id : ''}" 
                                   class="score-input"
                                   value="${match && match.awayScore !== null ? match.awayScore : ''}" 
                                   placeholder="0" min="0">
                        </div>
                    </div>
                    <div class="completed-checkbox-container">
                        <label class="checkbox-label">
                            <input type="checkbox" id="completed-${match ? match.id : ''}" 
                                   class="completed-checkbox" ${match && match.completed ? 'checked' : ''}>
                            <span>Mark as Completed</span>
                        </label>
                    </div>
                    <div class="action-buttons">
                        <button onclick="updateMatchScore(${match ? match.id : ''})" class="btn btn-primary">
                            Update Match
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error rendering matches:', e);
        container.innerHTML = '<div style="color: red; text-align: center;">Error rendering matches. Check console.</div>';
    }
}

// Team logos mapping (using SVG files)
const teamLogos = {
    'Real Madrid': 'images/real_madrid.svg',
    'PSG': 'images/psg.svg',
    'Milan': 'images/milan.svg',
    'Man. City': 'images/man_city.svg',
    'Barcelona': 'images/barcelona.svg',
    'Chelsea': 'images/chelsea.svg'
};

// All teams for knockout stage dropdowns
const allTeams = ['Real Madrid', 'PSG', 'Milan', 'Man. City', 'Barcelona', 'Chelsea'];

// Render Knockout Stage Matches (Semi Finals & Final)
function renderKnockoutMatches() {
    const container = document.getElementById('knockoutMatches');
    if (!container) return;

    if (!currentMatches || !Array.isArray(currentMatches)) {
        container.innerHTML = '<div style="color: white; text-align: center;">Loading knockout matches...</div>';
        return;
    }

    // Filter only knockout matches (type: semifinal or final)
    const knockoutMatches = currentMatches.filter(m => m && (m.type === 'semifinal' || m.type === 'final'));

    if (knockoutMatches.length === 0) {
        container.innerHTML = '<div style="color: white; text-align: center;">No knockout matches configured.</div>';
        return;
    }

    try {
        container.innerHTML = knockoutMatches.map(match => {
            // Determine match status: not_fixed -> fixed (upcoming) -> completed
            const isFixed = match.fixed === true;
            const isCompleted = match.completed === true;
            let statusClass = 'not-fixed';
            let statusText = 'Not Fixed';

            if (isCompleted) {
                statusClass = 'completed';
                statusText = 'Completed';
            } else if (isFixed) {
                statusClass = 'fixed';
                statusText = 'Upcoming';
            }

            return `
            <div class="knockout-match-card ${match.type === 'final' ? 'final-card' : ''}">
                <div class="knockout-header">
                    <span class="knockout-title">${match.label || 'Knockout Match'}</span>
                    <span class="match-status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <div class="knockout-form">
                    <div class="knockout-teams-container">
                        <div class="knockout-team-select">
                            <div class="team-logo-preview" id="homeLogo-${match.id}">
                                ${match.homeTeam ? `<img src="${teamLogos[match.homeTeam] || ''}" alt="${match.homeTeam}" onerror="this.style.display='none'">` : '<span>?</span>'}
                            </div>
                            <select id="homeTeam-${match.id}" class="team-dropdown" onchange="updateTeamLogo(${match.id}, 'home')">
                                <option value="">Select Team</option>
                                ${allTeams.map(team => `<option value="${team}" ${match.homeTeam === team ? 'selected' : ''}>${team}</option>`).join('')}
                            </select>
                        </div>
                        <div class="knockout-score-inputs">
                            <input type="number" id="knockoutHomeScore-${match.id}" 
                                   class="score-input"
                                   value="${match.homeScore !== null ? match.homeScore : ''}" 
                                   placeholder="0" min="0">
                            <span class="vs-text">VS</span>
                            <input type="number" id="knockoutAwayScore-${match.id}" 
                                   class="score-input"
                                   value="${match.awayScore !== null ? match.awayScore : ''}" 
                                   placeholder="0" min="0">
                        </div>
                        <div class="knockout-team-select">
                            <div class="team-logo-preview" id="awayLogo-${match.id}">
                                ${match.awayTeam ? `<img src="${teamLogos[match.awayTeam] || ''}" alt="${match.awayTeam}" onerror="this.style.display='none'">` : '<span>?</span>'}
                            </div>
                            <select id="awayTeam-${match.id}" class="team-dropdown" onchange="updateTeamLogo(${match.id}, 'away')">
                                <option value="">Select Team</option>
                                ${allTeams.map(team => `<option value="${team}" ${match.awayTeam === team ? 'selected' : ''}>${team}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="knockout-actions">
                        ${!isFixed && !isCompleted ? `
                            <button onclick="fixKnockoutMatch(${match.id})" class="btn btn-fix">
                                📌 Fix Match
                            </button>
                            <p class="action-hint">Select both teams and click "Fix Match" to make it visible to users</p>
                        ` : ''}
                        ${isFixed && !isCompleted ? `
                            <div class="completed-checkbox-container">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="knockoutCompleted-${match.id}" 
                                           class="completed-checkbox" ${isCompleted ? 'checked' : ''}>
                                    <span>Mark as Completed</span>
                                </label>
                            </div>
                            <button onclick="updateKnockoutMatch(${match.id})" class="btn btn-primary">
                                Update Match
                            </button>
                        ` : ''}
                        ${isCompleted ? `
                            <div class="match-completed-info">
                                ✅ Match has been completed
                            </div>
                            <button onclick="editKnockoutMatch(${match.id})" class="btn btn-secondary">
                                Edit Match
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } catch (e) {
        console.error('Error rendering knockout matches:', e);
        container.innerHTML = '<div style="color: red; text-align: center;">Error rendering knockout matches.</div>';
    }
}

// Update team logo preview when dropdown changes
function updateTeamLogo(matchId, side) {
    const dropdown = document.getElementById(`${side}Team-${matchId}`);
    const logoContainer = document.getElementById(`${side}Logo-${matchId}`);

    if (!dropdown || !logoContainer) return;

    const selectedTeam = dropdown.value;
    if (selectedTeam && teamLogos[selectedTeam]) {
        logoContainer.innerHTML = `<img src="${teamLogos[selectedTeam]}" alt="${selectedTeam}" onerror="this.style.display='none'">`;
    } else {
        logoContainer.innerHTML = '<span>?</span>';
    }
}

// Update Knockout Match (Semi Final or Final)
function updateKnockoutMatch(id) {
    const matchIndex = currentMatches.findIndex(m => m.id === id);
    if (matchIndex === -1) return;

    const homeTeamSelect = document.getElementById(`homeTeam-${id}`);
    const awayTeamSelect = document.getElementById(`awayTeam-${id}`);
    const homeScoreInput = document.getElementById(`knockoutHomeScore-${id}`);
    const awayScoreInput = document.getElementById(`knockoutAwayScore-${id}`);
    const completedCheckbox = document.getElementById(`knockoutCompleted-${id}`);

    const homeTeam = homeTeamSelect.value || null;
    const awayTeam = awayTeamSelect.value || null;
    const homeScore = homeScoreInput.value !== '' ? parseInt(homeScoreInput.value) : null;
    const awayScore = awayScoreInput.value !== '' ? parseInt(awayScoreInput.value) : null;
    const isCompleted = completedCheckbox.checked;

    // Update match data
    currentMatches[matchIndex].homeTeam = homeTeam;
    currentMatches[matchIndex].awayTeam = awayTeam;
    currentMatches[matchIndex].homeScore = homeScore;
    currentMatches[matchIndex].awayScore = awayScore;
    currentMatches[matchIndex].completed = isCompleted;

    // Save to Firebase
    db.ref('matches').set(currentMatches)
        .then(() => {
            const btn = document.querySelector(`button[onclick="updateKnockoutMatch(${id})"]`);
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Match Updated!';
                btn.style.background = '#4CAF50';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '';
                }, 2000);
            }
        })
        .catch(error => alert('Error updating match: ' + error.message));
}

// Fix Knockout Match - makes it visible to users as "Upcoming"
function fixKnockoutMatch(id) {
    const matchIndex = currentMatches.findIndex(m => m.id === id);
    if (matchIndex === -1) return;

    const homeTeamSelect = document.getElementById(`homeTeam-${id}`);
    const awayTeamSelect = document.getElementById(`awayTeam-${id}`);

    const homeTeam = homeTeamSelect.value;
    const awayTeam = awayTeamSelect.value;

    // Validate both teams are selected
    if (!homeTeam || !awayTeam) {
        alert('Please select both teams before fixing the match');
        return;
    }

    if (homeTeam === awayTeam) {
        alert('Please select two different teams');
        return;
    }

    // Update match data
    currentMatches[matchIndex].homeTeam = homeTeam;
    currentMatches[matchIndex].awayTeam = awayTeam;
    currentMatches[matchIndex].fixed = true;
    currentMatches[matchIndex].completed = false;

    // Save to Firebase
    db.ref('matches').set(currentMatches)
        .then(() => {
            const btn = document.querySelector(`button[onclick="fixKnockoutMatch(${id})"]`);
            if (btn) {
                btn.innerText = 'Match Fixed!';
                btn.style.background = '#4CAF50';
                setTimeout(() => renderKnockoutMatches(), 1500);
            }
        })
        .catch(error => alert('Error fixing match: ' + error.message));
}

// Edit Knockout Match - allows editing a completed match
function editKnockoutMatch(id) {
    const matchIndex = currentMatches.findIndex(m => m.id === id);
    if (matchIndex === -1) return;

    // Revert to fixed (upcoming) status so admin can edit
    currentMatches[matchIndex].completed = false;

    // Save to Firebase - this will trigger re-render with edit UI
    db.ref('matches').set(currentMatches)
        .then(() => console.log('Match reopened for editing'))
        .catch(error => alert('Error reopening match: ' + error.message));
}

// 3. Top Scorer Management
function addScorer() {
    const nameInput = document.getElementById('playerName');
    const teamInput = document.getElementById('playerTeam');
    const goalsInput = document.getElementById('playerGoals');

    const name = nameInput.value.trim();
    const team = teamInput.value;
    const goals = parseInt(goalsInput.value);

    if (!name || isNaN(goals)) {
        alert('Please enter valid player details');
        return;
    }

    // Check if we are updating an existing scorer (using the hidden index or logic)
    // For simplicity, we'll check if name and team match an existing entry
    const existingIndex = currentScorers.findIndex(s => s.name === name && s.team === team);

    if (existingIndex !== -1) {
        // Update existing
        currentScorers[existingIndex].goals = goals;
    } else {
        // Add new
        currentScorers.push({ name, team, goals });
    }

    // Save to Firebase
    db.ref('scorers').set(currentScorers)
        .then(() => {
            // Clear inputs
            nameInput.value = '';
            goalsInput.value = '';

            // Reset UI state
            document.getElementById('addScorerBtn').style.display = 'inline-block';
            document.getElementById('updateScorerBtn').style.display = 'none';
            delete document.getElementById('updateScorerBtn').dataset.index;
        })
        .catch(error => alert('Error saving scorer: ' + error.message));
}

function deleteScorer(index) {
    if (confirm('Are you sure you want to delete this player?')) {
        currentScorers.splice(index, 1);
        db.ref('scorers').set(currentScorers);
    }
}

function editScorer(index) {
    const scorer = currentScorers[index];

    // Populate form
    document.getElementById('playerName').value = scorer.name;
    document.getElementById('playerTeam').value = scorer.team;
    document.getElementById('playerGoals').value = scorer.goals;

    // Change button visibility
    const addBtn = document.getElementById('addScorerBtn');
    const updateBtn = document.getElementById('updateScorerBtn');

    addBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';

    // Store index on the update button for reference
    updateBtn.dataset.index = index;

    // Scroll to form
    document.querySelector('.scorer-form-card').scrollIntoView({ behavior: 'smooth' });

    // Highlight form
    const formCard = document.querySelector('.scorer-form-card');
    formCard.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
    setTimeout(() => {
        formCard.style.boxShadow = '';
    }, 1000);
}

// Function to handle the specific "Update Player" button click
function updateScorer() {
    const updateBtn = document.getElementById('updateScorerBtn');
    const index = parseInt(updateBtn.dataset.index);

    if (isNaN(index) || index < 0 || index >= currentScorers.length) {
        // Fallback to addScorer if something is wrong, or just return
        addScorer();
        return;
    }

    const nameInput = document.getElementById('playerName');
    const teamInput = document.getElementById('playerTeam');
    const goalsInput = document.getElementById('playerGoals');

    const name = nameInput.value.trim();
    const team = teamInput.value;
    const goals = parseInt(goalsInput.value);

    if (!name || isNaN(goals)) {
        alert('Please enter valid player details');
        return;
    }

    // Update the specific scorer at the index
    currentScorers[index] = { name, team, goals };

    // Save to Firebase
    db.ref('scorers').set(currentScorers)
        .then(() => {
            // Clear inputs
            nameInput.value = '';
            goalsInput.value = '';

            // Reset buttons
            document.getElementById('addScorerBtn').style.display = 'inline-block';
            document.getElementById('updateScorerBtn').style.display = 'none';
            delete updateBtn.dataset.index;
        })
        .catch(error => alert('Error updating scorer: ' + error.message));
}

function renderScorersList() {
    const container = document.getElementById('scorersList');
    if (!container) return;

    container.innerHTML = currentScorers.map((scorer, index) => `
        <div class="scorer-item" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${scorer.name}</strong> (${scorer.team}) - ${scorer.goals} Goals
            </div>
            <div>
                <button onclick="editScorer(${index})" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edit</button>
                <button onclick="deleteScorer(${index})" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `).join('');
}

function populatePlayerAutocomplete() {
    const datalist = document.getElementById('playerNamesList');
    if (!datalist) return;

    // Get unique names
    const names = [...new Set(currentScorers.map(s => s.name))];

    datalist.innerHTML = names.map(name => `<option value="${name}">`).join('');
}

function clearScorerForm() {
    document.getElementById('playerName').value = '';
    document.getElementById('playerGoals').value = '';
    document.getElementById('playerTeam').selectedIndex = 0;

    document.getElementById('addScorerBtn').style.display = 'inline-block';
    document.getElementById('updateScorerBtn').style.display = 'none';
}

// 4. Reset Data
function resetData() {
    if (confirm('WARNING: This will reset all match scores and delete all top scorers. Are you sure?')) {
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

        // Reset both nodes in Firebase
        const updates = {};
        updates['/matches'] = initialMatches;
        updates['/scorers'] = [];

        db.ref().update(updates)
            .then(() => alert('All data has been reset!'))
            .catch(error => alert('Error resetting data: ' + error.message));
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeAdmin);
document.getElementById('addScorerBtn').addEventListener('click', addScorer);
document.getElementById('updateScorerBtn').addEventListener('click', updateScorer);
document.getElementById('clearScorerBtn').addEventListener('click', clearScorerForm);
document.getElementById('resetDataBtn').addEventListener('click', resetData);
