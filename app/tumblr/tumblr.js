var db = require("./tumblr-db");
var fetch = require("./tumblr-fetch");
var async = require("async");

/*
 * TUMBLR
 *
 *	mediation layer between the requests and tumblr.com and the database
 * 	updates the database
 */

( function() {

	//searched a set of tags
	//makes a new Tumbl for each of the results
	//syncs the Tumbl
	function searchTags(hashtags, topLevelCallback) {
		//reset the results
		var results = {
			dbUpdate : 0,
			dbPut : 0,
			dbGet : 0,
			tumblrGet : 0,
			startTime : new Date(),
			timeElapsed : 0,
		};

		async.each(hashtags, function(hashtag, callback) {
			fetch.getTaggedPosts(hashtag, function(taggedPosts) {
				//increment the fetch counter
				results.tumblrGet++;
				async.each(taggedPosts, function(post, callback) {
					updatePost(post, results, callback);
				}, function(err) {
					if(err) {
						console.log(err)
					} else {
						callback(null);
					}
				})
			});
		}, function(err) {
			if(err) {
				console.log(err);
			} else {
				results.timeElapsed = new Date() - results.startTime;
				topLevelCallback(results);
			}
		});
	}

	/*
	 * SYNCHRONIZE DATA BETWEEN TUMBLR SERVERS AND LOCAL DB
	 */

	function updatePost(post, memo, callback) {
		//check if the post is already in the database
		db.exists(post, function(exists) {
			if(exists) {
				memo.dbGet++;
				getFromDB(post, memo, callback);
			} else {
				getFromTumblr(post, memo, callback);
			}
		});
	}

	//gets the post from the db, tests if it needs updating
	function getFromDB(post, memo, callback) {
		callback();
	}

	//fetches a post from tumblr.com
	function getFromTumblr(post, memo, callback) {
		fetch.get(post, function(retPost) {
			//now put hte post in our DB
			memo.tumblrGet++;
			db.put(retPost, function() {
				memo.dbPut++;
				//console.log('post added: %d %s', retPost.id, retPost.blog_name);
				updateReblogs(retPost, memo, callback);
			});
		});
	}

	function updateReblogs(post, memo, topLevelCallback) {
		if(post.reblogs.length > 0 && !post.reblogged_from) {
			async.each(post.reblogs, function(reblog, callback) {
				updatePost(reblog, memo, callback);
			}, function(err) {
				if(err) {
					console.log(err)
				} else {
					topLevelCallback();
				}
			});
		} else {
			topLevelCallback();
		}
	}

	/*
	 *  PUBLIC API
	 */
	module.exports.searchTags = searchTags;

	//module.exports.updateTags = updateTags;
}());
