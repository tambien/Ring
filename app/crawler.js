var db = require("database");
var tumblr = require("tumblr");

/*
 * CRAWLER
 *
 * crawls the twitter and tumblr Posts
 */
( function() {

	/*
	 * TUMBLR CRAWL
	 */

	var tumblrTags = ["sxsw"];

	//the starting point for a crawl
	function tumblrCrawl() {
		tumblrSearchTags();
	}

	function tumblrSearchTags() {
		//searches the posts with specific hashtags
		for(var i = 0; i < tumblrTags.length; i++) {
			var tag = tumblrTags[i];
			tumblr.searchTag(tag, function(response) {
				for(var i = 0; i < response.length; i++) {
					//add that post's tag
					var post = response[i];
					
					//and get the post in the db as well
					
					tumblr.getPost(post.blog_name, post.id, function(response) {
						var post = response.posts[0];
						//combine the tags and featured tags into a single list
						var tags = response.posts[0].tags.concat(response.posts[0].featured_in_tag);
						var tags = tags.getUnique();
						//make it all lowercase and add it to the database
						for(var j = 0; j < tags.length; j++) {
							var tag = tags[j].toLowerCase();
							db.addTag(tag, post.id, post.timestamp);
						}
					});
				}
			});
		}
	}

	/*
	* TWITTER CRAWL
	*/

	//the starting point for a crawl
	function twitterCrawl() {

	}

	/*
	 * CRAWLER'S PUBLIC API
	 */
	module.exports.update = function() {
		tumblrCrawl();
		twitterCrawl();
		console.log("updating");
	}
}());

Array.prototype.getUnique = function() {
	var u = {}, a = [];
	for(var i = 0, l = this.length; i < l; ++i) {
		if(u.hasOwnProperty(this[i])) {
			continue;
		}
		a.push(this[i]);
		u[this[i]] = 1;
	}
	return a;
}