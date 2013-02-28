var database = require('../database');

/*
 * TWITTER DATABASE
 */
( function() {

	/*
	* SETTERS
	*/

	//insert an item into the db
	function put(tweet, callback) {
		exists(tweet, function(inThere) {
			if(inThere) {
				update(tweet, function(){
					callback("update");
				});
			} else {
				insert(tweet, function(){
					callback("insert");
				});
			}
		});
	}

	function insert(tweet, callback) {
		database.connect(function(client) {
			client.query("INSERT INTO tweets (id, text, note_count, timestamp, artist) VALUES ($1, $2, $3, $4, $5)", [tweet.id, tweet.text, tweet.note_count, tweet.timestamp, tweet.artist], function(err, result) {
				if(err) {
					console.log("could not add tweet %d to database: %s", tweet.id, err);
				} else {
					callback(null);
				}
			});
		});
	}

	//post is an object with these fields
	function update(tweet, callback) {
		database.connect(function(client) {
			client.query("UPDATE tweets SET note_count = $1 WHERE id = $2", [tweet.note_count, tweet.id], function(err, result) {
				if(err) {
					console.log("could not update tweet %d to database: %s", tweet.id, err);
				} else {
					callback(null);
				}
			});
		});
	}
	
	/*
	 * GETTERS
	 */
	
	function getArtistBetweenTime(artist, timeFrom, timeTo, callback) {
		database.connect(function(client) {
			client.query("SELECT * FROM tweets WHERE artist = $1 AND timestamp BETWEEN $2 AND $3", [artist, timeFrom, timeTo], function(err, result) {
				if(err) {
					console.log("could not get tags in time range: %s", err);
				} else {
					callback(result.rows);
				}
			});
		});
	}
	
	function getArtistBetweenTimeCount(artist, timeFrom, timeTo, callback) {
		database.connect(function(client) {
			client.query("SELECT count(*) FROM tweets WHERE artist = $1 AND timestamp BETWEEN $2 AND $3", [artist, timeFrom, timeTo], function(err, result) {
				if(err) {
					console.log("could not get tags in time range: %s", err);
				} else {
					callback(result.rows[0].count);
				}
			});
		});
	}

	/*
	* TESTS
	*/

	//returns boolean to the callback
	function exists(tweet, callback) {
		database.connect(function(client) {
			client.query("SELECT count(*) FROM tweets WHERE id = $1", [tweet.id], function(err, res) {
				if(err) {
					console.log("could not determine if id exists: " + err);
				} else {
					callback(res.rows[0].count > 0);
				}
			});
		});
	}

	/*
	 * API
	 */
	module.exports.put = put;

	module.exports.getArtistBetweenTime = getArtistBetweenTime;
	
	module.exports.getArtistBetweenTimeCount = getArtistBetweenTimeCount;

}())