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
					posts : [],
				};
				var artist = artists.getArtist(query.artist);
				getArtistPastWeek(artist, results, function(err) {
					if(err) {
						console.log(err)
					} else {
						res.send(results);
					}
				})
				break;
			case "cache":
				//shorten the cache to just 14 artists
				var shortCache = {
					lastUpdate : cache.lastUpdate,
					posts : cache.posts.slice(0, 14),
				};
				res.send(shortCache);
				break;
			case "cacheFull":
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
			case "artistsFull":
				res.send(artists.getArtists());
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
		posts : [],
	};

	//put everything in the tmpCache until it's all completed
	var tmpCache = {
		lastUpdate : 0,
		posts : [],
	};

	function cachePastWeek(topLevelCallback) {
		var topArtists = artists.getTopArtists();
		async.each(topArtists, function(artist, callback) {
			getArtistPastWeek(artist, tmpCache, callback);
		}, function() {
			tmpCache.lastUpdate = new Date();
			//remove the orphans from the tumblr list
			for(var i = 0; i < tmpCache.posts.length; i++) {
				var artistPosts = tmpCache.posts[i];
				artistPosts.tumblr = removeOrphans(artistPosts.tumblr);
			}
			cache = tmpCache;
			//empty the tmp cache
			tmpCache = {
				lastUpdate : 0,
				posts : [],
			};
			topLevelCallback();
		})
	}

	function getArtistPastWeek(artist, results, topLevelCallback) {
		//else retrieve it from the database
		var artistPosts = {
			artist : artist,
			tumblr : [],
			twitter : [],
		}
		var timeTo = new Date();
		var timeFrom = new Date(timeTo.getFullYear(), timeTo.getMonth(), parseInt(timeTo.getDate()) - 4);
		async.parallel([
		function(tumblrGetCallback) {
			tumblrDB.getArtistBetweenTime(artist.name, timeFrom, timeTo, function(posts) {
				artistPosts.tumblr = artistPosts.tumblr.concat(posts);
				tumblrGetCallback(null);
			});
		},

		function(twitterGetCallback) {
			twitterDB.getArtistBetweenTime(artist.name, timeFrom, timeTo, function(tweets) {
				artistPosts.twitter = artistPosts.twitter.concat(tweets);
				twitterGetCallback(null);
			});
		}], function() {
			results.posts.push(artistPosts);
			topLevelCallback(null)
		})
	}

	//remove all of the nodes whose origin node is not in the set
	function removeOrphans(tumblrList) {
		var ids = [];
		//make a list of the ids
		for(var i = 0; i < tumblrList.length; i++) {
			ids.push(tumblrList[i].id);
		}
		//go through and add reblogs whose origin is in the list
		var ret = [];
		for(var i = 0; i < tumblrList.length; i++) {
			var post = tumblrList[i];
			if(post.reblogged_from !== null) {
				//if it's parent is in the list
				var index = ids.indexOf(post.reblogged_from);
				if(index >= 0) {
					ret.push(post);
				}
			} else {
				ret.push(post);
			}
		}
		return ret;
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
