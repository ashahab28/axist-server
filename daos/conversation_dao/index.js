'use strict';

var _ = require('underscore');
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

ConversationDAO.prototype.findConversationsByUserId = function (userId, options, callback) {
    assert.string(userId);
    assert.object(options);
    assert.func(callback);

    var query = { user_id: userId };
    var conversationLimit = 0;

    if (!_.isUndefined(options.conversation_limit)) {
        conversationLimit = options.conversation_limit;
    }

    this.models.Conversation.find(query).sort({ created: -1 }).limit(conversationLimit).exec(callback);
};

ConversationDAO.prototype.findConversationById = function (conversationId, callback) {
    assert.string(conversationId);
    assert.func(callback);

    this.models.Conversation.findById(conversationId, callback);
};

module.exports = ConversationDAO;