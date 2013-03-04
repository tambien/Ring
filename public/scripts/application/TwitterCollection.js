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
		var reqString = window.location + "get?type=twitter";
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
		this.add(posts.twitter, {
			merge : false
		});
		var artistPosts = this.where({
			artist : artistName
		});
		_.forEach(artistPosts, function(model) {
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
