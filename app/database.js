var key = require("./keys");
var pg = require('pg');
/*
 * DATABASE
 * 
 * this is the main database connection point 
 */
(function(){
	
	function connect(callback){
		pg.connect(key.dbConnectionString, function(err, client){
			if(err){
				console.log("could not connect to databse "+err);
				client.emit("drain");
			} else {
				callback(client);
			}
		});
	}
	
	//Public API
	module.exports.connect = connect;
}())
