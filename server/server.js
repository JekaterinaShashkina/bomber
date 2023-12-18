const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const board = require('./Map.js');
const app = express();
app.use(express.static(`${__dirname}/../client`));
const server = http.createServer(app);
const io = socketio(server);
const players = {};
let gamers_count = 0;
let gameTimer;
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
  console.log('player ', player);
  socket.join('lobby');
  if (player) {
    console.log(`Player ${playerId} connected`);
    gamers_count = Object.keys(players).length;
    console.log('Players count ', gamers_count);

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
    // socket.emit('error', 'Invalid playerId');
    // socket.disconnect();
  }

  // console.log('Players count ', Object.keys(players).length);

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
