var keys = require("./keys");
var pg = require('pg');
 /*
 * DATABASE
 */
( function() {

	var dbConnectionString = 

	/*
	* TUMBLR DATABASE STUFF
	*
	* tumblr posts look like this
	*
	* {
	* 	id,
	* 	blog_name,
	* 	note_count,
	* 	reblogs : [], //array of ids
	* 	tags : [], //combination of featured_tags and tags
	* 	timestamp: unix time,
	*	text,
	* 	photos: json if it exists
	* }
	*/

	//test if a post is already in the db
	//returns boolean to the callback
	function tumblrPostExists(id, callback) {
		pg.connect(dbConnectionString, function(err, client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1", [id], function(err, res) {
				if(err) {
					console.log(err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}

	//add all of the fields of a post into the appropriate database
	function tumblrAdd(post) {
		//test that the post doesn't exist
		tumblrPostExists(post.id, function(exists) {
			if(!exists) {
				//add the post
				tumblrAddPost(post);
				//register the reblogs
				for(var i = 0; i < post.reblogs.length; i++) {
					tumblrAddReblog(post.id, post.reblogs[i]);
				}
				//and the tags
				for(var i = 0; i < post.tags.length; i++) {
					tumblrAddTag(post.tags[i], post.id, post.timestamp);
				}
			}
		});
	}

	//post is an object with these fields
	function tumblrAddPost(post) {
		pg.connect(dbConnectionString, function(err, client) {
			if(err) {
				console.log(err);
			} else {
				var updateTime = Math.round((new Date()).getTime() / 1000);
				client.query("INSERT INTO tumblr_posts (id, data, updated) VALUES ($1, $2, $3)", [post.id, post, updateTime], function(err, result) {
					if(err) {
						console.log(err);
					}
				});
			}
		});
	}

	//add all of the reblog connections
	function tumblrAddReblog(post_id, reblog_id) {
		pg.connect(dbConnectionString, function(err, client) {
			if(err) {
				console.log(err)
			} else {
				client.query("INSERT INTO tumblr_reblogs (id, reblog_id) VALUES ($1, $2, $3)", [post_id, reblog_id], function(err, result) {
					if(err) {
						console.log(err);
					}
				});
			}
		});
	}

	//adds a tag to the database
	function tumblrAddTag(hashtag, id, timestamp) {
		pg.connect(dbConnectionString, function(err, client) {
			if(err) {
				console.log(err)
			} else {
				client.query("INSERT INTO tumblr_tags (tag, id, timestamp) VALUES ($1, $2, $3)", [hashtag, id, timestamp], function(err, result) {
					if(err) {
						console.log(err);
					}
				});
			}
		});
	}

	/*
	 * PUBLIC API
	 */
	module.exports.addTumblr = function(post) {
		tumblrAdd(post);
	}

	module.exports.tumblrPostExists = function(id, callback) {
		tumblrPostExists(id, callback);
	}
}());
