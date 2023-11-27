const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const board = require('./Map.js');
const app = express();
app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server);
const players = {};
const gamers = [];
// Парсинг JSON в теле запроса
app.use(express.json());

app.post('/lobby', (req, res) => {
  const userData = req.body;
  console.log('Received data:', userData);
  // const playerId = socket.id;

  res.json({ message: 'Data received successfully' });
  gamers.push({ ...userData });
  // console.log(gamers);
});

io.on('connection', (socket) => {
  console.log('A user connected to chat');

  socket.join('chat');

  const playerId = socket.id;
  console.log(gamers);
  players[playerId] = {
    id: gamers.id,
    userName: /*`Player${Object.keys(players).length + 1}`*/ gamers.nickname,
  };

  socket.emit('message', `Welcome, ${players[playerId].username}!`);
  console.log(`Player ${socket.id}${players[playerId].username} connected`);

  socket.emit('mapUpdate', board);

  // Отправляем информацию о подключившемся игроке другим игрокам
  io.emit('playerConnected', players[playerId]);

  // Обработка сообщений чата
  socket.on('message', (data) => {
    // Отправляем сообщение всем подключенным пользователям, включая отправителя
    console.log(players[playerId]);
    io.emit('message', {
      playerName: players[playerId].userName,
      text: data.text,
    });
  });

  // Обработка отключения игрока
  socket.on('disconnect', () => {
    // Удаляем информацию об отключившемся игроке
    delete players[playerId];

    // Отправляем информацию об отключившемся игроке другим игрокам
    io.emit('playerDisconnected', playerId);
  });
});

server.on('error', (err) => {
  console.error(err);
});
server.listen(3000, () => {
  console.log('server is ready');
});
