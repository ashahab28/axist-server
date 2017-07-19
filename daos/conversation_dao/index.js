'use strict';

var assert = require('assert-plus');

function ConversationDAO (mongoConnection) {
    assert.object(mongoConnection);

    this.mongoConnection = mongoConnection;
    this.models = {
        Conversation: this.mongoConnection.model('Conversation', require('./models/conversation'))
    };
}

ConversationDAO.prototype.createConversation = function (conversationData, callback) {
    assert.object(conversationData);
    assert.string(conversationData.user_id);
    assert.string(conversationData.message);
    assert.func(callback);

    this.models.Conversation.create(conversationData, callback);
};

ConversationDAO.prototype.findConversationsByUserId = function (userId, callback) {
    assert.string(userId);
    assert.func(callback);

    this.models.Conversation.find({ user_id: userId }, callback);
};

ConversationDAO.prototype.findConversationById = function (conversationId, callback) {
    assert.string(conversationId);
    assert.func(callback);

    this.models.Conversation.findById(conversationId, callback);
};

module.exports = ConversationDAO;