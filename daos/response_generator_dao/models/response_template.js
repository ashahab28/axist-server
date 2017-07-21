'use strict';

var mongoose = require('mongoose');

var ResponseStorageSchema = new mongoose.Schema({
    intent: { type: String, required: true },
    response: { type: String, required: true }
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

module.exports = ResponseStorageSchema;
