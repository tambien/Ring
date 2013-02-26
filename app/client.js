var tumblrDB = require("./tumblr/tumblr-db");
var twitterDB = require("./twitter/twitter-db");
var async = require('async');
var artists = require('./artists');

/*
 * THIS IS THE DATABASE MANAGER THAT TALKS TO THE CLIENT
 *
 * combines requests from tumblr and twitter and returns the correctly formatted objects
 *
 */

( function() {

	/*
	 * GET STARTING POINT
	 */

	function get(req, res) {
		var query = req.query;
		switch(query.type) {
			case "range":
				getArtistOnDate(query.artist, query.y, query.m, query.d, function(err, results) {
					if(err) {
						console.log(err)
					} else {
						res.send(results);
					}
				})
				break;
			case "artists":
				res.send(artists.getArtists());
				break;
			case "handles":
				res.send(artists.getHandles());
				break;
			default:
				res.status(404).send('nope!');
		}
	}

	/*
	* QUERY FUNCTIONS
	*/

	//returns all posts
	function getArtistOnDate(artist, year, month, date, topLevelCallback) {
		var startTime = new Date();
		var results = {
			elapsedTime : 0,
			tumblr : [],
			twitter : [],
		}
		var timeFrom = new Date(year, month, date);
		var timeTo = new Date(year, month, parseInt(date) + 1);
		async.parallel([
		function(tumblrGetCallback) {
			tumblrDB.getArtistBetweenTime(artist, timeFrom, timeTo, function(posts) {
				results.elapsedTime = new Date() - startTime;
				results.tumblr = posts;
				tumblrGetCallback(null);
			});
		},

		function(twitterGetCallback) {
			twitterDB.getArtistBetweenTime(artist, timeFrom, timeTo, function(tweets) {
				results.elapsedTime = new Date() - startTime;
				results.twitter = tweets;
				twitterGetCallback(null);
			});
		}], function() {
			topLevelCallback(null, results)
		})
	}

	function getFullPost(post, results, callback) {
		tumblrDB.get(post, function(retPost) {
			results.tumblr.push(retPost)
			callback(null);
		});
	}

	/*
	* PUBLIC API
	*/

	//module.exports.getTagBetweenTime = getTagBetweenTime;
	module.exports.get = get;
}());
