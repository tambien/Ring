/*
 * TWEET
 *
 */

RING.Twitter = RING.Post.extend({

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		this.set("style", 'octagon')
		//listen for changes to set the visibility
		this.set({
			"timeMatch" : false,
			"artistMatch" : false,
		});
		//and add the listeners for those
		this.listenTo(RING.controls, "change:startTime", this.testTime);
		this.listenTo(RING.controls, "change:endTime", this.testTime);
		this.listenTo(RING.controls.artistList, "change:checked", this.testArtist);
		//make the view
		this.view = new RING.Twitter.View({
			model : this,
		})
	},
	allLoaded : function() {
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
