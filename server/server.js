const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const board = require('./Map.js');
const app = express();
app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const io = socketio(server);
const players = {};

io.on('connection', (socket) => {
  const playerId = socket.id;

  players[playerId] = {
    id: playerId,
    userName: `Player${Object.keys(players).length + 1}`,
  };

  socket.emit('message', `Welcome, ${players[playerId].username}!`);
  console.log(`Player ${socket.id} connected`);

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
