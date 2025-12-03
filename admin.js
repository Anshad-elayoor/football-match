// Initialize matches data if not exists
function initializeMatches() {
    const existingData = localStorage.getItem('matchData');
    if (!existingData) {
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
    return JSON.parse(existingData);
}

// Save matches data
function saveMatches(matches) {
    localStorage.setItem('matchData', JSON.stringify(matches));
}

// Update match score and completed status
function updateMatchScore(matchId, homeScore, awayScore, completed) {
    const matches = initializeMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);

    if (matchIndex !== -1) {
        // Validate scores
        if (homeScore !== '' && awayScore !== '') {
            const home = parseInt(homeScore);
            const away = parseInt(awayScore);

            if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
                return { success: false, message: 'Please enter valid positive numbers' };
            }

            matches[matchIndex].homeScore = home;
            matches[matchIndex].awayScore = away;
            // Respect the manual checkbox state
            matches[matchIndex].completed = completed;
        } else {
            // Clear scores if both are empty
            matches[matchIndex].homeScore = null;
            matches[matchIndex].awayScore = null;
            // Keep manual completed status from checkbox when no scores
            matches[matchIndex].completed = completed || false;
        }

        saveMatches(matches);
        return { success: true, message: 'Match updated successfully!' };
    }

    return { success: false, message: 'Match not found' };
}

// Show feedback message
function showFeedback(container, message, isSuccess) {
    const feedbackDiv = container.querySelector('.feedback-message');
    if (feedbackDiv) {
        feedbackDiv.remove();
    }

    const newFeedback = document.createElement('div');
    newFeedback.className = `feedback-message ${isSuccess ? 'success' : 'error'}`;
    newFeedback.textContent = message;
    container.appendChild(newFeedback);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        newFeedback.remove();
    }, 3000);
}

// Render admin matches
function renderAdminMatches() {
    const matches = initializeMatches();
    const container = document.getElementById('adminMatches');
    container.innerHTML = '';

    matches.forEach(match => {
        const isCompleted = match.completed || false;
        const card = document.createElement('div');
        card.className = 'admin-match-card';

        card.innerHTML = `
            <div class="match-info">
                <span class="match-title">Match ${match.id}</span>
                <span class="match-status-badge ${isCompleted ? 'completed' : 'pending'}">
                    ${isCompleted ? 'Completed' : 'Pending'}
                </span>
            </div>
            <form class="match-form" data-match-id="${match.id}">
                <div class="teams-input-container">
                    <div class="team-input">
                        <label class="team-label">${match.homeTeam}</label>
                        <input 
                            type="number" 
                            class="score-input home-score" 
                            placeholder="0"
                            min="0"
                            value="${match.homeScore !== null ? match.homeScore : ''}"
                        >
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-input">
                        <label class="team-label">${match.awayTeam}</label>
                        <input 
                            type="number" 
                            class="score-input away-score" 
                            placeholder="0"
                            min="0"
                            value="${match.awayScore !== null ? match.awayScore : ''}"
                        >
                    </div>
                </div>
                <div class="completed-checkbox-container">
                    <label class="checkbox-label">
                        <input type="checkbox" class="completed-checkbox" ${isCompleted ? 'checked' : ''}>
                        <span>Mark as Completed (optional - auto-sets when scores entered)</span>
                    </label>
                </div>
                <div class="action-buttons">
                    <button type="submit" class="btn btn-primary">Update Match</button>
                    <button type="button" class="btn btn-secondary clear-btn">Clear</button>
                </div>
            </form>
        `;

        container.appendChild(card);

        // Add form submit handler
        const form = card.querySelector('.match-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const matchId = parseInt(form.dataset.matchId);
            const homeScore = form.querySelector('.home-score').value;
            const awayScore = form.querySelector('.away-score').value;
            const completed = form.querySelector('.completed-checkbox').checked;

            const result = updateMatchScore(matchId, homeScore, awayScore, completed);
            showFeedback(card, result.message, result.success);

            if (result.success) {
                // Determine if match is completed (auto if scores entered, or manual via checkbox)
                const hasScores = homeScore !== '' && awayScore !== '';
                const isCompleted = hasScores || completed;

                // Auto-check the checkbox if scores were entered
                if (hasScores) {
                    form.querySelector('.completed-checkbox').checked = true;
                }

                // Update the status badge
                const badge = card.querySelector('.match-status-badge');
                badge.className = `match-status-badge ${isCompleted ? 'completed' : 'pending'}`;
                badge.textContent = isCompleted ? 'Completed' : 'Pending';
            }
        });

        // Add clear button handler
        const clearBtn = card.querySelector('.clear-btn');
        clearBtn.addEventListener('click', () => {
            const matchId = parseInt(form.dataset.matchId);
            const result = updateMatchScore(matchId, '', '', false);

            if (result.success) {
                form.querySelector('.home-score').value = '';
                form.querySelector('.away-score').value = '';
                form.querySelector('.completed-checkbox').checked = false;

                // Update the status badge
                const badge = card.querySelector('.match-status-badge');
                badge.className = 'match-status-badge pending';
                badge.textContent = 'Pending';

                showFeedback(card, 'Match cleared', true);
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderAdminMatches();
    renderScorersList(); // Render scorers on load
    populatePlayerDatalist(); // Populate autocomplete

    // Reset Data Button Logic
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ WARNING: This will delete ALL scores and reset the system to default. Are you sure?')) {
                localStorage.removeItem('matchData');
                localStorage.removeItem('scorerData'); // Clear scorers too
                // Re-initialize immediately to ensure data exists
                initializeMatches();
                alert('System reset successfully!');
                location.reload();
            }
        });
    }

    // Add Scorer Button Logic
    const addScorerBtn = document.getElementById('addScorerBtn');
    if (addScorerBtn) {
        addScorerBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('playerName');
            const teamInput = document.getElementById('playerTeam');
            const goalsInput = document.getElementById('playerGoals');

            const name = nameInput.value.trim();
            const team = teamInput.value;
            const goals = parseInt(goalsInput.value);

            if (!name || isNaN(goals) || goals < 0) {
                alert('Please enter a valid name and positive goal count.');
                return;
            }

            addScorer(name, team, goals);

            // Clear inputs
            nameInput.value = '';
            goalsInput.value = '';
            alert('Player added successfully!');
        });
    }

    // Update Scorer Button Logic
    const updateScorerBtn = document.getElementById('updateScorerBtn');
    if (updateScorerBtn) {
        updateScorerBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('playerName');
            const teamInput = document.getElementById('playerTeam');
            const goalsInput = document.getElementById('playerGoals');

            const name = nameInput.value.trim();
            const team = teamInput.value;
            const goals = parseInt(goalsInput.value);

            if (!name || isNaN(goals) || goals < 0) {
                alert('Please enter a valid name and positive goal count.');
                return;
            }

            addScorer(name, team, goals); // Reuses addScorer which handles updates based on name/team

            // Clear inputs and reset buttons
            nameInput.value = '';
            goalsInput.value = '';

            document.getElementById('addScorerBtn').style.display = 'inline-block';
            document.getElementById('updateScorerBtn').style.display = 'none';

            alert('Player updated successfully!');
        });
    }

    // Clear Scorer Button Logic
    const clearScorerBtn = document.getElementById('clearScorerBtn');
    if (clearScorerBtn) {
        clearScorerBtn.addEventListener('click', () => {
            document.getElementById('playerName').value = '';
            document.getElementById('playerGoals').value = '';
            document.getElementById('playerTeam').selectedIndex = 0;

            // Reset buttons
            document.getElementById('addScorerBtn').style.display = 'inline-block';
            document.getElementById('updateScorerBtn').style.display = 'none';
        });
    }
});

// ==========================================
// Top Scorer Management Logic
// ==========================================

function getScorers() {
    const data = localStorage.getItem('scorerData');
    return data ? JSON.parse(data) : [];
}

function saveScorers(scorers) {
    localStorage.setItem('scorerData', JSON.stringify(scorers));
    renderScorersList(); // Re-render list
    populatePlayerDatalist(); // Update autocomplete list
}

function addScorer(name, team, goals) {
    const scorers = getScorers();
    const existingIndex = scorers.findIndex(s => s.name.toLowerCase() === name.toLowerCase() && s.team === team);

    if (existingIndex !== -1) {
        // Update existing player
        scorers[existingIndex].goals = goals;
    } else {
        // Add new player
        scorers.push({ name, team, goals });
    }

    saveScorers(scorers);
}

function deleteScorer(index) {
    if (confirm('Delete this player?')) {
        const scorers = getScorers();
        scorers.splice(index, 1);
        saveScorers(scorers);
    }
}

function editScorer(index) {
    console.log('Editing scorer at index:', index);
    const scorers = getScorers();
    const scorer = scorers[index];

    if (scorer) {
        console.log('Found scorer:', scorer);
        const nameInput = document.getElementById('playerName');
        const teamInput = document.getElementById('playerTeam');
        const goalsInput = document.getElementById('playerGoals');

        if (nameInput && teamInput && goalsInput) {
            nameInput.value = scorer.name;
            teamInput.value = scorer.team;
            goalsInput.value = scorer.goals;

            // Scroll to form
            const formCard = document.querySelector('.scorer-form-card');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the card briefly
                formCard.style.transition = 'box-shadow 0.3s ease';
                formCard.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
                setTimeout(() => {
                    formCard.style.boxShadow = 'none';
                }, 1000);
            }

            // Toggle buttons
            document.getElementById('addScorerBtn').style.display = 'none';
            document.getElementById('updateScorerBtn').style.display = 'inline-block';
        } else {
            console.error('Form inputs not found!');
        }
    } else {
        console.error('Scorer not found at index:', index);
    }
}

function populatePlayerDatalist() {
    const scorers = getScorers();
    const datalist = document.getElementById('playerNamesList');
    if (!datalist) return;

    // Get unique names
    const uniqueNames = [...new Set(scorers.map(s => s.name))];

    datalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
}

function renderScorersList() {
    const scorers = getScorers();
    const container = document.getElementById('scorersList');
    if (!container) return;

    // Sort by goals descending
    scorers.sort((a, b) => b.goals - a.goals);

    container.innerHTML = scorers.map((scorer, index) => `
        <div class="scorer-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: bold; color: #fff;">${index + 1}.</span>
                <div>
                    <div style="font-weight: bold; color: #fff;">${scorer.name}</div>
                    <div style="font-size: 0.85em; color: #aaa;">${scorer.team}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: #4CAF50; font-size: 1.2em; margin-right: 10px;">${scorer.goals} ⚽</span>
                <button onclick="editScorer(${index})" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8em;">Edit</button>
                <button onclick="deleteScorer(${index})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8em;">Delete</button>
            </div>
        </div>
    `).join('');

    if (scorers.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">No top scorers added yet.</div>';
    }
}
