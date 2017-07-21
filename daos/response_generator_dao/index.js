'use strict';

var _ = require('underscore');
var assert = require('assert-plus');
var async = require('async');

function ResponseGeneratorDAO (mongoConnection) {
    assert.object(mongoConnection);

    this.mongoConnection = mongoConnection;
    this.models = {
        ReponseTemplate: this.mongoConnection.model('ReponseTemplate', require('./models/response_template'))
    };
}

ResponseGeneratorDAO.prototype.createResponseTemplate = function (responseTemplateData, callback) {
    assert.object(responseTemplateData);
    assert.string(responseTemplateData.intent);
    assert.string(responseTemplateData.response);
    assert.func(callback);

    this.models.ReponseTemplate.create(responseTemplateData, callback);
};

ResponseGeneratorDAO.prototype.generateResponse = function (conversation, callback) {
    assert.object(conversation);
    assert.string(conversation.message);
    assert.optionalString(conversation.intent);
    assert.string(conversation.user_id);
    assert.func(callback);

    if (_.isUndefined(conversation.intent)) {
        callback(null, 'Hey, sorry we don\'t understand what you are saying :(. Let me call an hooman for a second');
    }

    var self = this;

    switch (conversation.intent) {
        case 'nearby_location': return self._handleNearbyLocationMessage(conversation, callback);
    }

    callback({ error_code: 'UNHANDLED_ERROR', message: 'Could not handle conversation intent type' });
};

ResponseGeneratorDAO.prototype._findResponseTemplatesByIntent = function (intent, callback) {
    this.models.ReponseTemplate.find({ intent: intent }, callback);
};

ResponseGeneratorDAO.prototype._pickResponseTemplate = function (responseTemplates, conversation, callback) {
    if (_.isEmpty (responseTemplates)) {
        return callback({ error_code: 'RESPONSE_TEMPLATE_NOT_FOUND_ERROR', message: 'Could not pick response template because response template is empty' });
    }

    // Create an algorithm to pick the best response template based on personality / classification shit

    // Now just do random shit
    callback(null, responseTemplates[0].response);
};

ResponseGeneratorDAO.prototype._handleNearbyLocationMessage = function (conversation, callback) {
    if (_.isUndefined(conversation.location)) {
        return callback(null, 'Please provide your location so we can detect nearest location of the package.');
    }

    var self = this;
    async.auto({
        nearby_location: function (next) {
            // replace it with location DAO
            next(null, ['Jl. Langsat 2 No. 2, Kebayoran Baru']);
        },
        response_templates: function (next) {
            self._findResponseTemplatesByIntent(conversation.intent, next);
        },
        chosen_template: ['response_templates', function (result, next) {
            self._pickResponseTemplate(result.response_templates, conversation, next);
        }]
    }, function (err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, self._generateStringResponse(results.chosen_template, results.nearby_location));
    });
};

ResponseGeneratorDAO.prototype._generateStringResponse = function (responseTemplate, specificResponses) {
    return _.reduce(specificResponses, function (memo, specificResponse, index) {
        console.log('memo', memo);

        memo = memo.replace('%' + (index + 1), specificResponse);

        return memo;
    }, responseTemplate);
};

module.exports = ResponseGeneratorDAO;