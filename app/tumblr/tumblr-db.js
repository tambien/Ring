var db = require("../database");
var async = require('async');
/*
 * DATABASE
 */
( function() {

	/*
	* SETTERS
	*/

	//add all of the fields of a post into the appropriate database
	function put(post, memo, topLevelCallback) {
		async.parallel([
		function(postCallback) {
			//if the post exists, update it, otherwise, insert it
			exists(post, function(inThere) {
				if(inThere) {
					memo.dbUpdate++;
					updatePost(post, postCallback);
				} else {
					memo.dbPut++;
					//postCallback(null);
					insertPost(post, postCallback);
				}
			})
		}
		], topLevelCallback);

	}

	//post is an object with these fields
	function insertPost(post, callback) {
		db.connect(function(client) {
			var time = new Date(post.timestamp * 1000);
			var updateTime = new Date();
			client.query("INSERT INTO tumblr_posts (id, blog_name, note_count, text, photo, url, reblogged_from, updated, timestamp, artist) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [post.id, post.blog_name, post.note_count, post.text, post.photo, post.url, post.reblogged_from, updateTime, time, post.artist], function(err, result) {
				if(err) {
					console.log("could not add post %d %s to database: %s", post.id, post.blog_name, err);
				} else {
					callback(null);
				}
			});
		});
	}

	//post is an object with these fields
	function updatePost(post, callback) {
		db.connect(function(client) {
			var updateTime = new Date();
			client.query("UPDATE tumblr_posts SET blog_name = $2, note_count = $3, url = $4, updated = $5, reblogged_from = $6 WHERE id = $1", [post.id, post.blog_name, post.note_count, post.url, updateTime, post.reblogged_from], function(err, result) {
				if(err) {
					console.log("could not update post %d %s to database: %s", post.id, post.blog_name, err);
				} else {
					callback(null);
				}
			});
		});
	}
	
	/*
	* GETTERS
	*/

	//get a post using the id
	function get(post, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1", [post.id], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows[0]);
				}
			});
		});
	}
	
	function getArtistBetweenTime(artist, timeFrom, timeTo, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE artist = $1 AND timestamp BETWEEN $2 AND $3", [artist, timeFrom, timeTo], function(err, result) {
				if(err) {
					console.log("could not get tags in time range: %s", err);
				} else {
					callback(result.rows);
				}
			});
		});
	}


	//returns the number of items that are tagged with the tag that are in the past week
	function getArtistCount(artist, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE artist = $1", [artist], function(err, res) {
				if(err) {
					console.log("could not get the number of artists: " + err);
				} else {
					callback(res.rows.length);
				}
			});
		});
	}

	/*
	* TESTS
	*/

	//test if a post is already in the db
	//returns boolean to the callback
	function exists(post, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1", [post.id], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}



	//tests if the post has not been updated in the past two hours
	function needsUpdate(post, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1", [post.id], function(err, res) {
				if(err) {
					console.log("could not determine if tag exists: " + err);
				} else {
					if(res.rows.length > 0) {
						var updatedTime = new Date(res.rows[0].updated);
						var now = new Date();
						if((now - updatedTime) > 7200000) {
							callback(true);
						} else {
							callback(false);
						}
					} else {
						callback(true);
					}
				}
			});
		});
	}
	
	/*
	* DELETERS
	*/

	//clears the databases
	function DELETEALL() {
		db.connect(function(client) {
			client.query("DELETE FROM tumblr_posts", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_posts: " + err);
				} else {
					console.log("DELETED tumblr_posts");
				}
			});
		});
	}

	/*
	 * GETTERS
	 */
	module.exports.get = get;
	
	module.exports.getArtistBetweenTime = getArtistBetweenTime;

	module.exports.getFull = get;

	module.exports.getArtistCount = getArtistCount;

	/*
	 * SETTERS
	 */

	module.exports.put = put;

	/*
	 * TESTS
	 */
	module.exports.exists = exists;

	module.exports.needsUpdate = needsUpdate;

	/*
	 * DELETERS
	 */

	module.exports.DELETE = DELETEALL;

}());
