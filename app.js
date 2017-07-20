'use strict';

var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var mongoose = require('mongoose');
var Joi = require('joi');
var ExpressValidation = require('express-validation');
var bodyParser = require('body-parser');

var mongoConfig = require('./config/mongo');

var ConversationDAO = require('./daos/conversation_dao');
var UserDAO = require('./daos/user_dao');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var mongoConnection = mongoose.createConnection(mongoConfig);

var conversationDAO = new ConversationDAO(mongoConnection);
var userDAO = new UserDAO(mongoConnection);

server.listen(8080);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/register',
    ExpressValidation({
        body: {
            username: Joi.string().required(),
            password: Joi.string().required(),
            email: Joi.string().required()
        }
    }),
    function (req, res) {
        userDAO.createUser(req.body, function (err, user) {
            if (err) {
                return res.status(500).send('Sorry, there is internal server issue happening right now :(');
            }

            res.status(200).send(user.toJSON());
        });
    }
);

app.post('/login', 
    ExpressValidation({
        body: {
            username: Joi.string().required(),
            password: Joi.string().required()
        }
    }),
    function (req, res) {
        userDAO.findUserByUsername(req.body, function (err, user) {
            if (err) {
                return res.status(500).send('Sorry, there is internal server issue happening right now :(');
            }

            res.status(200).send(user.toJSON());
        });
    }
);

app.post('/messages',
    ExpressValidation({
        body: {
            message: Joi.string().required()
        }
    }),
    function (req, res) {
        witAIService.handleIncomingMessage(req.body.message, function(err, response) {
            res.status(200).send(response);
        });
    }
);


io.on('connection', function (socket) {
    socket.emit('conversation', { message: 'Hello! may i help you? :)' });

    socket.on('register', function (message) {
        Joi.validate(message, Joi.object().keys({
            username: Joi.string().required(),
            password: Joi.string().required(),
            email: Joi.string().required(),
        }), { stripUnknown: { objects: true } }, function (err, validatedMessage) {
            if (err) {
                return socket.emit('register_error', { error: 'Message is not in a valid format' });
            }

            userDAO.createUser(validatedMessage, function (err) {
                if (err) {
                    console.log(err);

                    return socket.emit('register_error', { error: 'Sorry, there is internal server issue happening right now :(' });
                }

                socket.emit('register', { message: 'You have successfully registered to Axist! Yeay!' });
            });
        });
    });

    socket.on('login', function (message) {
        Joi.validate(message, Joi.object().keys({
            username: Joi.string().required(),
            password: Joi.string().required(),
        }), { stripUnknown: { objects: true } }, function (err, validatedMessage) {
            if (err) {
                return socket.emit('login_error', { error: 'Message is not in a valid format' });
            }

            userDAO.findUserByUsername(validatedMessage, function (err, user) {
                if (err) {
                    console.log(err);

                    return socket.emit('login_error', { error: 'Sorry, there is internal server issue happening right now :(' });
                }

                socket.emit('login', { message: 'Welcome to Axist! here is your user id : ' + user.id });
            });
        });
    });    

    socket.on('conversation', function (message) {
        Joi.validate(message, Joi.object().keys({
            user_id: Joi.string().required(),
            message: Joi.string().required(),
        }), { stripUnknown: { objects: true } }, function (err, validatedMessage) {
            if (err) {
                return socket.emit('conversation_error', { error: 'Message is not in a valid format' });
            }

            conversationDAO.createConversation(validatedMessage, function (err, conversation) {
                if (err) {
                    console.log(err);

                    return socket.emit('conversation_error', { error: 'Cannot save conversation' });
                }

                //call axist here and emit the response

                socket.emit('conversation', { message: 'Hey there, we receive your message! here is your message : ' + conversation.message });
            });
        });
    });
});