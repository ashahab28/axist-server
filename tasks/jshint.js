'use strict';

module.exports = function (grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Options
    return {
        files: ['./**/*.js', './*.js'],
        options: {
            ignores: ['node_modules/**/*.js'],
            jshintrc: '.jshintrc'
        }
    };
};
