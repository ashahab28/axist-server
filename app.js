'use strict';

var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketio(server);

server.listen(8080);

app.get('/test',
    function (req, res) {
        res.status(200).send('for auto deploy');
    }
);

io.on('connection', function (socket) {
    socket.emit('conversation', { text: 'hello world' });
    socket.on('conversation', function (data) {
        console.log(data);
    });
});