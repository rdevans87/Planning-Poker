const socket = io('http://localhost:3000');
let sessionId;

// Join a session
function joinSession() {
  sessionId = document.getElementById('session-id-input').value.trim();
  const userName = document.getElementById('player-name-input').value.trim();
  const userRole = document.getElementById('player-role-select').value;

  if (!sessionId || !userName || !userRole) {
    alert('Please fill in all fields.');
    return;
  }

  socket.emit('joinSession', { sessionId, userName, userRole });
}

// Add an issue card
function addIssueCard() {
  const issueTitle = document.getElementById('issue-title-input').value.trim();
  const issueDescription = document.getElementById('issue-description-input').value.trim();
  const issueUrl = document.getElementById('issue-url-input').value.trim();

  if (!sessionId || !issueTitle || !issueDescription) {
    alert('Please join a session and fill in all fields.');
    return;
  }
  socket.emit('addIssueCard', { sessionId, title: issueTitle, description: issueDescription, url: issueUrl });

  //document.getElementById('issue-title-input').value = '';
  //document.getElementById('issue-description-input').value = '';
  //document.getElementById('issue-url-input').value = '';
}

// Listen for session updates
socket.on('sessionData', (session) => {
  renderPlayers(session.users);
  renderIssueCards(session.issueCards || []);
});

// Render players in session
function renderPlayers(users) {
  const playerList = document.getElementById('player-list');
  playerList.innerHTML = '';
  users.forEach(({ name, role }) => {
    const li = document.createElement('li');
    li.textContent = `${name} (${role})`;
    playerList.appendChild(li);
  });
}

// Render issue cards
function renderIssueCards(issueCards) {
  const issueCardsList = document.getElementById('issue-cards-list');
  issueCardsList.innerHTML = '';

  issueCards.forEach((card, index) => {
    const devAverage = calculateAverage(card.devEstimates || []);
    const qaAverage = calculateAverage(card.qaEstimates || []);
    const combinedTotal = (parseFloat(devAverage) + parseFloat(qaAverage)).toFixed(2);

    const li = document.createElement('li');
    li.style.marginBottom = '20px';
    li.style.padding = '10px';
    li.style.border = '1px solid #ccc';
    li.style.borderRadius = '5px';


    // Create the content for the issue card
    li.innerHTML = `
     <strong>${card.title}</strong><br>
      <p>${card.description}</p>
      ${card.url ? `<a href="${card.url}" target="_blank" style="color: #007bff; text-decoration: underline;">View Jira Issue</a>` : ''}
      <div style="margin-top: 10px;">
        <!-- Dev Team Estimate -->
        <label for="dev-estimate-${index}">Dev Team Estimate:</label>
        <input id="dev-estimate-${index}" type="number" placeholder="Enter points" style="width: 80px;">
        <button onclick="submitEstimate(${index}, 'dev')">Submit</button>

        <!-- QA Team Estimate -->
        <label for="qa-estimate-${index}" style="margin-left: 10px;">QA Team Estimate:</label>
        <input id="qa-estimate-${index}" type="number" placeholder="Enter points" style="width: 80px;">
        <button onclick="submitEstimate(${index}, 'qa')">Submit</button>
      </div>

      <!-- Results Section -->
      <div style="margin-top: 10px;">
        <p>Dev Team Average: <span style="color: #28a745;">${devAverage}</span></p>
        <p>QA Team Average: <span style="color: #17a2b8;">${qaAverage}</span></p>
        <p style="color: #dc3545; font-weight: bold;">Combined Total: ${combinedTotal}</p>
      </div>
    `;
    // Add the issue card to the list
    issueCardsList.appendChild(li);
  });
}
  // Submit Estimate Function
function submitEstimate(cardIndex, team) {
  const inputId = team === 'dev' ? `dev-estimate-${cardIndex}` : `qa-estimate-${cardIndex}`;
  const estimateInput = document.getElementById(inputId);
  const estimate = parseInt(estimateInput.value, 10);

  if (isNaN(estimate) || estimate <= 0) {
    alert('Please enter a valid story point estimate.');
    return;
  }

  socket.emit('submitEstimate', { sessionId, cardIndex, team, estimate });
  estimateInput.value = ''; // Clear the input field
}

// Calculate Average Function
function calculateAverage(estimates) {
  if (!estimates.length) return 0;
  const sum = estimates.reduce((total, value) => total + value, 0);
  return (sum / estimates.length).toFixed(2);
}
