var express = require('express');
var crawler = require('./app/crawler');
var db = require('./app/database');
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

//database query
db.getTagBetweenTime(["sxsw"], new Date(2012, 6, 1), new Date(), function(results){
	//console.log(results.elapsedTime);
	console.log(results);
})

//print a message
console.log('Listening on port 3000');
