RING.TumblrCollection = Backbone.Collection.extend({

	model : RING.Tumblr,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
		this.primary = [];
		//this.sync();
	},
	//connects all reblogs with a line
	connectReblogs : function() {
		this.forEach(function(model, index) {
			model.connectToReblogs();
		});
	},
	postAdded : function(model) {
		//model.allLoaded();
	},
	postRemoved : function(post) {
		post.remove();
	},
	render : function() {

	},
	//0 is primary nodes, 1 is reblogs, 2 is reblogs of reblogs
	setReblogVisibility : function(level) {
		this.forEach(function(model, index) {
			model.setReblogVisibility(level);
		});
	},
	allLoaded : function() {
		this.forEach(function(model, index) {
			model.allLoaded();
		});
		this.forEach(function(model, index) {
			model.allLoaded2();
		});
		this.forEach(function(model, index) {
			model.allLoaded3();
		});
		this.primary = this.filter(function(model) {
			return model.get('reblogged_from') === null;
		})
	},
	sync : function(callback) {
		//get the tumblr posts from the database
		var reqString = window.location + "get?type=tumblr";
		var self = this;
		if(RING.dontLoad) {
			callback();
		} else {
			$.ajax(reqString, {
				success : function(response) {
					self.update(response);
					//self.allLoaded();
					//RING.loaded();
					console.log("tumblr posts loaded");
					callback();
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
		this.add(posts.tumblr, {
			merge : false
		});
		var artistPosts = this.where({
			artist : artistName
		});
		_.forEach(artistPosts, function(model) {
			model.allLoaded();
		});
		_.forEach(artistPosts, function(model) {
			model.allLoaded2();
		});
		//refilter the primary posts
		this.primary = this.filter(function(model) {
			return model.get('reblogged_from') === null;
		});
	},
	//loads a single artist
	//connects all of the reblogs, etc
	loadArtist : function(artist) {
		var artistPosts = this.where({
			artist : artist
		});
		_.forEach(artistPosts, function(model) {
			model.allLoaded();
		});
		_.forEach(artistPosts, function(model) {
			if(model.get("reblogged_from") === null) {
				model.positionReblogs();
			} else {
				model.view.drawEdgeToOrigin();
			}
		});
		//refilter the primary posts
		this.primary = this.filter(function(model) {
			return model.get('reblogged_from') === null;
		});
	}
});
