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
		$.ajax(reqString, {
			success : function(response) {
				self.update(response);
				self.allLoaded();
				console.log("twitter tweets loaded");
			},
			error : function() {
				console.error("could not fetch that data");
			}
		})
	}
});
