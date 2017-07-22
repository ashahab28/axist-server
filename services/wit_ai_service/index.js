'use strict';

var _ = require('underscore');
var assert = require('assert-plus');

const {Wit} = require('node-wit');

function WitAIService (witAIConfig) {
    this.client = new Wit({ accessToken: witAIConfig });
}

WitAIService.prototype.handleIncomingMessage  = function (message, callback) {
    assert.string(message);
    assert.func(callback);

    var self = this;

    this._getWitAIResponse(message, function (err, response) {
        if (err) {
            return callback(err);
        }

        callback(null, self._formatWitAIResponse(response));
    });
};

WitAIService.prototype._getWitAIResponse = function (message, callback) {
    this.client.message(message, {})
        .then((data) => {
            callback(null, data);
        })
        .catch(callback);
};

WitAIService.prototype._formatWitAIResponse = function (jsonResponse) {
    var initialMemo = {
        message: jsonResponse._text
    };

    return _.reduce(jsonResponse.entities, function (memo, value, key) {
        memo[key] = value[0].value;

        return memo;
    }, initialMemo);
};

module.exports = WitAIService;