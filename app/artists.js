var async = require('async');
var http = require('http');
var tumblr = require('./tumblr/tumblr-db');
var twitter = require('./twitter/twitter-db');

/*
 * TAGS
 *
 * keeps track of all of the tags for the application
 * pulls them from a google spreadsheet
 */
( function() {

	// all of the arrays of tag pieces
	var artists = [];

	var searches = [];

	//returns all of the tag objects
	function getArtists() {
		return artists;
	}

	//returns the artist with the matching id
	function getArtistFromHandleID(id) {
		for(var i = 0; i < artists.length; i++) {
			if(id === artists[i].handleid) {
				return artists[i].name;
			}
		}
		return null;
	}

	//returns a list of searches to perform for that artist
	function getSearches() {
		return searches;
	}

	//returns all of the tumblr tags that we are tracking
	function getHandles() {
		var handles = [];
		for(var i = 0; i < artists.length; i++) {
			var handle = artists[i].handleid;
			handles.push(handle);
		}
		return handles;
	}

	//gets the tags from the google doc
	//OLD - https://spreadsheets.google.com/feeds/list/0AiVz2Kh7uRRBdHliYVFpeGNGNFlqelBxb09MaFFTYXc/od6/public/values?alt=json
	//https://spreadsheets.google.com/feeds/list/0AkwkMzagodkFdE9uODFzVVRSVU5YSkZNU3E2MFBkamc/od6/public/values?alt=json
	function retrieve(callback) {
		var options = {
			host : 'spreadsheets.google.com',
			port : 80,
			path : '/feeds/list/0AkwkMzagodkFdE9uODFzVVRSVU5YSkZNU3E2MFBkamc/od6/public/values?alt=json',
			method : 'GET',
		};
		makeRequest(options, function(response) {
			var tmpArtists = [];
			for(var i = 0; i < response.length; i++) {
				var item = response[i];
				var artistName = item["gsx$artist"]["$t"];
				var handle = item["gsx$twitter"]["$t"].toLowerCase();
				var ignore = item["gsx$ignore"]["$t"];
				var handleid = item["gsx$handleid"]["$t"];
				//if the first char is an '@', remove it
				if(handle.charAt(0) === '@') {
					handle = handle.slice(1);
				}
				var search = [artistName.toLowerCase()];
				//if it has whitespace, remove the whitespace and add that tag as well
				if(artistName.indexOf(' ') >= 0) {
					search.push(artistName.replace(/ /g, '').toLowerCase());
				}
				var artist = {
					name : artistName,
					handle : handle,
					handleid : handleid,
					search : search,
					//how many things are tagged with this artist in the db
					count : 0,
				}
				//if there is no handle, or it's supposed to be ignored, don't put it in
				if(ignore === '' && handleid !== '') {
					tmpArtists.push(artist);
				}
			}
			getCount(tmpArtists, function(){
				artists = tmpArtists;
				callback();	
			});
		})
	}

	//get the number of items that are tagged with each of the tags in the list
	function getCount(artistList, topLevelCallback) {
		async.parallel([
		function(tumblrTagCallback) {
			//in the past week
			getTumblrArtistCount(artistList, tumblrTagCallback);
		},

		function(twitterTagCallback) {
			getTwitterArtistCount(artistList, twitterTagCallback);
		}], topLevelCallback);

	}

	//gets the posts in the past 2 weeks
	function getTumblrArtistCount(artistList, topLevelCallback) {
		var now = new Date();
		var timeFrom = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) - 14);
		var timeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		//iterate over the tags
		async.each(artistList, function(artistObj, gotArtistCallback) {
			tumblr.getArtistBetweenTime(artistObj.name, timeFrom, timeTo, function(response) {
				artistObj.count += response.length;
				gotArtistCallback(null);
			})
		}, topLevelCallback)
	}

	function getTwitterArtistCount(artistList, topLevelCallback) {
		var now = new Date();
		var timeFrom = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) - 14);
		var timeTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		//iterate over the tags
		async.each(artistList, function(artistObj, gotArtistCallback) {
			twitter.getArtistBetweenTime(artistObj.name, timeFrom, timeTo, function(response) {
				artistObj.count += response.length;
				gotArtistCallback(null);
			})
		}, topLevelCallback)
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

	//module.exports.getTags = getTags;

	module.exports.getHandles = getHandles;

	module.exports.getArtists = getArtists;

	module.exports.getArtistFromHandleID = getArtistFromHandleID;

	module.exports.retrieve = retrieve;

	//module.exports.getTumblrTags = getTumblrTags;

	//module.exports.getTwitterHandles = getTwitterHandles;

}());
