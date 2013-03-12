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

var log = fs.createWriteStream('./log/Ring.log', {
	'flags' : 'a'
});

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
		//console.log("got the artists from the spreadsheet");
		getArtistList();
	});
},

//update the cache
function(getCache) {
	client.cachePastWeek(function() {
		log.write('cached the past week: ' + new Date() + "\n");
		getCache();
	})
},

//do an initial crawl
function(crawlInitially) {
	crawler.update(function(err) {
		log.write('crawled tumblr: ' + new Date() + "\n");
		crawlInitially();
		if(err) {
			console.log(err);
		}
	});
}], function() {
	log.write('did initial crawl: ' + new Date() + "\n");
});
//updating the database every 60 minutes
setInterval(function() {
	crawler.update(function(err) {
		log.write('crawled tumblr: ' + new Date() + "\n");
		if(err) {
			console.log(err);
		}
	});
	//every 60 minutes
}, 60 * 60 * 1000);
//update the list from the spreadsheet every 2 hours
setInterval(function() {
	artists.retrieve(function() {
		log.write('retrieved artists from spreadsheet at ' + new Date() + "\n");
		client.cachePastWeek(function() {
			log.write('cached the past week: ' + new Date() + "\n");
		})
	});
	//every 1 hour
}, 60 * 60 * 1000);
//print a message
log.write('RING Started\n');
