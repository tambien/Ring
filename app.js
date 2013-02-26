var express = require('express');
var crawler = require('./app/crawler');
var client = require('./app/client');
var artists = require('./app/artists');
var fs = require('fs');
var app = express();

/*
* BASIC SERVER
*/

// log requests
//app.use(express.logger('dev'));
var logFile = fs.createWriteStream('./log/Ring.log', {
	flags : 'a'
});
app.use(express.logger({
	stream : logFile
}));

//all client requests goes through here
app.use('/get', client.get);

//static file server
app.use(express.static(__dirname + '/public'));

//start the server
app.listen(3000, "127.0.0.1");

//and periodic crawling and tag updating
setInterval(function() {
	//retrieve the tags from the google spreadsheet
	artists.retrieve(function() {
		crawler.update(function(err) {
			if(err) {
				console.log(err);
			}
		});
	});
	//every 30 minutes
}, 30*60*1000);
//retrieve the artists from the google spreadsheet
artists.retrieve(function() {
	//and then crawl with those artists
	crawler.update(function(err) {
		if(err) {
			console.log(err);
		}
	});
});
//print a message
console.log('Listening on port 3000');
