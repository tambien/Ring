/*
 * TUMBLR
 *
 * each unit represents a post
 */

RING.Tumblr = Backbone.Model.extend({

	defaults : {
		"id" : 0,
		"blog_name" : "",
		"photo" : "",
		"url" : "",
		"tags" : [],
		"rebogs" : [],
		"text" : "",
		"timestamp" : 0,
		"note_count" : 0,
	},

	initialize : function(attributes, options) {
		//set the ID
	},
	validate : function(attributes, options) {

	},
	//called when a model is removed from the collection
	remove : function() {

	},
});

RING.Tumblr.View = Backbone.View.extend({
	initialize : function() {

	}
})