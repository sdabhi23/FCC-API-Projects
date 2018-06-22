'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
var urlHandler = require('./urlHandler.js');
var app = express();

var mongoURL = process.env.MONGO_URI;
var port = process.env.PORT || 3000;

mongoose.connect(mongoURL);

app.use(cors());

app.use(bodyParser.urlencoded({'extended': false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

  
app.post('/api/shorturl/new', urlHandler.addUrl);
  
app.get('/api/shorturl/:shurl', urlHandler.processShortUrl);


app.use((req, res, next) => {
  res.status(404);
  res.type('txt').send('Error 404: Not found');
});


app.listen(port, () => {
  console.log('Node.js listening ...');
});