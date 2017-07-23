'use strict';

var _ = require('underscore');
var async = require('async');
var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var mongoose = require('mongoose');
var Joi = require('joi');
var ExpressValidation = require('express-validation');
var bodyParser = require('body-parser');

var witAIConfig = require('./config/wit_ai');
var mongoConfig = require('./config/mongo');

var WitAIService = require('./services/wit_ai_service');

var ConversationDAO = require('./daos/conversation_dao');
var ResponseGeneratorDAO = require('./daos/response_generator_dao');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var mongoConnection = mongoose.createConnection(mongoConfig);

var witAIService = new WitAIService(witAIConfig);

var conversationDAO = new ConversationDAO(mongoConnection);
var responseGeneratorDAO = new ResponseGeneratorDAO(mongoConnection, conversationDAO);

var errorHandler = function (err, res) {
    console.log(err);
    
    return res.status(500).send('Sorry, there is internal server issue happening right now :(');
};

server.listen(8080);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/response_templates',
    ExpressValidation({
        body: {
            intent: Joi.string().required(),
            response: Joi.string().required()
        }
    }),
    function (req, res) {
        responseGeneratorDAO.createResponseTemplate(req.body, function (err, responseTemplate) {
            if (err) {
                return errorHandler(err, res);
            }

            res.status(200).send(responseTemplate);
        });
    }
);

app.post('/messages',
    ExpressValidation({
        body: {
            message: Joi.string().required(),
            user_id: Joi.string().required()
        }
    }),
    function (req, res) {
        async.auto({
            wit_ai_object: function (next) {
                witAIService.handleIncomingMessage(req.body.message, next);
            },
            latest_conversation: function (next) {
                conversationDAO.getLatestConversationByUserId(req.body.user_id, next);
            },
            conversation: ['wit_ai_object', 'latest_conversation', function (result, next) {
                conversationDAO.createConversation(_.extend(req.body, result.wit_ai_object), next);
            }],
            responses: ['conversation', function (results, next) {
                responseGeneratorDAO.generateResponse(results.conversation, results.latest_conversation, next);
            }],
            updated_conversation: ['responses', function (results, next) {
                conversationDAO.updateConversationResponse(results.conversation, results.responses, next);
            }]
        }, function (err, results) {
            if (err) {
                return errorHandler(err, res);
            }

            console.log('results', results);

            res.status(200).send(results.responses);
        });
    }
);

io.on('connection', function (socket) {
    socket.on('get_latest_conversation', function (message) {
        Joi.validate(message, Joi.object().keys({
            user_id: Joi.string().required()
        }), { stripUnknown: { objects: true } }, function (err, validatedMessage) {
            if (err) {
                return socket.emit('get_latest_conversation_error', { error: 'Message is not in a valid format' });
            }

            conversationDAO.getConversationsByUserId(validatedMessage.user_id, { conversation_limit: 10 }, function (err, conversations) {
                if (err) {
                    return socket.emit('get_latest_conversation_error', { error: 'Get latest conversations error' });
                }

                var messages = _.map(conversations, function (conversation) {
                    return conversation.toJSON();
                });

                socket.emit('get_latest_conversation', { messages: messages });
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

            async.auto({
                wit_ai_object: function (next) {
                    witAIService.handleIncomingMessage(validatedMessage.message, next);
                },
                latest_conversation: function (next) {
                    conversationDAO.getLatestConversationByUserId(validatedMessage.user_id, next);
                },
                conversation: ['wit_ai_object', 'latest_conversation', function (results, next) {
                    conversationDAO.createConversation(_.extend(validatedMessage, results.wit_ai_object), next);
                }],
                responses: ['conversation', function (results, next) {
                    responseGeneratorDAO.generateResponse(results.conversation, results.latest_conversation, next);
                }],
                updated_conversation: ['responses', function (results, next) {
                    conversationDAO.updateConversationResponse(results.conversation, results.responses, next);
                }]
            }, function (err, results) {
                if (err) {
                    return socket.emit('conversation_error', { error: 'Cannot get resposne from Axist :(' });
                }

                console.log('results', results);

                socket.emit('conversation', { message: results.updated_conversation.toJSON() });
            });
        });
    });
});