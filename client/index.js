const socket = io();
import { renderBoard } from './modules/Field.js';
import { initializeBoard, handlePlayerMovement } from './modules/game.js';
let lives = document.querySelector('.lives__count');
const mainContent = document.querySelector('.main-content');
let gameState = 'main';

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
  // const err = document.querySelector('.error');
  // if (err) {
  //   err.classList.remove('error');
  //   err.textContent = '';
  // }
  const formData = new FormData(event.target);
  formData.append('id', Math.floor(Math.random() * 10000));
  const data = Object.fromEntries(formData);
  console.log('User Data:', data);
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
      // if (data.length > 0) {
      //   console.log('Response Data:', data);
      //   const arr = [];
      //   data.forEach((elem) => {
      //     arr.push(elem.message);
      //   });
      //   // showRegistrationPage(event);
      //   // createErr(arr.join(', '));
      //   console.log(data);
      // }
      showLobbyPage(event);
    })
    .catch((error) => {
      console.error(error);
      console.log('Error occurred while submitting');
    });
};

const showLobbyPage = (event) => {
  event.preventDefault();
  gameState = 'lobby'; // Установите состояние в лобби
  mainContent.innerHTML = `
  <div id="waitingPage">
    <h1>Waiting for Players</h1>
    <p>Players Connected: <span id="playerCount">0</span></p>
    <p>Game Starting in: <span id="timer">0</span> seconds</p>
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
  initChat();
};
const showGamePage = () => {
  gameState = 'game'; // Установите состояние в игру
  // Остальной код игры...
  initChat();
};
init();
// Entry point
// const startGame = () => {
//   initializeBoard();
//   renderBoard();
//   lives.innerHTML = '3';
//   // Handle keydown
//   document.addEventListener('keydown', (event) => {
//     const { key } = event;
//     handlePlayerMovement(key);
//   });
// };
// Start the game
// startGame();

const log = (text, name) => {
  console.log(text);
  const parent = document.querySelector('#events');
  const el = document.createElement('li');
  el.innerHTML = `${name}: ${text}`;

  parent.appendChild(el);
  parent.scrollTop = parent.scrollHeight;
};

// const onChatSubmitted = (sock) => (e) => {
//   e.preventDefault();
//   const input = document.querySelector('#chat');
//   const text = input.value;
//   console.log(text);
//   input.value = '';
//   // Проверка состояния при отправке сообщения
//   if (gameState === 'lobby' || gameState === 'game') {
//     sock.emit('message', { text });
//   }
// };
// В зависимости от состояния приложения, решите, нужно ли отображать чат
const updateChatVisibility = () => {
  const chatForm = document.querySelector('#chat-form');

  if (gameState === 'lobby' || gameState === 'game') {
    chatForm.style.display = 'block';
  }
};
// Первоначальная установка видимости чата
updateChatVisibility();

const initChat = () => {
  const sock = io();

  // sock.on('mapUpdate', (map) => {
  //   // Обновите отображение карты на основе полученных данных
  //   console.log('Received map update:', map.map);
  //   // Ваш код для обновления карты на клиенте
  //   renderBoard(map.map);
  // });
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

  const onChatSubmitted = (e) => {
    e.preventDefault();
    const input = document.querySelector('#chat');
    const text = input.value;
    console.log(text);
    input.value = '';

    // Проверка состояния при отправке сообщения
    if (gameState === 'lobby' || gameState === 'game') {
      sock.emit('message', { text });
    }
  };

  // Добавить обработчик события чата
  chatForm.addEventListener('submit', onChatSubmitted);

  // Удалить обработчик события чата при разрушении страницы
  window.addEventListener('beforeunload', () => {
    chatForm.removeEventListener('submit', onChatSubmitted);
  });
};
