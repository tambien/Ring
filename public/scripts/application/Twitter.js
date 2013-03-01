/*
 * TWEET
 *
 */

RING.Twitter = RING.Post.extend({

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		this.set("style",  'octagon')
		
		//add the handle as well
		
		this.view = new RING.Twitter.View({
			model : this,
		})
	},
	allLoaded : function(){
		this.superLoaded();
	}
});

RING.Twitter.View = RING.Post.View.extend({

	initialize : function() {
		this.superInit();
		//this.createElement();
	},
	createElement : function() {
		var handle = RING.controls.artistList.getHandle(this.model.get("artist"));
		this.$title = $("<div id='title'> @" + handle + "</div>").appendTo(this.$el);
		var text = this.model.get("text");
		this.$text = $("<div id='text'>" + text + "</div>").appendTo(this.$el);
		this.$notes = $("<div id='reblogs'>retweets: " + this.model.get("note_count") + "</div>").appendTo(this.$el);
	},
});