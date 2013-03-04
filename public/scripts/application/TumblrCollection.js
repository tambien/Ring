RING.TumblrCollection = Backbone.Collection.extend({

	model : RING.Tumblr,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
		this.primary = [];
		this.sync();
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
			if(model.get("reblogged_from") === null) {
				model.positionReblogs();
			} else {
				model.view.drawEdgeToOrigin();	
			}
		});
		this.primary = this.filter(function(model) {
			return model.get('reblogged_from') === null;
		})
	},
	sync : function() {
		//get the tumblr posts from the database
		var reqString = window.location + "get?type=tumblr";
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				self.update(response);
				self.allLoaded();
				RING.loaded();
				console.log("tumblr posts loaded");
			},
			error : function() {
				alert("there has been an error. try reloading the page");
				console.error("could not fetch that data");
			}
		})
	}
});
