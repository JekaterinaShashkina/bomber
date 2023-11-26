const socket = io();
import { renderBoard } from './modules/Field.js';
import { initializeBoard, handlePlayerMovement } from './modules/game.js';
let lives = document.querySelector('.lives__count');

// Entry point
const startGame = () => {
  initializeBoard();
  renderBoard();
  lives.innerHTML = '3';
  // Handle keydown
  document.addEventListener('keydown', (event) => {
    const { key } = event;
    handlePlayerMovement(key);
  });
};
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

const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
  const input = document.querySelector('#chat');
  const text = input.value;
  console.log(text);
  input.value = '';
  sock.emit('message', { text });
};
(() => {
  const sock = io();

  sock.on('mapUpdate', (map) => {
    // Обновите отображение карты на основе полученных данных
    console.log('Received map update:', map.map);
    // Ваш код для обновления карты на клиенте
    renderBoard(map.map);
  });
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
  document
    .querySelector('#chat-form')
    .addEventListener('submit', onChatSubmitted(sock));
})();
