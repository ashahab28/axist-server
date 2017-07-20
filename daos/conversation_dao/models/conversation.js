'use strict';

var mongoose = require('mongoose');

var ConversationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    message: { type: String, required: true },
    context: { type: String },
    intent: { type: Number }
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

module.exports = ConversationSchema;
