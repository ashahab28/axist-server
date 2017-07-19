'use strict';

var assert = require('assert-plus');

function UserDAO (mongoConnection) {
    assert.object(mongoConnection);

    this.mongoConnection = mongoConnection;
    this.models = {
        User: this.mongoConnection.model('User', require('./models/user'))
    };
}

UserDAO.prototype.createUser = function (userData, callback) {
    assert.object(userData);
    assert.string(userData.username);
    assert.string(userData.password);
    assert.string(userData.email);
    assert.func(callback);

    this.models.User.create(userData, callback);
};

UserDAO.prototype.findUserByUsername = function (username, callback) {
    assert.string(username);
    assert.func(callback);

    this.models.User.findOne({ username: username }, callback);
};

module.exports = UserDAO;