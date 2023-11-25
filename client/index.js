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
startGame();

const log = (text) => {
  const parent = document.querySelector('#events');
  const el = document.createElement('li');
  el.innerHTML = text;

  parent.appendChild(el);
  parent.scrollTop = parent.scrollHeight;
};

const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();
  const input = document.querySelector('#chat');
  const text = input.value;

  input.value = '';
  sock.emit('message', text);
};
(() => {
  const sock = io();

  sock.on('message', log);
  document
    .querySelector('#chat-form')
    .addEventListener('submit', onChatSubmitted(sock));
})();
