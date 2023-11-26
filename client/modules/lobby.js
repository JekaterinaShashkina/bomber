const socket = io();
let playerCount = 0;

// Event listener for player connection
socket.on('playerConnected', () => {
  playerCount++;
  updatePlayerCount();
});

// Event listener for player disconnection
socket.on('playerDisconnected', () => {
  playerCount--;
  updatePlayerCount();
});

// Event listener for game start
socket.on('gameStart', () => {
  // Redirect to the game page or perform other actions
  window.location.href = '/game';
});

// Form submission event listener
document.getElementById('nicknameForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const nickname = document.getElementById('nicknameInput').value;
  // Send the nickname to the server
  socket.emit('setNickname', nickname);
  // Hide the nickname page and show the waiting page
  document.getElementById('nicknamePage').style.display = 'none';
  document.getElementById('waitingPage').style.display = 'block';
});

function updatePlayerCount() {
  document.getElementById('playerCount').innerText = playerCount;

  // Start the timer if 4 players are connected
  if (playerCount === 4) {
    startGameTimer();
  }
}

function startGameTimer() {
  let seconds = 10;
  const timerElement = document.getElementById('timer');

  const timerInterval = setInterval(() => {
    seconds--;
    timerElement.innerText = seconds;

    if (seconds === 0) {
      clearInterval(timerInterval);
      // Inform the server to start the game
      socket.emit('startGame');
    }
  }, 1000);
}
