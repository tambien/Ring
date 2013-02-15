var db = require('./database');
var async = require('async');
/*
 * STATE
 * 
 * keeps track of all of the state for the application
 */
( function() {
	
	var tags = ["sxsw", "akronfamily", "TheBlackLips", "sibonobo", "crystalmethod", "EODM", "foofighters", "fareastmovement", "flightfac", "HiTek", "hoodinternet", "keysnkrates", "KillParis", "LeCastleVania", "Machine_Drum", "macklemore", "majorlazer", "Mookie_Jones", "Omar_Souleyman", "pauloakenfold", "rarariot", "I_Skream", "suunsband", "TalibKweli", "teganandsara", "ToroyMoi", "vampireweekend"];
	
	//returns all of the tags which the app is tracking
	function getTags(callback){
		db.connect(function(client){
			//client.query();
		});
	}
	
	/*
	 * API
	 */
		
	module.exports.getTags = getTags;
	
	module.exports.tags = tags;

}());