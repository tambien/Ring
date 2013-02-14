var db = require('./database');
var async = require('async');
/*
 * STATE
 * 
 * keeps track of all of the state for the application
 */
( function() {
	
	//returns all of the tags which the app is tracking
	function getTags(callback){
		db.connect(function(err, client){
			if (err){
				console.log("could not connect to database "+err);
			}
		});
	}
	
	/*
	 * API
	 */
		
	module.exports.getTags = getTags;

}());