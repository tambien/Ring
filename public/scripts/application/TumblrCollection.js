RING.TumblrCollection = Backbone.Collection.extend({

	model : RING.Tumblr,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
	},
	//connects all reblogs with a line
	connectReblogs : function() {
		this.forEach(function(model, index) {
			model.connectToReblogs();
		});
	},
	postAdded : function(post) {

		//add the node to the graph
		post.node
	},
	render : function() {
		if(this.averageEnergy() > .1) {
			this.forEach(function(model, index) {
				model.applyHookesLaw();
				model.applyCoulombsLaw();
				//model.pushOutward()
			});
			this.forEach(function(model, index) {
				model.updateVelocity();
				model.updatePosition();
			});
		}

	},
	averageEnergy : function() {
		var energy = 0;
		this.forEach(function(model, index) {
			energy += model.totalEnergy();
		});
		return energy/this.length;
	},
	allLoaded : function() {
		this.forEach(function(model, index) {
			model.allLoaded();
		});
	}
});
