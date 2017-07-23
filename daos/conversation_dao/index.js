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
    assert.optionalString(conversationData.intent);
    assert.func(callback);

    this.models.Conversation.create(conversationData, callback);
};

ConversationDAO.prototype.getConversationsByUserId = function (userId, options, callback) {
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

ConversationDAO.prototype.getConversationById = function (conversationId, callback) {
    assert.string(conversationId);
    assert.func(callback);

    this.models.Conversation.findById(conversationId, callback);
};

ConversationDAO.prototype.getLatestConversationByUserId = function (userId, callback) {
    assert.string(userId);
    assert.func(callback);

    this.models.Conversation.findOne({ user_id: userId }).sort({ created: -1 }).exec(callback);
};

ConversationDAO.prototype.updateConversationResponse = function (conversation, response, callback) {
    assert.object(conversation);
    assert.string(response);
    assert.func(callback);

    this.models.Conversation.findOneAndUpdate({ _id: conversation.id },
        {
            $set: {
                response: response
            }
        },
        { new: true }, 
        callback
    );
};

ConversationDAO.prototype.updateConversationFeedback = function (conversation, isPositiveFeedback, callback) {
    assert.object(conversation);
    assert.bool(isPositiveFeedback);
    assert.func(callback);

    this.models.Conversation.findOneAndUpdate({ _id: conversation.id },
        {
            $set: {
                feedback: isPositiveFeedback
            }
        },
        { new: true }, 
        callback
    );
};

module.exports = ConversationDAO;