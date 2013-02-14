var express = require('express');
var crawler = require('./app/crawler');
var client = require('./app/client');
var app = express();

/* 
 * BASIC SERVER
 */

// log requests
app.use(express.logger('dev'));

//all client requests goes through here
app.use('/get', client.get);

//static file server
app.use(express.static(__dirname + '/public'));

//start the server
app.listen(3000, "127.0.0.1");

//periodic crawling
//setInterval(crawler.update, 60000);
crawler.update(function(err){
	if (err){
		console.log(err);
	}
});

//print a message
console.log('Listening on port 3000');
