const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const board = require('./Map.js');
const app = express();
app.use(express.static(`${__dirname}/../client`));
const server = http.createServer(app);
const io = socketio(server);
const players = {};
const boardSize = 15; // 15x15 game board
let gamers_count = 0;
let gameTimer;
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
  { x: boardSize - 2, y: boardSize - 2 }, // Игрок 4
  { x: 1, y: boardSize - 2 }, // Игрок 2
  { x: boardSize - 2, y: 1 }, // Игрок 3
];
let isBombPlaced = false;
const bombs = [];
// Парсинг JSON в теле запроса
app.use(express.json());

// Обработка запроса на лобби
app.post('/lobby', (req, res) => {
  const userData = req.body;
  console.log('Received data:', userData);

  // Генерация уникального идентификатора для игрока
  const playerId = Math.floor(Math.random() * 10000);
  // Добавление игрока в список
  players[playerId] = {
    id: playerId,
    userName: userData.nickname,
    position: null,
    // Другие данные игрока
  };
  res.json({ playerId: playerId, userData: userData });
  console.log('sended data', players[playerId]);
});

io.on('connection', (socket) => {
  const playerId = socket.handshake.query.playerId;
  const player = players[playerId];
  socket.join('lobby');
  if (player) {
    console.log(`Player ${playerId} connected`);
    gamers_count = Object.keys(players).length;
    console.log('Players count ', gamers_count);
    // Назначение начальной позиции игрока
    assignStartPosition(playerId);
    updateGameBoard(board, players);

    // Отправка информации о новом игроке в лобби
    io.to('lobby').emit('playerConnected', player);
    // Обработка сообщений чата
    socket.on('message', (data) => {
      // Отправка сообщения всем подключенным пользователям, включая отправителя
      io.to('lobby').emit('message', {
        playerName: player.userName,
        text: data.text,
      });
    });
  } else {
    console.log(`Unknown player tried to connect with ID: ${playerId}`);
  }
  socket.on('move', (data) => {
    const { direction, playerId } = data;
    // Обновите позицию для этого игрока
    updatePlayerPosition(playerId, direction);
    // Отправьте обновленное состояние игры всем клиентам
    updateGameBoard(board, players);
  });
  // На стороне сервера
  socket.on('placeBomb', (data) => {
    const { playerId } = data;
    placeBomb(playerId, board, players);
  });

  // Обработка отключения игрока
  socket.on('disconnect', () => {
    // Удаление информации об отключившемся игроке
    delete players[playerId];

    // Отправка информации об отключившемся игроке другим игрокам в лобби
    io.to('lobby').emit('playerDisconnected', playerId);
    // Если игрок отключается и у нас есть таймер, остановите его
    if (gameTimer) {
      clearInterval(gameTimer);
    }
  });
  // Если количество игроков 2 или больше, запускаем таймер
  if (gamers_count >= 2 && !gameTimer) {
    startGameTimer();
  }
});
server.on('error', (err) => {
  console.error(err);
});
server.listen(3000, () => {
  console.log('server is ready');
});

// Функция для запуска таймера
function startGameTimer() {
  const startTime = Date.now();
  const duration = 10000; // 10 секунд

  gameTimer = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const timeLeft = Math.max(0, duration - elapsedTime);

    // Перенаправление на страницу игры или выполнение других действий
    if (timeLeft === 0) {
      console.log('Game starting now!');
      io.to('lobby').emit('gameStart', board); // Сообщаем клиентам о начале игры
      clearInterval(gameTimer);
    }

    io.to('lobby').emit('timerUpdate', timeLeft);
  }, 1000);
}

// Логика для назначения начальной позиции игроку
function assignStartPosition(playerId) {
  // Например, используйте playerPositions из предыдущего примера
  const positionIndex = Object.keys(players).length - 1;
  players[playerId].position = playerPositions[positionIndex];
}
// функция для обновления игровой доски
function updateGameBoard(board, players) {
  // Сначала очистите старые позиции игроков
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board.map[y][x] === PLAYER) {
        board.map[y][x] = EMPTY;
      }
    }
  }
  // Затем добавьте игроков на их текущие позиции
  Object.values(players).forEach((player) => {
    const pos = player.position;
    if (pos) {
      board.map[pos.y][pos.x] = PLAYER;
    }
  });
  // Отправка обновленного состояния доски всем подключенным клиентам
  io.emit('updateBoard', board.map);
}

function updatePlayerPosition(playerId, direction) {
  const player = players[playerId];
  if (!player) return;
  let newX = player.position.x;
  let newY = player.position.y;
  switch (direction) {
    case 'left':
      newX--;
      break;
    case 'right':
      newX++;
      break;
    case 'up':
      newY--;
      break;
    case 'down':
      newY++;
      break;
  }
  // Добавьте логику для обновления позиции игрока
  if (canMoveTo(newX, newY, board)) {
    // Обновляем позицию игрока
    player.position.x = newX;
    player.position.y = newY;
    // Обновляем игровое поле
    updateGameBoard(board, players);
  }
}
function canMoveTo(x, y, board) {
  // Проверка границ доски
  if (x < 0 || x >= board.map.length || y < 0 || y >= board.map[x].length) {
    return false;
  }
  // Проверка, является ли клетка стеной
  return board.map[y][x] !== WALL && board.map[y][x] !== BREAKABLE_WALL;
}

function placeBomb(playerId, board, players) {
  const player = players[playerId];
  if (!player) return;
  if (!isBombPlaced) {
    const bombPosition = { x: player.position.x, y: player.position.y };
    board.map[bombPosition.y][bombPosition.x] = BOMB;
    bombs.push({ x: player.position.x, y: player.position.y });
    isBombPlaced = true;
    // Установка таймера для взрыва бомбы
    setTimeout(() => {
      explodeBomb(bombPosition.x, bombPosition.y, 2, board, players, playerId);
      updateGameBoard(board, players); // Обновляем доску после взрыва
      isBombPlaced = false;
    }, 3000);
  }
}
// define explosion directions
const directions = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];
function explodeBomb(x, y, radius, board, players, playerId) {
  // Логика взрыва бомбы
  // Например, измените клетки вокруг бомбы и проверьте, есть ли игроки рядом
  const player = players[playerId];
  // const animateExplosion = () => {
  for (const direction of directions) {
    for (let i = 0; i <= radius; i++) {
      const targetX = x + direction.x * i;
      const targetY = y + direction.y * i;
      // Walls control
      if (board.map[targetY][targetX] === WALL) {
        break;
      }
      // Check if player is in the explosion area
      if (targetX === player.position.x && targetY === player.position.y) {
        // playerDies(); // Вызываем функцию обработки смерти
        console.log('player dies');
        // return;
      }
      if (board.map[targetY][targetX] === BREAKABLE_WALL) {
        if (Math.random() < 0.3) {
          // const powerUpType = getRandomPowerUpType();
          // board.map[targetY][targetX] = powerUpType;
        } else {
          board.map[targetY][targetX] = EMPTY;
        }
      } else {
        // Mark cell as explosion
        board.map[targetY][targetX] = EXPLOSION;
      }

      if (
        board.map[targetY][targetX] === BOMB ||
        board.map[targetY][targetX] === PLAYER
      ) {
        explodeBomb(targetX, targetY);
      }
      io.emit('bombExploded', { x: targetX, y: targetY, radius: 2 });
    }
  }
  // Draw new field
  // renderBoard();
  updateGameBoard(board, players);
  // Сервер Отправляет Уведомление о Взрыве:
  // Call animateExplosion again until the end of animation time
  // if (animationFrameCounter < maxFrames) {
  //   requestAnimationFrame(animateExplosion);
  //   animationFrameCounter++;
  // } else {
  //   // for (const direction of directions) {
  //   //   for (let i = 0; i <= radius; i++) {
  //   //     const targetX = x + direction.x * i;
  //   //     const targetY = y + direction.y * i;
  //   //     console.log(board[targetY][targetX]);
  //   //     if (board[targetY][targetX] === WALL) {
  //   //       break;
  //   //     }
  //   //     board[targetY][targetX] = EMPTY;
  //   //   }
  //   // }
  //   // Set timeout to remove the explosion after a certain time
  //   setTimeout(() => {
  //     for (const direction of directions) {
  //       for (let i = 0; i <= radius; i++) {
  //         const targetX = x + direction.x * i;
  //         const targetY = y + direction.y * i;
  //         if (board.map[targetY][targetX] === WALL) {
  //           break;
  //         }
  //         board.map[targetY][targetX] = EMPTY;
  //       }
  //     }
  //     // placePowerUp(x, y);
  //     // renderBoard();
  //     updateGameBoard(board, players);
  //   }, 500); // Adjust the time as needed
  // }
  // }
  // bombs.splice(
  const i = bombs.findIndex((bomb) => bomb.x === x && bomb.y === y);
  bombs.splice(i, 1);
  //   1,
  // );
  // console.log(bombs);
  // let animationFrameCounter = 0;
  // const maxFrames = 60;
  // animateExplosion();
}
