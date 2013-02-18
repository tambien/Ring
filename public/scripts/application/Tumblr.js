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
			model : this,
		})
	},
	validate : function(attributes, options) {
		//don't update the model to an out of date model
		if(attributes.timestamp < this.get("timestamp")) {
			return false;
		}
	},
	//called when a model is removed from the collection
	remove : function() {

	},
	//sets the x and y based on the time + a little randomness
	getPositionFromTime : function() {
		var randomAmount = 4;
		var date = new Date(this.get("timestamp"));
		var hoursAngle = Math.PI * 2 * (date.getHours() / 24);
		var minutesAngle = (Math.PI / 12) * (date.getMinutes() / 60);
		var timeAngle = hoursAngle + minutesAngle;
		var randomRadius = RING.Util.randomFloat(47, 53);
		this.set({
			x : randomRadius * Math.cos(timeAngle),
			y : randomRadius * Math.sin(timeAngle),
		})
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count");
		this.set("size", count / 2 + 1);
	},
	connectToReblogs : function() {
		var reblogs = this.get("reblogs");
		var circle = this.view.circle;
		for(var i = 0; i < reblogs.length; i++) {
			//get the reblog
			var post = RING.tumblrCollection.get(reblogs[i].reblog_id);
			//if the post is defined
			if(post) {
				//make a line to the reblogs
				var reblogCircle = post.view.circle;
				RING.Three.connectCircles(circle, reblogCircle);
				//and connect that reblog to it's reblogs
				post.connectToReblogs();
			}

		}
	}
});

RING.Tumblr.View = Backbone.View.extend({
	initialize : function() {
		this.circle = RING.Three.add(this.model.get("x"), this.model.get("y"), this.model.get("size"));
		this.circle.onclick = this.clicked.bind(this);
	},
	clicked : function() {
		this.model.connectToReblogs();
	}
})