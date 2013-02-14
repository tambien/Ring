var tumblr = require("./tumblr/tumblr");
var async = require('async');
/*
 * CRAWLER
 *
 * crawls the twitter and tumblr Posts
 */
( function() {

	/*
	 * TUMBLR CRAWL
	 */

	var tumblrTags = ["sxsw", "akronfamily", "TheBlackLips", "sibonobo", "crystalmethod", "EODM", "foofighters", "fareastmovement", "flightfac", "HiTek", "hoodinternet", "keysnkrates", "KillParis", "LeCastleVania", "Machine_Drum", "macklemore", "majorlazer", "Mookie_Jones", "Omar_Souleyman", "pauloakenfold", "rarariot", "I_Skream", "suunsband", "TalibKweli", "teganandsara", "ToroyMoi", "vampireweekend"];
	//var tumblrTags = ["sxsw"];

	//the starting point for a crawl
	function tumblrCrawl(topLevelCallback) {
		tumblr.searchTags(tumblrTags, function(results) {
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
		console.log("updating database" + new Date());

		async.series([

		function(tumblrCrawlCallback) {
			tumblrCrawl(tumblrCrawlCallback);
		},

		function(twitterCrawlCallback) {
			twitterCrawl(twitterCrawlCallback);
		}], function(err) {
			if(err) {
				console.log(err)
			} else {
				topLevelCallback(null);
			}
		})
	}
}());
