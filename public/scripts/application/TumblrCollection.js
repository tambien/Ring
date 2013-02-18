RING.TumblrCollection = Backbone.Collection.extend({
	
	model : RING.Tumblr,
	
	initialize : function(models, options) {
		//this.connectReblogs();
	},
	//connects all reblogs with a line
	connectReblogs : function(){
		this.forEach(function(model, index){
			model.connectToReblogs();
		});
	}, 
});
