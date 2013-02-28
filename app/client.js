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
			case "week":
				var results = {
					tumblr : [],
					twitter : []
				};
				getArtistPastWeek(query.artist, results, function(err) {
					if(err) {
						console.log(err)
					} else {
						res.send(results);
					}
				})
				break;
			case "cache":
				res.send(cache);
				break;
			case "twitter":
				res.send(cache.twitter);
				break;
			case "tumblr":
				res.send(cache.tumblr);
				break;
			case "artists":
				res.send(artists.getArtistNames());
				break;
			case "top":
				res.send(artists.getTopArtists());
				break;
			default:
				res.status(404).send('nope!');
		}
	}

	/*
	 * CACHE
	 *
	 * cache the searches for tumblr and twitter so they won't be done on every connection
	 */

	var cache = {
		lastUpdate : 0,
		tumblr : [],
		twitter : []
	};

	//put everything in the tmpCache until it's all completed
	var tmpCache = {
		lastUpdate : 0,
		tumblr : [],
		twitter : []
	};

	function cachePastWeek(topLevelCallback) {
		var topArtists = artists.getTopArtists();
		async.each(topArtists, function(artist, callback) {
			getArtistPastWeek(artist.name, tmpCache, callback);
		}, function() {
			tmpCache.lastUpdate = new Date();
			cache = tmpCache;
			//empty the tmp cache
			tmpCache = {
				lastUpdate : 0,
				tumblr : [],
				twitter : []
			};
			topLevelCallback();
		})
	}

	function getArtistPastWeek(artist, results, topLevelCallback) {
		var timeTo = new Date();
		var timeFrom = new Date(timeTo.getFullYear(), timeTo.getMonth(), parseInt(timeTo.getDate()) - 7);
		async.parallel([
		function(tumblrGetCallback) {
			tumblrDB.getArtistBetweenTime(artist, timeFrom, timeTo, function(posts) {
				results.tumblr = results.tumblr.concat(posts);
				tumblrGetCallback(null);
			});
		},

		function(twitterGetCallback) {
			twitterDB.getArtistBetweenTime(artist, timeFrom, timeTo, function(tweets) {
				results.twitter = results.twitter.concat(tweets);
				twitterGetCallback(null);
			});
		}], function() {
			topLevelCallback(null)
		})
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

	module.exports.cachePastWeek = cachePastWeek;
}());
