var tumblrDB = require("./tumblr/tumblr-db");
var async = require('async');
var state = require('./state');

/*
 * THIS IS THE DATABASE MANAGER THAT TALKS TO THE CLIENT
 *
 * combines requests from tumblr and twitter and returns the correctly formatted objects
 *
 * query results are in the form:
 * {
 * 	tumblr: [{
 * 		post0: {
 * 			id,
 * 			blog_name,
 * 			reblogs : [{id, blog_name},....],
 * 			text,
 * 			tags
 * 	    }
 * 	}]
 * }
 */

( function() {

	/*
	 * GET STARTING POINT
	 */

	function get(req, res) {
		var query = req.query;
		switch(query.type) {
			case "range":
				getTagBetweenTime(query.tags, query.start, query.end, function(err, results) {
					if(err) {
						console.log(err)
					} else {
						//should remove all duplicate posts first
						res.send(results);
					}
				})
				break;
			case "tags":
				res.send(state.tags);
				break;
			default:
				res.status(404).send('nope!');
		}
	}

	/*
	* QUERY FUNCTIONS
	*/

	//returns all posts
	function getTagBetweenTime(tags, timeFrom, timeTo, topLevelCallback) {
		var startTime = new Date();
		var results = {
			elapsedTime : 0,
			tumblr : [],
		}
		async.parallel([
		function(tumblrCallback) {
			//for each of the tags
			async.each(tags, function(tag, getTagsCallback) {
				//make a request to the database for that tag
				tumblrDB.getTagBetweenTime(tag, timeFrom, timeTo, function(posts) {
					async.map(posts, function(post, postGetCallback) {
						tumblrDB.getFull(post, function(retPost) {
							getTumblrReblogs(retPost, results, function() {
								postGetCallback(null, retPost);
							})
						});
						//also needs all of the reblogs
					}, function(err, retPosts) {
						results.tumblr = results.tumblr.concat(retPosts);
						getTagsCallback(null);
					})
				});
			}, function(err) {
				if(err) {
					console.log(err)
				} else {
					tumblrCallback(null);
				}
			})
		}], function(err) {
			if(err) {
				topLevelCallback(err);
			} else {
				results.elapsedTime = new Date() - startTime;
				topLevelCallback(null, results)
			}
		});
	}

	function getTumblrReblogs(post, results, topLevelCallback) {
		async.each(post.reblogs, function(reblog, postGetCallback) {
			var post = {
				id : reblog.reblog_id
			}
			tumblrDB.getFull(post, function(retPost) {
				results.tumblr.push(retPost);
				postGetCallback(null);
			});
		}, function(err) {
			//results.tumblr = results.tumblr.concat(retPosts);
			topLevelCallback(null);
		})
	}

	/*
	* PUBLIC API
	*/

	//module.exports.getTagBetweenTime = getTagBetweenTime;
	module.exports.get = get;
}());
