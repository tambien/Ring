RING.TwitterCollection = Backbone.Collection.extend({

	model : RING.Twitter,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
	},
	postAdded : function(model) {
		//model.allLoaded();
		//console.log("added");
	},
	postRemoved : function(post) {
		post.remove();
	},
	render : function() {

	},
	allLoaded : function() {
		this.forEach(function(model, index) {
			model.allLoaded();
		});
	},
	sync : function(callback) {
		//get the twitter posts from the database
		var reqString = window.location.origin + "get?type=twitter";
		var self = this;
		if(RING.dontLoad) {
			callback();
		} else {
			$.ajax(reqString, {
				success : function(response) {
					self.update(response);
					//self.allLoaded();
					callback();
					console.log("twitter tweets loaded");
				},
				error : function() {
					alert("there has been an error. try reloading the page");
					console.error("could not fetch that data");
				}
			})
		}
	},
	addArtist : function(posts) {
		var artistName = posts.artist.name;
		//if the post is already in the database, update it's attributes
		var artistName = posts.artist.name;
		//now do a smart merge on each of hte posts
		var self = this;
		_.forEach(posts.twitter, function(post) {
			var postInCollection = self.get(post.id);
			//if it's in the db, merge the data that needs to be merged
			if(postInCollection) {
				postInCollection.set({
					note_count : post.note_count
				});
			} else {
				//otherwise add it
				self.add(post);
			}
		});
		var artistPosts = this.where({
			artist : artistName
		});
		_.forEach(artistPosts, function(model) {
			model.allLoaded();
		});
	},
	updateArtist : function(posts) {
		//if the post is already in the database, update it's attributes
		var artistName = posts.artist.name;
		var newPosts = [];
		//now do a smart merge on each of hte posts
		var self = this;
		_.forEach(posts.twitter, function(post) {
			var postInCollection = self.get(post.id);
			//if it's in the db, merge the data that needs to be merged
			if(postInCollection) {
				postInCollection.set({
					note_count : post.note_count,
				});
			} else {
				//otherwise add it
				var tweet = new RING.Twitter(post)
				self.add(tweet);
				newPosts.push(tweet);
			}
		});
		//load the new posts
		_.forEach(newPosts, function(model) {
			model.allLoaded();
		});
	},
	//connects all of the reblogs, etc
	loadArtist : function(artist) {
		var artistPosts = this.where({
			artist : artist
		});
		_.forEach(artistPosts, function(model) {
			model.allLoaded();
		});
	}
});
