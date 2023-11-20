import {
  boardSize,
  WALL,
  EMPTY,
  BOMB,
  BREAKABLE_WALL,
  PLAYER,
  EXPLOSION,
  board,
} from './modules/const.js';
import { renderBoard } from './modules/Field.js';

let playerPosition = { x: 0, y: 0 };
const bombs = [];
const animationDuration = 500; // in milliseconds
const framesPerSecond = 60;
const totalFrames = (animationDuration / 1000) * framesPerSecond;
let animationFrameId;
let placeBombFlag = false;
let isBombPlaced = false;
// Initialize the game board
const initializeBoard = () => {
  for (let i = 0; i < boardSize; i++) {
    const row = [];
    for (let j = 0; j < boardSize; j++) {
      // Add walls on the borders and at even cells
      if (
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
  // Set player position
  playerPosition = { x: 1, y: 1 };
  board[playerPosition.y][playerPosition.x] = PLAYER;
};

const animateStep = (startTime, startX, startY, endX, endY) => {
  const currentTime = Date.now();
  const progress = (currentTime - startTime) / animationDuration;
  const deltaX = (endX - startX) / totalFrames;
  const deltaY = (endY - startY) / totalFrames;

  if (progress < 1) {
    const interpolatedX = startX + progress * deltaX;
    const interpolatedY = startY + progress * deltaY;

    const roundedX = Math.round(interpolatedX);
    const roundedY = Math.round(interpolatedY);

    if (board[roundedY][roundedX] !== BOMB) {
      board[roundedY][roundedX] = EMPTY;
    }

    playerPosition.x = interpolatedX;
    playerPosition.y = interpolatedY;

    renderBoard();
    if (placeBombFlag) {
      placeBomb();
      placeBombFlag = false;
    }

    // Запустить следующий шаг анимации
    requestAnimationFrame((newTime) =>
      animateStep(newTime, startX, startY, endX, endY),
    );
  } else {
    // Finish animation and update player position
    const roundedX = Math.round(endX);
    const roundedY = Math.round(endY);

    if (
      board[roundedY][roundedX] !== WALL &&
      board[roundedY][roundedX] !== BREAKABLE_WALL &&
      board[roundedY][roundedX] !== BOMB
    ) {
      playerPosition.x = roundedX;
      playerPosition.y = roundedY;
      board[roundedY][roundedX] = PLAYER;
    }

    renderBoard();
  }
};

const handlePlayerMovement = (key) => {
  let newX = playerPosition.x;
  let newY = playerPosition.y;
  console.log(key);
  if (key === 'ArrowUp' && playerPosition.y > 0) {
    newY -= 1;
  } else if (key === 'ArrowDown' && playerPosition.y < boardSize - 1) {
    newY += 1;
  } else if (key === 'ArrowLeft' && playerPosition.x > 0) {
    newX -= 1;
  } else if (key === 'ArrowRight' && playerPosition.x < boardSize - 1) {
    newX += 1;
  } else if (key === ' ') {
    // If space is pressed, set the flag to place a bomb
    placeBombFlag = true;
  }

  console.log(newX, newY);
  // New position move avalaibility control
  if (board[newY][newX] !== WALL && board[newY][newX] !== BREAKABLE_WALL) {
    const startTime = Date.now();
    const startX = playerPosition.x;
    const startY = playerPosition.y;

    // Animation start
    animationFrameId = requestAnimationFrame(() =>
      animateStep(startTime, startX, startY, newX, newY),
    );
  }
};

const placeBomb = () => {
  if (!isBombPlaced) {
    const currentPlayerX = playerPosition.x;
    const currentPlayerY = playerPosition.y;

    //  place bomb on the current player position
    board[currentPlayerY][currentPlayerX] = BOMB;
    bombs.push({ x: currentPlayerX, y: currentPlayerY });
    console.log(board[currentPlayerY][currentPlayerX]);

    isBombPlaced = true;
    // draw  new field
    renderBoard();
    // timer for bomb (3 sec)
    console.log(board[currentPlayerY][currentPlayerX]);
    setTimeout(() => {
      explodeBomb(currentPlayerX, currentPlayerY, 1);
      isBombPlaced = false;
    }, 3000);
  }
};
// define explosion directions
const directions = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];

const explodeBomb = (x, y, radius) => {
  const animateExplosion = () => {
    for (const direction of directions) {
      for (let i = 0; i <= radius; i++) {
        const targetX = x + direction.x * i;
        const targetY = y + direction.y * i;
        // Walls control
        if (board[targetY][targetX] === WALL) {
          break;
        }
        // Mark cell as explosion
        board[targetY][targetX] = EXPLOSION;

        if (board[targetY][targetX] === BOMB) {
          explodeBomb(targetX, targetY, explosionRadius);
        }
      }
    }

    // Logic of effects to walls and player

    // Draw new field
    renderBoard();

    // Call animateExplosion again until the end of animation time
    if (animationFrameCounter < maxFrames) {
      requestAnimationFrame(animateExplosion);
      animationFrameCounter++;
    } else {
      // for (const direction of directions) {
      //   for (let i = 0; i <= radius; i++) {
      //     const targetX = x + direction.x * i;
      //     const targetY = y + direction.y * i;
      //     console.log(board[targetY][targetX]);
      //     if (board[targetY][targetX] === WALL) {
      //       break;
      //     }
      //     board[targetY][targetX] = EMPTY;
      //   }
      // }
      // Set timeout to remove the explosion after a certain time
      setTimeout(() => {
        for (const direction of directions) {
          for (let i = 0; i <= radius; i++) {
            const targetX = x + direction.x * i;
            const targetY = y + direction.y * i;
            if (board[targetY][targetX] === WALL) {
              break;
            }
            board[targetY][targetX] = EMPTY;
          }
        }
        renderBoard();
      }, 500); // Adjust the time as needed
    }
  };

  let animationFrameCounter = 0;
  const maxFrames = 60;
  animateExplosion();
};

// Entry point
const startGame = () => {
  initializeBoard();
  renderBoard();
  // Handle keydown
  document.addEventListener('keydown', (event) => {
    const { key } = event;
    handlePlayerMovement(key);
  });
};
// Start the game
startGame();
