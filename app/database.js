var keys = require("./keys");
var pg = require('pg');

/*
 * DATABASE
 */
( function() {

	var tumblrPostsConnectionString = "pg://Yotam@localhost:5432/Ring";

	//adds a tag to the database
	function addTag(hashtag, id, timestamp) {
		pg.connect(tumblrPostsConnectionString, function(err, client) {
			if(err) {
				console.log(err)
			} else {
				client.query("INSERT INTO tumblr_tags (tag, id, timestamp) VALUES ($1, $2, $3)", [hashtag, id, timestamp], function(err, result){
					if (err.code!=='23505'){
						console.log(err);
					} else {
						console.log("duplicate join attempted");
					}
				});
			}
		});
	}

	/*
	 * PUBLIC API
	 */
	module.exports.addTag = function(hashtag, id, timestamp) {
		addTag(hashtag, id, timestamp);
	}

	module.exports.addPost = function(post) {

	}
}());
