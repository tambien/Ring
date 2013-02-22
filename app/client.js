var tumblrDB = require("./tumblr/tumblr-db");
var async = require('async');
var tags = require('./tags');

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
						results.tumblr = removeDuplicates(results.tumblr)
						res.send(results);
					}
				})
				break;
			case "tags":
				res.send(tags.getTags());
				break;
			default:
				res.status(404).send('nope!');
		}
	}

	function removeDuplicates(array) {
		//make an array of just id's
		var ids=[];
		for (var i = 0; i < array.length; i++){
			ids[i] = array[i].id;
		}
		//now filter if an id is in the other array and not at hte same position
		array = array.filter(function(elem, pos, self) {
			return ids.indexOf(elem.id) == pos;
		})
		return array;
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
					async.each(posts, function(post, postGetCallback) {
						getFullPost(post, results, postGetCallback);
					}, function(err, retPosts) {
						//results.tumblr = results.tumblr.concat(retPosts);
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

	function getFullPost(post, results, callback) {
		tumblrDB.getFull(post, function(retPost) {
			results.tumblr.push(retPost)
			getTumblrReblogs(retPost, results, function() {
				callback(null);
			})
		});
	}

	function getTumblrReblogs(post, results, topLevelCallback) {
		async.each(post.reblogs, function(reblog, postGetCallback) {
			var newPost = {
				id : reblog.reblog_id
			}
			getFullPost(newPost, results, postGetCallback);
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
