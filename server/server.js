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
    console.log('players ', players);
    console.log('board ', board);
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

server.on('error', (err) => {
  console.error(err);
});
server.listen(3000, () => {
  console.log('server is ready');
});

function assignStartPosition(playerId) {
  // Логика для назначения начальной позиции игроку
  // Например, используйте playerPositions из предыдущего примера
  const positionIndex = Object.keys(players).length - 1;
  players[playerId].position = playerPositions[positionIndex];
}
function updateGameBoard(board, players) {
  // Сначала очистите старые позиции игроков
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      console.log(board);
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
  io.emit('updateBoard', board);
  return board;
}
