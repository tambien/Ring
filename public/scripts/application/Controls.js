/*
 * CONTROLS
 *
 * the date range
 */

RING.Controls = Backbone.Model.extend({
	defaults : {
		//the start of SXSW
		"startTime" : new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(new Date().getDate()) - 3),
		//right now
		"endTime" : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
		//primary/reblogs/reblogs of reblogs
		"reblogLevel" : 0,
		"artistLength" : 0,
		"expanded" : true,
		"loading" : 0,
	},
	initialize : function(attributes, options) {
		//get the tag collection
		this.artistList = new RING.Artists();
		this.artists = [];
		//listen for changes to the tags
		this.listenTo(this.artistList, "change:checked", this.updateArtists);
		//update the canvas whenver there is a change
		this.on("change", _.throttle(this.render, 600));
		//make the views
		this.view = new RING.Controls.View({
			model : this,
		});
		this.datePicker = new RING.DatePicker({
			model : this,
		});
		this.reblogLevel = new RING.ReblogLevel({
			model : this,
		});
		//load all of the models
	},
	updateArtists : function(model, checked) {
		if(checked) {
			this.artists.push(model);
			if(this.artists.length > 4) {
				var artist = this.artists.shift();
				artist.set("checked", false);
			}
		} else {
			//cut out the one that matches
			var index = this.artists.indexOf(model);
			if(index > -1) {
				this.artists.splice(index, 1);
			}
		}
		this.render();
	},
	render : function() {
		var artists = this.artists;
		var endTime = this.get("endTime");
		var startTime = this.get("startTime");
		var reblogLevel = this.get("reblogLevel");
		var tumblrModels = RING.tumblrCollection.primary;
		for(var i = 0, len = tumblrModels.length; i < len; i++) {
			var model = tumblrModels[i];
			//check if the artist matches
			var artistMatch = false;
			for(var j = 0; j < artists.length; j++) {
				if(model.get("artist") === artists[j].get("name")) {
					artistMatch = true;
					break;
				}
			}
			//atempt to speed things up
			if(!artistMatch) {
				model.set("visible", false);
				continue;
			}
			//check that it's the right time range
			var modelTime = new Date(model.get("timestamp"));
			var timeMatch = (modelTime > startTime && modelTime <= endTime);
			//atempt to speed things up
			if(!timeMatch) {
				model.set("visible", false);
				continue;
			}
			//set it as visible
			model.set("visible", true);
			//and all it's reblogs
			model.makeReblogsVisible(reblogLevel);
			/*
			//check that the reblog filter is right
			var reblogMatch = model.get("reblog_level") <= reblogLevel;
			//atempt to speed things up
			if(!reblogMatch) {
				model.set("visible", false);
				continue;
			}
			//if it made it all the way here, it is a match
			model.set("visible", true);
			*/
		};
	},
});

RING.Controls.View = Backbone.View.extend({

	className : 'controls',

	initialize : function() {
		this.setElement($("#controls"));
		this.$loading = $("<div id=loading>LOADING</div>").appendTo(this.$el);
		this.listenTo(this.model, "change:loading", this.render);
		this.render(this.model);
	},
	render : function(model) {
		if(this.model.get("loading") > 0) {
			this.$loading.show(0);
		} else {
			this.$loading.hide(0);
		}
	}
});

/*
 * THE DATE SELECTION
 */
RING.DatePicker = Backbone.View.extend({

	className : 'datePicker',

	events : {
		"slide" : "changeDate",
	},

	initialize : function() {
		this.$title = $("<div id='title'>DATE RANGE</div>").appendTo(this.$el);
		this.$slider = $("<div id='slider'></div>").appendTo(this.$el);
		this.$el.appendTo($("#controls"));
		this.render(this.model);
	},
	render : function(model) {
		var now = new Date();
		var startTime = this.model.get("startTime");
		var endTime = this.model.get("endTime");
		var min = startTime.getDate() - now.getDate();
		var max = endTime.getDate() - now.getDate();
		//values[0] =
		this.$slider.slider({
			range : true,
			min : -6,
			max : 0,
			values : [min, max],
		});
	},
	changeDate : function(event, ui) {
		var now = new Date();
		var minDate = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) + ui.values[0]);
		var maxDate = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) + ui.values[1]);
		this.model.set({
			startTime : minDate,
			endTime : maxDate,
		});
	}
});

RING.ReblogLevel = Backbone.View.extend({

	className : 'reblogLevel',

	events : {
		"slide" : "changeVisibility",
	},

	initialize : function() {
		this.$title = $("<div id='title'>REBLOG LEVEL</div>").appendTo(this.$el);
		$("<div id='notes'><div id='primary'>PRIMARY</div><div id='reblogs'>REBLOGS</div><div id='reblogreblogs'>REBLOGS OF REBLOGS</div></div>").appendTo(this.$el);
		this.$slider = $("<div id='slider'></div>").appendTo(this.$el);
		this.$el.appendTo($("#controls"));
		this.render(this.model);
	},
	render : function(model) {
		var val = this.model.get("reblogLevel");
		this.$slider.slider({
			min : 0,
			max : 2,
			value : val,
		});
	},
	changeVisibility : function(event, ui) {
		this.model.set("reblogLevel", ui.value);
	}
});
