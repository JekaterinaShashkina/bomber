const boardSize = 15; // 15x15 game board
const board = []; // 2D array to represent the game board

// Constants for cell types
const EMPTY = 0;
const WALL = 1;
const PLAYER = 2;
const BOMB = 3;
const EXPLOSION = 4;
const BREAKABLE_WALL = 5;
const POWER_UP_BOMB_COUNT = 6;
const POWER_UP_SPEED_COUNT = 7;
const POWER_UP_FLAME_COUNT = 8;
const playerPositions = [
  { x: 1, y: 1 }, // Игрок 1
  { x: 1, y: boardSize - 2 }, // Игрок 2
  { x: boardSize - 2, y: 1 }, // Игрок 3
  { x: boardSize - 2, y: boardSize - 2 }, // Игрок 4
];

// Initialize the game board
const initializeBoard = () => {
  for (let i = 0; i < boardSize; i++) {
    const row = [];
    for (let j = 0; j < boardSize; j++) {
      // Add walls on the borders and at even cells
      let isPlayerPosition = playerPositions.some(
        (p) => p.x === j && p.y === i,
      );
      if (isPlayerPosition) {
        row.push(PLAYER);
      } else if (
        i === 0 ||
        i === boardSize - 1 ||
        j === 0 ||
        j === boardSize - 1 ||
        (i % 2 === 0 && j % 2 === 0)
        // Math.random() < 0.2
      ) {
        row.push(WALL);
      } else if (
        i % 2 === 1 &&
        j % 2 === 1 &&
        !(i === 1 && j === 1) &&
        Math.random() < 0.4
      ) {
        row.push(BREAKABLE_WALL);
      } else {
        row.push(EMPTY);
      }
    }
    board.push(row);
  }
  // Проверяем, находится ли клетка в одной из начальных позиций игроков
  // // Set player position
  // playerPosition = { x: 1, y: 1 };
  // board[playerPosition.y][playerPosition.x] = PLAYER;

  return board;
};

// exports.newBoard = updateGameBoard();
exports.map = initializeBoard();
