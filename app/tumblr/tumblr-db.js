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
	function put(post, topLevelCallback) {
		async.parallel([
		function(postCallback) {
			//if the post exists, update it, otherwise, insert it
			exists(post, function(inThere) {
				if(inThere) {
					updatePost(post, postCallback);
				} else {
					//postCallback(null);
					insertPost(post, postCallback);
				}
			})
		},

		function(reblogCallback) {
			//register the reblogs
			if(post.reblogged_from) {
				insertReblogIfDoesNotExist(post, reblogCallback);
			} else {
				reblogCallback(null);
			}
		},

		function(tagCallback) {
			async.each(post.tags, function(tag, callback) {
				insertTagIfDoesNotExist(tag, post, callback);
			}, tagCallback);
		}], topLevelCallback);

	}

	//post is an object with these fields
	function insertPost(post, callback) {
		db.connect(function(client) {
			var updateTime = new Date();
			client.query("INSERT INTO tumblr_posts (id, blog_name, note_count, text, photo, url, updated) VALUES ($1, $2, $3, $4, $5, $6, $7)", [post.id, post.blog_name, post.note_count, post.text, post.photo, post.url, updateTime], function(err, result) {
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
			client.query("UPDATE tumblr_posts SET blog_name = $2, note_count = $3, url = $4, updated = $5 WHERE id = $1", [post.id, post.blog_name, post.note_count, post.url, updateTime], function(err, result) {
				if(err) {
					console.log("could not update post %d %s to database: %s", post.id, post.blog_name, err);
				} else {
					callback(null);
				}
			});
		});
	}

	//reblogExists combined with insertReblog
	function insertReblogIfDoesNotExist(post, callback) {
		reblogExists(post, function(exists) {
			if(!exists) {
				insertReblog(post, callback);
			} else {
				callback(null);
			}
		});
	}

	//add all of the reblog connections
	function insertReblog(post, callback) {
		db.connect(function(client) {
			client.query("INSERT INTO tumblr_reblogs (id, reblog_id) VALUES ($1, $2)", [post.reblogged_from.id, post.id], function(err, result) {
				if(err) {
					console.log("could not add reblog to database: " + err);
				} else {
					callback(null);
				}
			});
		});
	}

	//tagExists combined with insertTag
	function insertTagIfDoesNotExist(hashtag, post, callback) {
		tagExists(hashtag, post.id, function(exists) {
			if(!exists) {
				insertTag(hashtag, post, callback);
			} else {
				callback(null);
			}
		});
	}

	//adds a tag to the database
	function insertTag(hashtag, post, callback) {
		var time = new Date(post.timestamp * 1000);
		db.connect(function(client) {
			client.query("INSERT INTO tumblr_tags (tag, id, timestamp) VALUES ($1, $2, $3)", [hashtag, post.id, time], function(err, result) {
				if(err) {
					console.log("could not add tag %s to database :%s", hashtag, err);
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
				post.photo = retPost.photo;
				post.url = retPost.url;
				post.updated = retPost.updated;
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
			client.query("SELECT id FROM tumblr_tags WHERE tag = $1 AND timestamp BETWEEN $2 AND $3", [tag, timeFrom, timeTo], function(err, result) {
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
			client.query("SELECT reblog_id FROM tumblr_reblogs WHERE id = $1", [post.id], function(err, res) {
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
			client.query("SELECT tag, timestamp FROM tumblr_tags WHERE id = $1", [post.id], function(err, res) {
				if(err) {
					console.log("could not get tag: " + err);
				} else {
					//put it into a single array
					var rows = res.rows;
					if(rows.length > 0) {
						var tags = [];
						for(var i = 0; i < rows.length; i++) {
							tags.push(rows[i].tag);
						}
						post.tags = tags;
						post.timestamp = rows[0].timestamp;
					} else {
						post.tags = [];
					}
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
			client.query("SELECT * FROM tumblr_posts WHERE id = $1", [post.id], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}

	//tests if a tag is already in teh database
	function tagExists(tag, id, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_tags WHERE id = $1 AND tag = $2", [id, tag], function(err, res) {
				if(err) {
					console.log("could not determine if tag exists: " + err);
				} else {
					callback(res.rows.length > 0);
				}
			});
		});
	}

	function reblogExists(post, callback) {
		db.connect(function(client) {
			client.query("SELECT * FROM tumblr_reblogs WHERE id = $1 AND reblog_id = $2", [post.reblogged_from.id, post.id], function(err, res) {
				if(err) {
					console.log("could not determine if a reblog exists: " + err);
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
