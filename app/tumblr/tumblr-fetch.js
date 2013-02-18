var keys = require("../keys");
var http = require('http');

/*
 * TUMBLR - FETCH
 *
 * gets posts and tags from tumblr.com
 *
 *
 */

( function() {

	//the number of posts to return from a search
	//max 20
	var requestLimit = 20;

	/*
	 * posts in the form
	 *
	 * {
	 * 	id,
	 * 	blog_name,
	 * 	note_count,
	 * 	reblogs : [], //each reblog  = { id, blog_name };
	 * 	tags : [], //combination of featured_tags and tags
	 * 	timestamp: unix time,
	 *	text,
	 * 	photos: url of image link
	 * 	url,
	 * }
	 */
	function parsePost(response) {
		//combine the featured tags and the tags
		var tags = [];
		if(response.tags) {
			tags = response.tags;
		}
		if(response.featured_in_tags) {
			tags = tags.concat(response.featured_in_tags);
		}
		//make the tags lowercase
		for(var i = 0; i < tags.length; i++) {
			tags[i] = tags[i].toLowerCase().removeInvalidChars();
		}
		//get the unique ones
		tags = tags.getUnique();
		//go through all of the reblogs
		var reblogs = [];
		if(response.notes) {
			for(var i = 0; i < response.notes.length; i++) {
				var note = response.notes[i];
				if(note.type === "reblog") {
					//if the reblog notice is not this post
					if(note.post_id != response.id) {
						var reb = {
							id : note.post_id,
							blog_name : note.blog_name,
						}
						reblogs.push(reb);
					}
				}
			}
		}
		var reblogged_from = null;
		if(response.reblogged_from_id) {
			reblogged_from = {
				id : response.reblogged_from_id,
				blog_name : response.reblogged_from_name
			}
		}
		//do the text formatting
		var text = '';

		switch(response.type) {
			case 'photo':
				text = response.caption;
				break;
			case 'text':
				text = response.body;
				break;
		}
		//force correct encoding
		text = text.removeInvalidChars();
		//limit the size of the text field to 1000 chars
		if(text.length > 1000) {
			text = text.substr(0, 1000);
		}
		//get the photos if there are any
		var photo = '';
		if(response.photos) {
			//find the image with the right width
			var alt_sizes = response.photos[0].alt_sizes;
			for (var i = 0; i < alt_sizes.length; i++){
				if (alt_sizes[i].width===250){
					photo = alt_sizes[i].url;
					break;
				} 
			}
		}
		var post = {
			id : response.id,
			blog_name : response.blog_name,
			timestamp : response.timestamp,
			note_count : response.note_count,
			tags : tags,
			reblogs : reblogs,
			text : text,
			photo : photo,
			url : response.post_url,
			reblogged_from : reblogged_from,
		};
		return post;
	}

	//get hte post from tumblr.com
	function get(post, callback) {
		var id = post.id;
		var blog_name = post.blog_name;

		var options = {
			host : 'api.tumblr.com',
			port : 80,
			path : '/v2/blog/' + blog_name + ".tumblr.com/posts?api_key=" + keys.tumblrAPIKey + "&id=" + id + "&notes_info=true&reblog_info=true&filter=text",
			method : 'GET',
		};
		makeRequest(options, function(response) {
			//parse the response
			var post = parsePost(response.posts[0]);
			//call the callback if it exists
			if(callback) {
				callback(post);
			}
		});
	}

	//get hte post from tumblr.com
	function getReblog(post, callback) {
		var id = post.id;
		var blog_name = post.blog_name;

		var options = {
			host : 'api.tumblr.com',
			port : 80,
			path : '/v2/blog/' + blog_name + ".tumblr.com/posts?api_key=" + keys.tumblrAPIKey + "&id=" + id + "&notes_info=false&reblog_info=true&filter=text",
			method : 'GET',
		};
		makeRequest(options, function(response) {
			//parse the response
			var post = parsePost(response.posts[0]);
			//call the callback if it exists
			if(callback) {
				callback(post);
			}
		});
	}

	//returns an array of posts
	function fetchTags(hashtag, callback) {
		//the request options
		var options = {
			host : 'api.tumblr.com',
			port : 80,
			path : '/v2/tagged?tag=' + hashtag + "&api_key=" + keys.tumblrAPIKey + "&limit=" + requestLimit,
			method : 'GET',
		};
		makeRequest(options, function(response) {
			var tagsArray = [];
			//parse the response into an array of posts
			for(var i = 0; i < response.length; i++) {
				//add that post's tag
				var post = response[i];
				//format the post
				tagsArray.push(parsePost(post));
			}
			//return the array of formatted posts that contain that hashtag
			callback(tagsArray);
		});
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
	 *  PUBLIC API
	 */
	module.exports.getTaggedPosts = fetchTags;

	module.exports.get = get;

}());

Array.prototype.getUnique = function() {
	var u = {}, a = [];
	for(var i = 0, l = this.length; i < l; ++i) {
		if(u.hasOwnProperty(this[i])) {
			continue;
		}
		a.push(this[i]);
		u[this[i]] = 1;
	}
	return a;
}
String.prototype.removeInvalidChars = function() {
	//this gets rid of people putting emojis in their posts
	return this.replace(/[^\u0000-\u27FF]/g, '')
}