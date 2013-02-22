var async = require('async');
var http = require('http');
var tumblr = require('./tumblr/tumblr-db');

/*
 * TAGS
 *
 * keeps track of all of the tags for the application
 * pulls them from a google spreadsheet
 */
( function() {

	// all of the arrays of tag pieces
	var tags = [];

	var tumblrTags = [];

	//returns all of the tag objects
	function getTags() {
		return tags;
	}

	//returns all of the tumblr tags that we are tracking
	function getTumblrTags() {
		return tumblrTags;
	}

	//gets the tags from the google doc
	//https://spreadsheets.google.com/feeds/list/0AiVz2Kh7uRRBdHliYVFpeGNGNFlqelBxb09MaFFTYXc/od6/public/values?alt=json
	function retrieve(callback) {
		var options = {
			host : 'spreadsheets.google.com',
			port : 80,
			path : '/feeds/list/0AiVz2Kh7uRRBdHliYVFpeGNGNFlqelBxb09MaFFTYXc/od6/public/values?alt=json',
			method : 'GET',
		};
		makeRequest(options, function(response) {
			tags = [];
			tumblrTags = [];
			twitterTags = [];
			for(var i = 0; i < response.length; i++) {
				var item = response[i];
				var artist = item["gsx$artist"]["$t"];
				var twitterHandle = item["gsx$twitterhandle"]["$t"];
				var tumblrHashtags = item["gsx$tumblrhashtags"]["$t"];
				tumblrHashtags = tumblrHashtags.split("/");
				if(tumblrHashtags[0] !== '') {
					//make them all lowercase
					for (var j = 0; j < tumblrHashtags.length; j++){
						tumblrHashtags[j] = tumblrHashtags[j].toLowerCase()
					}
					tumblrTags = tumblrTags.concat(tumblrHashtags);
				} else {
					tumblrHashtags = [];
				}
				var twitterHashtags = item["gsx$twitterhashtags"]["$t"];
				twitterHashtags = twitterHashtags.split("/");
				if(twitterHashtags[0] !== '') {
					//make them all lowercase
					for (var j = 0; j < twitterHashtags.length; j++){
						twitterHashtags[j] = twitterHashtags[j].toLowerCase()
					}
					twitterTags = twitterTags.concat(twitterHashtags);
				} else {
					twitterHashtags = [];
				}
				var tag = {
					artist : artist,
					twitterhandle : twitterHandle,
					tumblrhashtags : tumblrHashtags,
					twitterhashtags : twitterHashtags,
					//how many things are tagged with this item
					count : 0,
				}
				tags.push(tag);
			}
			getTagCount(callback);
		})
	}

	//get the number of items that are tagged with each of the tags in the list
	function getTagCount(topLevelCallback) {
		async.parallel([
		function(tumblrTagCallback) {
			getTumblrTagCount(tumblrTagCallback);
		},

		function(twitterTagCallback) {
			getTwitterTagCount(twitterTagCallback);
		}], topLevelCallback);

	}

	function getTumblrTagCount(topLevelCallback) {
		//iterate over the tags
		async.each(tags, function(tagObj, gotTagCallback) {
			//combine all of the counts for reach of the tags in the array of tags
			async.each(tagObj.tumblrhashtags, function(tag, callback) {
				tumblr.getTagCount(tag, function(count) {
					tagObj.count += count;
					callback(null);
				})
			}, gotTagCallback)
		}, topLevelCallback)
	}

	function getTwitterTagCount(topLevelCallback) {
		topLevelCallback();
	}

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
						callback(json.feed.entry);
					}
				} else {
					console.log("could not complete request. the post probably does not exist anymore");
					//console.log(options);
				}
			});
		});

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		}).end();
	}
	/*
	 * API
	 */

	module.exports.getTags = getTags;

	module.exports.retrieve = retrieve;

	module.exports.getTumblrTags = getTumblrTags;

}());
