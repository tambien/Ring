RING.TumblrCollection = Backbone.Collection.extend({

	model : RING.Tumblr,

	initialize : function(models, options) {
		//the force-directed graph
		this.on("add", this.postAdded);
		this.on("remove", this.postRemoved);
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
			}
			model.view.drawEdgesToReblogs();
		});
		this.primary = this.filter(function(model){
			return model.get('reblogged_from')===null;
		})
		//remove orphans
		/*
		 var self = this;
		 var orphans = this.filter(function(model){
		 var reblogged_from = model.get("reblogged_from");
		 return self.get(reblogged_from)===undefined;
		 })
		 this.remove(orphans);
		 */
		/*
		 this.forEach(function(model, index) {
		 model.connectReblogs();
		 });
		 this.forEach(function(model, index) {
		 if(model.get("reblogged_from") === null) {
		 model.positionReblogs();
		 }
		 });
		 */
	},
	sync : function() {
		//get the tumblr posts from the database
		var reqString = window.location + "get?type=tumblr";
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				console.log("tumblr posts loaded");
				self.update(response);
				self.allLoaded();
			},
			error : function() {
				console.error("could not fetch that data");
			}
		})
	}
});
