'use strict';

var assert = require('assert-plus');

function ResponseTemplateDAO (mongoConnection) {
    assert.object(mongoConnection);

    this.mongoConnection = mongoConnection;
    this.models = {
        ReponseStorage: this.mongoConnection.model('ReponseStorage', require('./models/responses_storage'))
    };
}

ResponseTemplateDAO.prototype.createResponse = function (responseTemplateData, callback) {
    assert.object(responseTemplateData);
    assert.string(responseTemplateData.intent);
    assert.string(responseTemplateData.response);
    assert.func(callback);

    this.models.ReponseStorage.create(responseTemplateData, callback);
};

ResponseTemplateDAO.prototype.findResponsesTemplateByIntent = function (intent, callback) {
    assert.string(intent);
    assert.func(callback);

    this.models.Conversation.find({ intent: intent }, callback);
};

module.exports = ResponseTemplateDAO;