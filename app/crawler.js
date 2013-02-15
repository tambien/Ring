var tumblr = require("./tumblr/tumblr");
var async = require('async');
var state = require('./state');
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
		tumblr.searchTags(state.tags, function(results) {
			console.log("%d tumblr requests, %d db insertions, %d db requests, %d db updates, in %d milliseconds", results.tumblrGet, results.dbPut, results.dbGet, results.dbUpdate, results.timeElapsed);
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
