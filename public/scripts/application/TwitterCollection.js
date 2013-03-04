RING.TwitterCollection = Backbone.Collection.extend({

	model : RING.Twitter,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
		this.sync();
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
	sync : function() {
		//get the twitter posts from the database
		var reqString = window.location + "get?type=twitter";
		var self = this;
		if(RING.dontLoad) {
			RING.loaded();
		} else {
			$.ajax(reqString, {
				success : function(response) {
					self.update(response);
					self.allLoaded();
					RING.loaded();
					console.log("twitter tweets loaded");
				},
				error : function() {
					alert("there has been an error. try reloading the page");
					console.error("could not fetch that data");
				}
			})
		}
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
