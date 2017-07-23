'use strict';

switch (process.env.NODE_ENV) {
    case 'production': module.exports = 'mongodb://139.59.233.76:27017/axist-database'; break;
    default: module.exports = 'mongodb://localhost:27017/axist-database';
}
