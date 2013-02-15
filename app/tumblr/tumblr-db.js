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
	function put(post, callback) {
		async.parallel([
		function(callback) {
			//add the post
			insertPost(post, callback);
		},

		function(callback) {
			//register the reblogs
			if(post.reblogged_from) {
				insertReblog(post, callback);
			} else {
				callback();
			}
		},

		function(callback) {
			async.each(post.tags, function(tag, callback) {
				insertTagIfDoesNotExist(tag, post.id, post.blog_name, post.timestamp, callback);
			}, callback);
		}], callback);

	}

	//post is an object with these fields
	function insertPost(post, callback) {
		db.connect(function(client) {
			var updateTime = new Date();
			client.query("INSERT INTO tumblr_posts (id, blog_name, note_count, text, photos, updated, url) VALUES ($1, $2, $3, $4, $5, $6, $7)", [post.id, post.blog_name, post.note_count, post.text, post.photo, updateTime, post.url], function(err, result) {
				if(err) {
					console.log("could not add post %d %s to database: %s", post.id, post.blog_name, err);
				} else {
					callback();
				}
			});
		});
	}

	//add all of the reblog connections
	function insertReblog(post, callback) {
		db.connect(function(client) {
			client.query("INSERT INTO tumblr_reblogs (id, blog_name, reblog_id, reblog_name) VALUES ($1, $2, $3, $4)", [post.reblogged_from.id, post.reblogged_from.blog_name, post.id, post.blog_name], function(err, result) {
				if(err) {
					console.log("could not add reblog to database: " + err);
				} else {
					callback();
				}
			});
		});
	}

	//tagExists combined with insertTag
	function insertTagIfDoesNotExist(hashtag, id, blog_name, timestamp, callback) {
		tagExists(hashtag, id, blog_name, function(exists) {
			if(!exists) {
				insertTag(hashtag, id, blog_name, timestamp, callback);
			}
		});
	}

	//adds a tag to the database
	function insertTag(hashtag, id, blog_name, timestamp, callback) {
		var time = new Date(timestamp * 1000);
		db.connect(function(client) {
			client.query("INSERT INTO tumblr_tags (tag, id, blog_name, timestamp) VALUES ($1, $2, $3, $4)", [hashtag, id, blog_name, time], function(err, result) {
				if(err) {
					console.log("could not add tag %s to database :%s", hashtag, err);
				} else {
					callback();
				}
			});
		});
	}

	/*
	* GETTERS
	*/

	//get a post using the id and blog_name
	function get(post, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_posts WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows[0]);
				}
			});
		});
	}

	//gets all the parameters of the post and puts it together correctly
	function getFull(post, topLevelCallback) {
		//gets the post and all the attributes
		async.parallel([
		//get the post fields
		function(getPostCallback) {
			get(post, function(retPost) {
				//add the fields to the original post
				post.note_count = retPost.note_count;
				post.timestamp = retPost.timestamp;
				post.text = retPost.text;
				post.photo = retPost.photos;
				post.url = retPost.url;
				getPostCallback(null);
			});
		},

		//get the tags
		function(getTagsCallback) {
			getTags(post, function(tagsPost) {
				getTagsCallback(null);
			});
		},

		//get the reblogs
		function(getReblogsCallback) {
			getReblogs(post, function(reblogsPost) {
				getReblogsCallback(null);
			});
		}

		//callback function
		], function(err) {
			if(err) {
				console.log(err);
			} else {
				topLevelCallback(post);
			}
		});
	}

	function getTagBetweenTime(tag, timeFrom, timeTo, callback) {
		db.connect(function(client) {
			client.query("SELECT id, blog_name FROM tumblr_tags WHERE tag = $1 AND timestamp BETWEEN $2 AND $3", [tag, timeFrom, timeTo], function(err, result) {
				if(err) {
					console.log("could not get tags in time range: %s", err);
				} else {
					callback(result.rows);
				}
			});
		});
	}

	//get all the reblogs for a post
	function getReblogs(post, callback) {
		db.connect(function(client) {
			client.query("SELECT reblog_id, reblog_name FROM tumblr_reblogs WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not get reposts: " + err);
				} else {
					//wrap the callback in a post object
					post.reblogs = res.rows;
					callback(post);
				}
			});
		});
	}

	//get all the tags for a post
	function getTags(post, callback) {
		db.connect(function(client) {
			client.query("SELECT tag, timestamp FROM tumblr_tags WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not get tag: " + err);
				} else {
					//put it into a single array
					var rows = res.rows;
					var tags = [];
					for(var i = 0; i < rows.length; i++) {
						tags.push(rows[i].tag);
					}
					post.tags = tags;
					post.timestamp = rows[0].timestamp;
					callback(post);
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
			client.query("SELECT * FROM tumblr_posts WHERE id = $1 AND blog_name = $2", [post.id, post.blog_name], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}

	//tests if a tag is already in teh database
	function tagExists(tag, id, blog_name, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_tags WHERE id = $1 AND tag = $2 AND blog_name = $3", [id, tag, blog_name], function(err, res) {
				if(err) {
					console.log("could not determine if tag exists: " + err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}

	/*
	* DELETERS
	*/

	//removes a post when the name has changed. updates info accross databases
	function deleteOldBlog(post, callback) {
		//remove post from tumblr_posts

		//find the entries to it in the reblog table and remove those
	}

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
		db.connect(function(client) {
			client.query("DELETE FROM tumblr_reblogs", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_reblogs: " + err);
				} else {
					console.log("DELETED tumblr_reblogs");
				}
			});
		});
		db.connect(function(client) {
			client.query("DELETE FROM tumblr_tags", function(err, res) {
				if(err) {
					console.log("could not delete tumblr_tags: " + err);
				} else {
					console.log("DELETED tumblr_tags");
				}
			});
		});
	}

	/*
	 * GETTERS
	 */
	module.exports.get = get;

	module.exports.getTagBetweenTime = getTagBetweenTime;

	module.exports.getReblogs = getReblogs;

	module.exports.getTags = getTags;

	module.exports.getFull = getFull;

	/*
	 * SETTERS
	 */

	module.exports.put = put;

	/*
	 * TESTS
	 */
	module.exports.exists = exists;

	/*
	 * DELETERS
	 */

	module.exports.DELETE = DELETEALL;

}());
