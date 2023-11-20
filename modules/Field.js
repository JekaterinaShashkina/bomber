import {
  board,
  boardSize,
  BOMB,
  BREAKABLE_WALL,
  WALL,
  EMPTY,
  EXPLOSION,
  PLAYER,
} from './const.js ';

// Render the game board
export const renderBoard = () => {
  const gameBoard = document.querySelector('.game-board');
  gameBoard.innerHTML = '';

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (board[i][j] === WALL) {
        cell.classList.add('wall');
      } else if (board[i][j] === PLAYER) {
        cell.classList.add('player');
      } else if (board[i][j] === BOMB) {
        cell.classList.add('bomb');
      } else if (board[i][j] === EXPLOSION) {
        cell.classList.add('explosion');
      } else if (board[i][j] === BREAKABLE_WALL) {
        cell.classList.add('breakable-wall');
      }

      gameBoard.append(cell);
    }
  }
};
