var tumblr = require("./tumblr/tumblr");
var twitter = require('./twitter/twitter.js');
var async = require('async');
var artists = require('./artists');
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
		tumblr.searchArtists(artists.getArtists(), function() {
			topLevelCallback(null);
		});
	}

	/*
	* TWITTER CRAWL
	*/

	//the starting point for a crawl
	function twitterCrawl(topLevelCallback) {
		twitter.refreshHandles(topLevelCallback);
	}

	/*
	 * UPDATE FUNCTION
	 */
	module.exports.update = function(topLevelCallback) {
		console.log("updating database " + new Date());

		async.parallel([

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
