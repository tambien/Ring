/*
 * TWEET
 *
 */

RING.Twitter = RING.Post.extend({

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		
		this.set("style", 'octagon')

		//add the handle as well

		this.view = new RING.Twitter.View({
			model : this,
		});
		this.listenTo(RING.controls, "change:startTime", this.getPositionFromTime);
		this.listenTo(RING.controls, "change:endTime", this.getPositionFromTime);
		this.on("change:visible", this.getPositionFromTime);
	},
	allLoaded : function() {
		this.superLoaded();
		//get the handle
		var handle = RING.controls.artistList.getHandle(this.get('artist'));
		this.set("handle", handle);
	}
});

RING.Twitter.View = RING.Post.View.extend({

	initialize : function() {
		this.superInit();
		//this.createElement();
	},
	createElement : function() {
		this.$container.html(" ")
		this.$title = $("<div id='title'>posted by <span class='yellow'>@" + this.model.get('handle') + "</span></div>").appendTo(this.$container);
		var text = this.model.get("text");
		this.$text = $("<div id='tweet'>" + text + "</div>").appendTo(this.$container);
		this.$notes = $("<div id='note_count'>retweets: <span class='yellow'>" + this.model.get("note_count") + "</span></div>").appendTo(this.$container);
		this.$artists = $("<div id='artist'><span class='yellow'>#" + this.model.get("artist") + "</span></div>").appendTo(this.$container);
	},
});
