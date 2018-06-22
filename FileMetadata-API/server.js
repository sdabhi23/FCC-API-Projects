'use strict';

var express = require('express');
var cors = require('cors');

var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var app = express();

app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
     res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/hello', (req, res) => {
  res.json({greetings: "Hello, API"});
});

app.post('/api/fileanalyse',upload.single('upfile'), (req, res) => {
   res.json({
    'name' : req.file.originalname,
    'type' : req.file.mimetype,
    'size' : req.file.size
   });
});

app.use((req, res, next) => {
   res.status(404);
   res.type('txt').send('Not found');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Node.js listening ...');
});
