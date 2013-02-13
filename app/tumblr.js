var db = require("./tumblr-db");
var fetch = require("./tumblr-fetch");

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
	function searchTags(hashtags) {
		var counter = {
			total : 0,
			target : 10,
			callback : function(){
				console.log("done with search");
			}
		};
		//db.DELETE();
		//for each of the hashtags
		for(var i = 0; i < hashtags.length; i++) {
			//query tumblr for the tags
			fetch.getTaggedPosts(hashtags[i], function(taggedPosts) {
				//make a new Tumbl with that info
				for(var j = 0; j < taggedPosts.length; j++) {
					var post = taggedPosts[j];
					updatePost(post, function() {
						console.log("post updated");						
					})
				}
			});
		}
	}

	/*
	 * SYNCHRONIZE DATA BETWEEN TUMBLR SERVERS AND LOCAL DB
	 */

	function updatePost(post, callback) {
		//check if the post is already in the database
		db.exists(post, function(exists, retpost) {
			if(exists) {
				getFromDB(retpost, callback);
			} else {
				getFromTumblr(retpost, callback);
			}
		});
	}

	//gets the post from the db, tests if it needs updating
	function getFromDB(post, callback) {
		callback();
	}

	//fetches a post from tumblr.com
	function getFromTumblr(post, callback) {
		fetch.get(post, function(retPost) {
			//now put hte post in our DB
			db.put(retPost, function(dbPost) {
				updateReblogs(dbPost, callback);
			});
		});
	}

	function updateReblogs(post, callback) {
		//an object to test for the callback
		var counter = {
			total : 0,
			target : post.reblogs.length,
			callback : callback
		};
		if(post.reblogs.length > 0 && !post.reblogged_from) {
			for(var i = 0; i < post.reblogs.length; i++) {
				var newPost = post.reblogs[i];
				updatePost(newPost, function() {
					counter.total++;
					if(counter.total === counter.target) {
						callback();
					}
				})
			}
		} else {
			callback();
		}
	}

	function getTagFromTime(tag, timeFrom, timeTo) {

	}

	/*
	 *  PUBLIC API
	 */
	module.exports.searchTags = searchTags;

	//module.exports.updateTags = updateTags;
}());

/*
 * TUMBL
 *
 * an object representing a post
 *
 * all of the internals are abstracted so it doesn't matter if it's coming from a databse or tumblr.com
 *
 * parameters:
 * 	id,
 * 	blog_name,
 * 	note_count,
 * 	reblogs : [], //each reblog  = { id, blog_name };
 * 	tags : [], //combination of featured_tags and tags
 * 	timestamp: unix time,
 *	text,
 * 	photos: json if it exists
 * 	updated: time of last update from tumblr.com
 */
function Tumbl(id, blog_name) {
	this.id = id;
	this.blog_name = blog_name;
};

//gets all of the parameters, returns 'this' to the callback
Tumbl.prototype.sync = function(callback) {
	this._existsInDB(function(exists) {
		//if it exists, does it need an update?
		if(exists) {
			//get it from the db
			this._getFromDB(function(post) {
				//now check if it needs an update
				this._needsUpdate(function(needsUpdate) {
					if(needsUpdate) {
						this._smartUpdate(callback);
					} else {
						callback(this);
					}
				});
			})
		} else {
			//get it from tumblr.com
			this._fetch(function() {
				//put it in the database
				this._putInDB(function() {
					//get the reblogs
					this._getReblogs(function() {
						callback.bind(this)(this);
					});
				});
			});
		}
	});
}

Tumbl.prototype._getReblogs = function(callback) {
	//an object to test for the callback
	var counter = {
		total : 0,
		target : this.reblogs.length,
		callback : callback.bind(this),
	};
	if(this.reblogs.length > 0) {
		for(var i = 0; i < this.reblogs.length; i++) {
			var t = new Tumbl(this.reblogs[i].id, this.reblogs[i].blog_name);
			t.sync(function() {
				counter.total++;
				if(counter.total === counter.target) {
					counter.callback(this);
				}
			});
		}
	} else {
		callback.bind(this)(this);
	}
}
//tests if the object needs an update
Tumbl.prototype._needsUpdate = function(callback) {
	//just false for now
	callback.bind(this)(false);
}
//tests if the object exists in the database
Tumbl.prototype._existsInDB = function(callback) {
	db.exists(this.id, callback.bind(this));
}
//gets the post from teh database
Tumbl.prototype._getFromDB = function(callback) {
	//returns an object with all of the parameters
	db.get(this, function(post) {
		//fill all of the fields and calll the callback
		this.reblogs = post.reblogs;
		this.text = post.text;
		this.timestamp = post.timestamp;
		this.photo = post.photo;
		this.tags = post.tags;
		this.note_count = post.note_count;
		this._doCallback(callback);
	});
}
//fetches the object from tumblr.com and puts it in the database
Tumbl.prototype._fetch = function(callback) {
	fetch.get(this, function(post) {
		//fill all of the fields and calll the callback
		this.reblogs = post.reblogs;
		this.text = post.text;
		this.timestamp = post.timestamp;
		this.photo = post.photo;
		this.tags = post.tags;
		this.note_count = post.note_count;
		this._doCallback(callback);
	}.bind(this));
}
//syncs the necessary parameters by comparing previous reblogs to the new ones fetched
Tumbl.prototype._smartUpdate = function(callback) {
	this._doCallback(callback);
};
//pushes the object to the database
Tumbl.prototype._putInDB = function(callback) {
	db.put(this, callback.bind(this));
};
Tumbl.prototype._doCallback = function(callback) {
	if(callback) {
		callback.bind(this)();
	}
}