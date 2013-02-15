var express = require('express');
var crawler = require('./app/crawler');
var client = require('./app/client');
var fs = require('fs');
var app = express();

/*
* BASIC SERVER
*/

// log requests
//app.use(express.logger('dev'));
var logFile = fs.createWriteStream('./log/Ring.log', {flags: 'a'});
app.use(express.logger({stream: logFile}));

//all client requests goes through here
app.use('/get', client.get);

//static file server
app.use(express.static(__dirname + '/public'));

//start the server
app.listen(3000, "127.0.0.1");

//update on startup
crawler.update(function(err) {
	if(err) {
		console.log(err);
	}
});
//and periodic crawling
setInterval(function() {
	crawler.update(function(err) {
		if(err) {
			console.log(err);
		}
	});
}, 600000);
//print a message
console.log('Listening on port 3000');
