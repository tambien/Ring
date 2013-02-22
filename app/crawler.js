var tumblr = require("./tumblr/tumblr");
var async = require('async');
var tags = require('./tags');
/*
 * CRAWLER
 *
 * crawls the twitter and tumblr Posts
 */
( function() {

	/*
	 * TUMBLR CRAWL
	 */


	//the starting point for a crawl
	function tumblrCrawl(topLevelCallback) {
		tumblr.searchTags(tags.getTumblrTags(), function() {
			topLevelCallback(null);
		});
	}

	/*
	* TWITTER CRAWL
	*/

	//the starting point for a crawl
	function twitterCrawl(topLevelCallback) {
		topLevelCallback(null)
	}

	/*
	 * UPDATE FUNCTION
	 */
	module.exports.update = function(topLevelCallback) {
		console.log("updating database " + new Date());

		async.series([

		function(tumblrCrawlCallback) {
			tumblrCrawl(tumblrCrawlCallback);
		},

		function(twitterCrawlCallback) {
			twitterCrawl(twitterCrawlCallback);
		}
		], function(err) {
			if(err) {
				console.log(err)
			} else {
				topLevelCallback(null);
			}
		})
	}
}());
