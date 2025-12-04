// ==========================================
// Admin Panel Logic - Firebase Integration
// ==========================================

// Global state
let currentMatches = [];
let currentScorers = [];

// 1. Initialization
function initializeAdmin() {
    // Listen for Matches
    db.ref('matches').on('value', (snapshot) => {
        currentMatches = snapshot.val();
        if (!currentMatches) {
            // Seed initial data if empty
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
            db.ref('matches').set(initialMatches);
            currentMatches = initialMatches;
        }
        renderAdminMatches();
    });

    // Listen for Scorers
    db.ref('scorers').on('value', (snapshot) => {
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

    const homeScore = homeInput.value;
    const awayScore = awayInput.value;

    if (homeScore === '' || awayScore === '') {
        alert('Please enter both scores');
        return;
    }

    // Update local state
    currentMatches[matchIndex].homeScore = parseInt(homeScore);
    currentMatches[matchIndex].awayScore = parseInt(awayScore);
    currentMatches[matchIndex].completed = true;

    // Save to Firebase
    db.ref('matches').set(currentMatches)
        .then(() => showFeedback(id, 'Score Updated!'))
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

    container.innerHTML = currentMatches.map(match => `
        <div class="admin-match-card">
            <div class="match-info">
                <span class="match-title">Match ${match.id}</span>
                <span class="match-status-badge ${match.completed ? 'completed' : 'pending'}">
                    ${match.completed ? 'Completed' : 'Pending'}
                </span>
            </div>
            <div class="match-form">
                <div class="teams-input-container">
                    <div class="team-input">
                        <label class="team-label">${match.homeTeam}</label>
                        <input type="number" id="homeScore-${match.id}" 
                               class="score-input"
                               value="${match.homeScore !== null ? match.homeScore : ''}" 
                               placeholder="0" min="0">
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-input">
                        <label class="team-label">${match.awayTeam}</label>
                        <input type="number" id="awayScore-${match.id}" 
                               class="score-input"
                               value="${match.awayScore !== null ? match.awayScore : ''}" 
                               placeholder="0" min="0">
                    </div>
                </div>
                <div class="action-buttons">
                    <button onclick="updateMatchScore(${match.id})" class="btn btn-primary">
                        Update Score
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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
