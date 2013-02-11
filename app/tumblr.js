var keys = require("keys");
var http = require('http');
var db = require('database');

/*
 * TUMBLR
 *
 * gets posts and tags from tumblr
 */
( function() {

	function getPost(blog, id, callback) {
		//if a post is already in the db
		
		//does it need an update? 
		
		//else query tumblr for that post
		
		
		
		
		//the request options
		var options = {
			host : 'api.tumblr.com',
			port : 80,
			path : '/v2/blog/' + blog + ".tumblr.com/posts?api_key=" + keys.tumblrAPIKey + "&id=" + id,
			method : 'GET',
			port : 80,
		};
		//else put it in the db
		makeRequest(options, callback);
	}

	function searchTag(hashtag, params, callback) {
		if(params && !callback) {
			callback = params;
		}
		//the request options
		var options = {
			host : 'api.tumblr.com',
			port : 80,
			path : '/v2/tagged?tag=' + hashtag + "&api_key=" + keys.tumblrAPIKey + getParamsString(params),
			method : 'GET',
			port : 80,
		};
		makeRequest(options, callback);
	}

	/*
	 * HELPERS
	 */
	var makeRequest = function(options, callback) {
		//initiate the request
		var body = "";
		var req = http.request(options, function(res) {
			//the response response
			res.setEncoding('utf8');
			//got a chunk of data
			res.on('data', function(chunk) {
				body += chunk;
			});
			//the request ended
			res.on('end', function() {
				if(res.statusCode == 200 || res.statusCode == 301) {
					var json = JSON.parse(body);
					if(callback) {
						callback(json.response);
					}
				} else {
					throw new Error(body);
				}
			});
		});

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		}).end();
	}
	var getParamsString = function(params) {
		if(!params || params instanceof Function)
			return '';

		var paramArray = [];

		for(var k in params) {
			paramArray.push(k + '=' + params[k]);
		}
		if(paramArray.length > 0) {
			return "&" + paramArray.join('&');
		} else {
			return "";
		}
	}
	/*
	 *  PUBLIC API
	 */
	module.exports.searchTag = function(hashtag, callback) {
		searchTag(hashtag, {
			//add a limit for testing purposes
			limit : 1
		}, callback);
	}

	module.exports.getPost = function(host, id, callback) {
		getPost(host, id, callback);
	}

	module.exports.searchTagBefore = function(hashtag, timestamp, callback) {
		getTag(hashtag, {
			before : timestamp
		}, callback);
	}
}());
