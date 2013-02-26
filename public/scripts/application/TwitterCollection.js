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
	}
});
