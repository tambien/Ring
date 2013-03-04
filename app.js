var express = require('express');
var async = require('async')
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

//on startup
//update the artist list from the spreadsheet
async.series([
function(getArtistList) {
	artists.retrieve(function() {
		console.log("got the artists from the spreadsheet");
		getArtistList();
	});
},

//update the cache
function(getCache) {
	client.cachePastWeek(function() {
		console.log('cached past week');
		getCache();
	})
},

//do an initial crawl
function(crawlInitially) {
	crawler.update(function(err) {
		console.log('crawl completed');
		crawlInitially();
		if(err) {
			console.log(err);
		}
	});
}], function() {
	console.log("finished initial retrieval and crawl");
});
//updating the database every 60 minutes
setInterval(function() {
	crawler.update(function(err) {
		console.log('crawl completed')
		if(err) {
			console.log(err);
		}
	});
	//every 60 minutes
}, 60 * 60 * 1000);
//update the list from the spreadsheet every 2 hours
setInterval(function() {
	artists.retrieve(function() {
		console.log("got the artists from the spreadsheet");
	});
	//every 12 hours
}, 12 * 60 * 60 * 1000);
//update the cache every 60 minutes
setInterval(function() {
	client.cachePastWeek(function() {
		console.log('cached past week');
	})
}, 60 * 60 * 1000);
//print a message
console.log('RING Started');
