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
		"x" : 0,
		"y" : 0,
		"size" : 0,
	},

	initialize : function(attributes, options) {
		this.getPositionFromTime();
		this.getSizeFromNoteCount();
		this.view = new RING.Tumblr.View({
			model: this,
		})
	},
	validate : function(attributes, options) {
		//don't update the model to an out of date model
		if (attributes.timestamp < this.get("timestamp")){
			return false;
		}
	},
	//called when a model is removed from the collection
	remove : function() {

	},
	//sets the x and y based on the time + a little randomness
	getPositionFromTime: function(){
		var randomAmount = 4;
		var date = new Date(this.get("timestamp"));
		var hoursAngle = Math.PI*2*(date.getHours()/24);
		var minutesAngle = (Math.PI/12)*(date.getMinutes()/60);
		var timeAngle = hoursAngle+minutesAngle;
		this.set({
			x : 50*Math.cos(timeAngle) + RING.Util.random()*randomAmount,
			y : 50*Math.sin(timeAngle)+ RING.Util.random()*randomAmount,
		})
	},
	getSizeFromNoteCount: function(){
		var count = this.get("note_count");
		this.set("size", count/2+1);	
	}
});

RING.Tumblr.View = Backbone.View.extend({
	initialize : function() {
		this.circle = RING.Three.add(this.model.get("x"), this.model.get("y"), this.model.get("size"));
	},
})