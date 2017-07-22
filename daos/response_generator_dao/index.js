'use strict';

var _ = require('underscore');
var assert = require('assert-plus');
var async = require('async');

function ResponseGeneratorDAO (mongoConnection) {
    assert.object(mongoConnection);

    this.mongoConnection = mongoConnection;
    this.models = {
        ResponseTemplate: this.mongoConnection.model('ResponseTemplate', require('./models/response_template'))
    };
}

ResponseGeneratorDAO.prototype.createResponseTemplate = function (responseTemplateData, callback) {
    assert.object(responseTemplateData);
    assert.string(responseTemplateData.intent);
    assert.string(responseTemplateData.response);
    assert.func(callback);

    this.models.ResponseTemplate.create(responseTemplateData, callback);
};

ResponseGeneratorDAO.prototype.generateResponse = function (conversation, context, callback) {
    assert.object(conversation);
    assert.string(conversation.message);
    assert.optionalString(conversation.intent);
    assert.string(conversation.user_id);
    assert.object(context);
    assert.optionalString(context.intent);
    assert.func(callback);

    var self = this;

    // Handle direct intention 
    switch (conversation.intent) {
        case 'nearby_location': return self._handleNearbyLocationMessage(conversation, callback);
        case 'track_package_status': return self._handleTrackPackageStatusMessage(conversation, callback);
        case 'track_package_complaint': return self._handleTrackPackageComplaintMessage(conversation, callback);
        case 'greeting_ask': 
        case 'greeting_end':
        case 'dirty_words':
        case 'check_bot': return self._handleConversationWithoutContext(conversation, callback);
    }

    // Handle last context intention
    switch (context.intent) {
        case 'nearby_location': return self._handleNearbyLocationMessage(_.defaults(conversation, { intent: context.intent }), callback);
        case 'track_package_status': return self._handleTrackPackageStatusMessage(_.defaults(conversation, { intent: context.intent }), callback);
        case 'track_package_complaint': return self._handleTrackPackageComplaintMessage(_.defaults(conversation, { intent: context.intent }), callback);
    }

    callback(null, 'Hey, sorry we don\'t understand what you are saying :(. Let me call a hooman for a second');
};

ResponseGeneratorDAO.prototype._findResponseTemplatesByIntent = function (intent, callback) {
    this.models.ResponseTemplate.find({ intent: intent }, function (err, responseTemplates) {
        if (err) {
            return callback(err);
        }

        if (_.isEmpty(responseTemplates)) {
            return callback({ error_code: 'RESPONSE_TEMPLATE_NOT_FOUND_ERROR', message: 'Could not pick response template because response template is empty' });    
        }

        callback(null, responseTemplates);
    });
};

ResponseGeneratorDAO.prototype._pickResponseTemplate = function (responseTemplates, conversation, callback) {
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

ResponseGeneratorDAO.prototype._handleTrackPackageStatusMessage = function (conversation, callback) {
    if (_.isUndefined(conversation.package_id)) {
        return callback(null, 'Please provide your package id.');
    }

    var self = this;
    async.auto({
        package: function (next) {
            // replace it with package DAO
            next(null, { id: conversation.package_id, status: 'COMPLETED' });
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

        callback(null, self._generateStringResponse(results.chosen_template, _.values(results.package)));
    });
};

ResponseGeneratorDAO.prototype._handleTrackPackageComplaintMessage = function (conversation, callback) {
    if (_.isUndefined(conversation.package_id)) {
        return callback(null, 'Please provide your package id.');
    }

    var self = this;

    async.auto({
        failure_reason: function (next) {
            // replace it with package DAO
            next(null, { id: conversation.package_id, failure_reason: 'crashed during car accidents' });
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

        callback(null, self._generateStringResponse(results.chosen_template, _.values(results.failure_reason)));
    });
};

ResponseGeneratorDAO.prototype._handleConversationWithoutContext = function (conversation, callback) {
    var self = this;

    async.auto({
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

        callback(null, self._generateStringResponse(results.chosen_template, _.values(results.failure_reason)));
    });
};

ResponseGeneratorDAO.prototype._generateStringResponse = function (responseTemplate, specificResponses) {
    return _.reduce(specificResponses, function (memo, specificResponse, index) {
        return memo.replace('%' + (index + 1), specificResponse);
    }, responseTemplate);
};

module.exports = ResponseGeneratorDAO;