'use strict';

var express = require('express');

var app = express();

app.get('/test',
    function (req, res) {
        res.status(200).send('pre auto deploy');
    }
);

app.listen(process.env.PORT || 8080);