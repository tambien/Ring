var db = require("./database");
var tumblr = require("./tumblr");

/*
 * CRAWLER
 *
 * crawls the twitter and tumblr Posts
 */
( function() {

	/*
	 * TUMBLR CRAWL
	 */

	//var tumblrTags = ["sxsw", "akronfamily", "TheBlackLips", "sibonobo", "crystalmethod", "EODM", "foofighters", "fareastmovement", "flightfac", "HiTek", "hoodinternet", "keysnkrates", "KillParis", "LeCastleVania", "Machine_Drum", "macklemore", "majorlazer", "Mookie_Jones", "Omar_Souleyman", "pauloakenfold", "rarariot", "I_Skream", "suunsband", "TalibKweli", "teganandsara", "ToroyMoi", "vampireweekend"];
	var tumblrTags = ["sxsw"];

	//the starting point for a crawl
	function tumblrCrawl() {
		tumblr.searchTags(tumblrTags);
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

