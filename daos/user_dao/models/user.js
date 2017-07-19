'use strict';

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: { type: String, require: true },
    password: { type: String, required: true },
    email: { type: String, required: true }
}, {
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    },
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id.toString();

            delete ret._id;
            delete ret.__v;

            return ret;
        }
    }
});

UserSchema.index({ username: 1 }, { unique: true });

module.exports = UserSchema;
