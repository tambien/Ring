var keys = require("./keys");
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
	 * 	photos: json if it exists
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
			tags = tags.getUnique();
		}
		//make the tags lowercase
		for(var i = 0; i < tags.length; i++) {
			tags[i] = tags[i].toLowerCase().toString("utf8");
		}
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
		if (response.reblogged_from_id){
			reblogged_from = {
				id: response.reblogged_from_id,
				blog_name: response.reblogged_from_name
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
		text = text.toString("utf8");
		//limit the size of the text field to 1000 chars
		if(text.length > 1000) {
			text = text.substr(0, 1000);
		}
		//get the photos if there are any
		var photo = {};
		if(response.photos) {
			photo = response.photos[0].original_size;
		}
		photo = JSON.stringify(photo);
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
					throw new Error(body);
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