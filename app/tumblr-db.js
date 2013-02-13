var key = require("./keys");
var pg = require('pg');
/*
 * DATABASE
 */
( function() {

	/*
	* MAIN METHODS
	*/

	//clears the databases
	function DELETEALL() {
		pg.connect(key.dbConnectionString, function(err, client) {
			client.query("DELETE FROM tumblr_posts", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_posts: " + err);
				} else {
					console.log("DELETED tumblr_posts");
				}
			});
		});
		pg.connect(key.dbConnectionString, function(err, client) {
			client.query("DELETE FROM tumblr_reblogs", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_reblogs: " + err);
				} else {
					console.log("DELETED tumblr_reblogs");
				}
			});
		});
		pg.connect(key.dbConnectionString, function(err, client) {
			client.query("DELETE FROM tumblr_tags", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_tags: " + err);
				} else {
					console.log("DELETED tumblr_tags");
				}
			});
		});
	}

	//test if a post is already in the db
	//returns boolean to the callback
	function exists(post, callback) {
		pg.connect(key.dbConnectionString, function(err, client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows.length > 0, post);
				}
			});
		});
	}

	//get a post using the id and blog_name
	function get(post, callback) {
		pg.connect(key.dbConnectionString, function(err, client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows);
				}
			});
		});
	}

	//add all of the fields of a post into the appropriate database
	function put(post, callback) {
		//an object to test for the callback
		var targetValue = post.reblogged_from ? 2 + post.tags.length : 1 + post.tags.length;
		var counter = {
			total : 0,
			target : targetValue,
			callback : callback,
		};
		//add the post
		insertPost(post, function() {
			counter.total++;
			if(counter.total === counter.target) {
				counter.callback(post);
			}
		});
		//register the reblogs
		if(post.reblogged_from) {
			insertReblog(post, function() {
				counter.total++;
				if(counter.total === counter.target) {
					counter.callback(post);
				}
			});
		}
		//and the tags
		for(var i = 0; i < post.tags.length; i++) {
			insertTags(post.tags[i], post.id, post.blog_name, post.timestamp, function() {
				counter.total++;
				if(counter.total === counter.target) {
					counter.callback(post);
				}
			});
		}
	}

	//post is an object with these fields
	function insertPost(post, callback) {
		pg.connect(key.dbConnectionString, function(err, client) {
			if(err) {
				console.log(err);
			} else {
				var updateTime = new Date();
				client.query("INSERT INTO tumblr_posts (id, blog_name, note_count, text, photos, updated, url) VALUES ($1, $2, $3, $4, $5, $6, $7)", [post.id, post.blog_name, post.note_count, post.text, post.photo, updateTime, post.url], function(err, result) {
					if(err) {
						console.log("could not add post to database: " + err);
					} else {
						callback();
					}
				});
			}
		});
	}

	//add all of the reblog connections
	function insertReblog(post, callback) {
		pg.connect(key.dbConnectionString, function(err, client) {
			if(err) {
				console.log(err)
			} else {
				client.query("INSERT INTO tumblr_reblogs (id, blog_name, reblog_id, reblog_name) VALUES ($1, $2, $3, $4)", [post.reblogged_from.id, post.reblogged_from.blog_name, post.id, post.blog_name], function(err, result) {
					if(err) {
						console.log("could not add reblog to database: " + err);
					} else {
						callback();
					}
				});
			}
		});
	}

	//adds a tag to the database
	function insertTags(hashtag, id, blog_name, timestamp, callback) {
		var time = new Date(timestamp * 1000);
		pg.connect(key.dbConnectionString, function(err, client) {
			if(err) {
				console.log(err)
			} else {
				client.query("INSERT INTO tumblr_tags (tag, id, blog_name, timestamp) VALUES ($1, $2, $3, $4)", [hashtag, id, blog_name, time], function(err, result) {
					if(err) {
						console.log("could not add tag to database: " + err);
						console.log(hashtag);
					} else {
						callback();
					}
				});
			}
		});
	}

	/*
	 * PUBLIC API
	 */
	module.exports.exists = exists;

	module.exports.get = get;

	module.exports.put = put;

	module.exports.DELETE = DELETEALL;

}());
