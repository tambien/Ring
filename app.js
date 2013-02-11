var express = require('express');
var db = require('./node_modules/database');
var crawler = require('./node_modules/crawler');
var app = express();

/* 
 * BASIC SERVER
 */

// log requests
app.use(express.logger('dev'));

//data base query
//app.use('/db', db.getPost);

//static file server
app.use(express.static(__dirname + '/public'));

//start the server
app.listen(3000, "127.0.0.1");

//periodic crawling
//setInterval(crawler.update, 60000);
crawler.update();

//print a message
console.log('Listening on port 3000');
