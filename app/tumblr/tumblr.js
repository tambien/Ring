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
				console.log("%d tumblr requests, %d db insertions, %d db updates, in %d milliseconds", results.tumblrGet, results.dbPut, results.dbUpdate, results.timeElapsed);
				topLevelCallback(null);
			}
		});
	}

	//searched a set of tags
	//makes a new Tumbl for each of the results
	//syncs the Tumbl
	function searchArtists(artists, topLevelCallback) {
		//reset the results
		var results = {
			dbUpdate : 0,
			dbPut : 0,
			dbGet : 0,
			tumblrGet : 0,
			startTime : new Date(),
			timeElapsed : 0,
		};

		async.each(artists, function(artist, searchTermsCallback) {
			async.each(artist.search, function(searchTerm, searchTagCallback) {
				fetch.getTaggedPosts(searchTerm, function(taggedPosts) {
					//increment the fetch counter
					results.tumblrGet++;
					async.each(taggedPosts, function(post, callback) {
						post.artist = artist.name;
						updatePost(post, results, callback);
					}, function(err) {
						if(err) {
							console.log(err)
						} else {
							searchTagCallback(null);
						}
					})
				});
			}, function(err) {
				if(err) {
					console.log(err);
				} else {
					searchTermsCallback(null);
				}
			});
		}, function(err) {
			if(err) {
				console.log(err);
			} else {
				results.timeElapsed = new Date() - results.startTime;
				console.log("%d tumblr requests, %d db insertions, %d db updates, in %d milliseconds", results.tumblrGet, results.dbPut, results.dbUpdate, results.timeElapsed);
				topLevelCallback(null);
			}
		});
	}

	/*
	 * SYNCHRONIZE DATA BETWEEN TUMBLR SERVERS AND LOCAL DB
	 */

	function updatePost(post, memo, callback) {
		db.needsUpdate(post, function(update) {
			if(update) {
				getFromTumblr(post, memo, callback);
			} else {
				callback(null);
			}
		});
	}

	//gets a post from tumblr and puts it in the db
	function getFromTumblr(post, memo, topLevelCallback) {
		fetch.get(post, function(retPost) {
			memo.tumblrGet++;
			//if it's older than 1 month, it does not need to be updated
			var postTime = new Date(retPost.timestamp * 1000);
			var now = new Date();
			var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
			//also if the post has no photo AND no text, don't put it in
			var nothing = (post.photo === '') && (post.text === '');
			//now put hte post in our DB
			if(postTime > lastMonth && !nothing) {
				//make sure the artist gets added to the db
				async.parallel([
				function(putDBCallback) {
					db.put(retPost, memo, function() {
						putDBCallback(null);
					});
				},

				function(updateReblogsCallback) {
					//console.log('post added: %d %s', retPost.id, retPost.blog_name);
					updateReblogs(retPost, memo, updateReblogsCallback);
				}], function(err) {
					if(!err) {
						topLevelCallback(null);
					}
				});
			} else {
				topLevelCallback(null);
			}
		});
	}

	function updateReblogs(post, memo, topLevelCallback) {
		if(post.reblogs.length > 0 && !post.reblogged_from) {
			//if(post.reblogs.length > 0) {
			async.each(post.reblogs, function(reblog, callback) {
				reblog.artist = post.artist;
				updatePost(reblog, memo, callback);
			}, function(err) {
				if(err) {
					console.log(err)
				} else {
					topLevelCallback(null);
				}
			});
		} else {
			topLevelCallback(null);
		}
	}

	/*
	 *  PUBLIC API
	 */
	module.exports.searchArtists = searchArtists;

	//module.exports.updateTags = updateTags;
}());
