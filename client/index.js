const socket = io();
import { renderBoard } from './modules/Field.js';
import { initializeBoard, handlePlayerMovement } from './modules/game.js';
let lives = document.querySelector('.lives__count');
const mainContent = document.querySelector('.main-content');
let gameState = 'main';

const log = (text, name) => {
  console.log(text);
  const parent = document.querySelector('#events');
  const el = document.createElement('li');
  el.innerHTML = `${name}: ${text}`;

  parent.appendChild(el);
  parent.scrollTop = parent.scrollHeight;
};
const onChatSubmitted = (sock) => {
  const input = document.querySelector('#chat');
  const text = input.value;
  console.log(text);
  input.value = '';

  // Проверка состояния при отправке сообщения
  if (gameState === 'lobby' || gameState === 'game') {
    sock.emit('message', { text });
  }
};

const init = () => {
  mainPage();
};
const mainPage = () => {
  gameState = 'main';
  mainContent.innerHTML = `    
      <div id="nicknamePage">
        <h1>Enter Your Nickname</h1>
        <form id="nicknameForm">
          <input
            type="text"
            id="nicknameInput"
            placeholder="Enter your nickname"
            name="nickname"
            required
          />
          <button type="submit">Join Lobby</button>
        </form>
      </div>`;

  const form = document.querySelector('#nicknameForm');
  form.addEventListener('submit', submitToLobby);
};

const submitToLobby = (event) => {
  console.log('checking submitregistration form function');
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  fetch('/lobby', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      const playerId = data.playerId;
      const socket = io.connect('http://localhost:3000', {
        query: { playerId: playerId },
      });
      console.log(data);
      showLobbyPage(data.playerId, data.userData.nickname, socket);
    })
    .catch((error) => {
      console.error(error);
      console.log('Error occurred while submitting');
    });
};

const showLobbyPage = (playerId, nickname, socket) => {
  console.log('lobby page', playerId, nickname);
  gameState = 'lobby'; // Установите состояние в лобби
  mainContent.innerHTML = `
  <div id="waitingPage">
    <h1>Waiting for Players</h1>
    <p>Players Connected: <span id="playerCount">0</span></p>
    <p>Game Starting in: <span id="timer">10</span> seconds</p>
  </div>
  <div class="controls-wrapper">
  <ul id="events"></ul>
  <div class="controls">
    <div class="chat-wrapper">
      <form id="chat-form">
        <input id="chat" autocomplete="off" title="chat" />
        <button id="say">Say</button>
      </form>
    </div>
  </div>
  </div>
`;
  const time = document.querySelector('#timer');
  // Инициализация сокета с playerId
  // const sock = io({ query: playerId });
  socket.on('timerUpdate', (timeLeft) => {
    // Обновляем отображение времени на фронте
    console.log('Time left:', timeLeft / 1000);
    // Ваш код для обновления отображения времени на фронте
    time.textContent = Math.round(timeLeft / 1000);
  });

  socket.on('gameStart', (board) => {
    console.log(board);
    // Обработка начала игры, например, перенаправление на страницу игры
    console.log('Game starting now!');
    showGamePage(board);
    // Ваш код для перенаправления на страницу игры
  });

  initChat(socket);
};
const showGamePage = (board) => {
  gameState = 'game'; // Установите состояние в игру
  mainContent.innerHTML = `
      <div class="wrapper">
      <div class="game-container">
        <div class="game-board"></div>
        <div class="lives">LIVES: <span class="lives__count"></span></div>
      </div>
      <div class="controls-wrapper">
        <ul id="events"></ul>
        <div class="controls">
          <div class="chat-wrapper">
            <form id="chat-form">
              <input id="chat" autocomplete="off" title="chat" />
              <button id="say">Say</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  renderBoard(board.map);
  initChat(socket);
};
init();

// В зависимости от состояния приложения, решите, нужно ли отображать чат
const updateChatVisibility = () => {
  const chatForm = document.querySelector('#chat-form');

  if (gameState === 'lobby' || gameState === 'game') {
    chatForm.style.display = 'block';
  }
};
// Первоначальная установка видимости чата
updateChatVisibility();

const initChat = (sock) => {
  // const sock = io();

  sock.on('message', (message) => {
    console.log(message);
    log(message.text, message.playerName);
  });

  // Обработчик события подключения нового игрока
  sock.on('playerConnected', (data) => {
    console.log(data);
    log(`${data.userName} connected`, 'Admin');
  });

  // Обработчик события отключения игрока
  sock.on('playerDisconnected', (data) => {
    log(`${data.userName} disconnected`);
  });
  const chatForm = document.querySelector('#chat-form');

  // Добавить обработчик события чата
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // console.log(chatForm.input.value);
    onChatSubmitted(sock);
  });

  // Удалить обработчик события чата при разрушении страницы
  window.addEventListener('beforeunload', () => {
    chatForm.removeEventListener('submit', onChatSubmitted);
  });
};
