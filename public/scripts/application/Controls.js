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
		"cardinality" : 0,
		"artists" : [],
		"expanded" : true,
		"loading" : 0,
	},
	initialize : function(attributes, options) {
		//get the tag collection
		this.artists = new RING.Artists();
		//listen for changes to the tags
		this.listenTo(this.artists, "change:checked", this.updateArtists);
		//search whenever there has been a change
		this.on("change:artists", this.artistChange);
		this.on("change:startTime", this.dateChange);
		this.on("change:endTime", this.dateChange);

		//make the views
		this.view = new RING.Controls.View({
			model : this,
		});
		this.datePicker = new RING.DatePicker({
			model : this,
		});
	},
	updateArtists : function() {
		var artists = [];
		var checkedTags = this.artists.forEach(function(model) {
			if(model.get("checked")) {
				artists = artists.concat(model.get("name"));
			}
		});
		this.set("artists", artists);
	},
	artistChange : function() {
		//only search teh difference in the tags
		var prev = this.previous("artists");
		var artists = this.get("artists");
		if(artists.length > prev.length) {
			var newArtist = artists.filter(function(i) {
				return !(prev.indexOf(i) > -1);
			});
			this.getArtistBetween(newArtist, this.get("startTime"), this.get("endTime"));
		} else {
			//if tags were removed, filter out models that don't have the tags
			var newArtist = prev.filter(function(i) {
				return !(artists.indexOf(i) > -1);
			});
			var removeModelsFromTumblr = RING.tumblrCollection.where({
				artist : newArtist[0],
			});
			RING.tumblrCollection.remove(removeModelsFromTumblr);
			var removeModelsFromTwitter = RING.twitterCollection.where({
				artist : newArtist[0],
			});
			RING.twitterCollection.remove(removeModelsFromTwitter);
		}
	},
	dateChange : function() {
		var prevRange = this.previous("endTime") - this.previous("startTime");
		var currentRange = this.get("endTime") - this.get("startTime");
		//if the range is larger:
		if(prevRange < currentRange) {
			//get the new day
			var artists = this.get("artists");
			var endTime = this.get("endTime");
			if(endTime > this.previous("endTime")) {
				for(var i = 0; i < artists.length; i++) {
					this.getArtistOnDate(artists[i], endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
				}
			} else {
				var startTime = this.get("startTime");
				for(var i = 0; i < artists.length; i++) {
					this.getArtistOnDate(artists[i], startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
				}
			}
		} else {
			var start = this.get("startTime");
			var end = this.get("endTime");
			var removeModelsTumblr = RING.tumblrCollection.filter(function(model) {
				var modelTime = new Date(model.get("timestamp"));
				return !(modelTime > start && modelTime < end);
			})
			RING.tumblrCollection.remove(removeModelsTumblr);
			var removeModelsTwitter = RING.twitterCollection.filter(function(model) {
				var modelTime = new Date(model.get("timestamp"));
				return !(modelTime > start && modelTime < end);
			})
			RING.twitterCollection.remove(removeModelsTwitter);
		}
		//only retrieve the difference in the date range

		//if the date is smaller, filter out the outdated posts intead of making a server call

	},
	getArtistOnDate : function(artist, year, month, date) {
		//increment the loading counter
		this.set("loading", this.get("loading")+1);
		var obj = {
			type : "range",
			artist : artist,
			y : year,
			m : month,
			d : date,
		}
		var reqString = window.location + "get?" + decodeURIComponent($.param(obj));
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				RING.tumblrCollection.update(response.tumblr, {
					remove : false,
					merge : false,
				});
				RING.twitterCollection.update(response.twitter, {
					remove : false,
					merge : false,
				});
				RING.tumblrCollection.allLoaded();
				RING.twitterCollection.allLoaded();
				//once the thing has loaded, decrement the counter
				self.set("loading", self.get("loading")-1);
			},
			error : function() {
				self.set("loading", self.get("loading")-1);
			}
		})
	},
	getArtistBetween : function(artist, startDate, endDate) {
		var days = (endDate - startDate) / (1000 * 60 * 60 * 24);
		days = RING.Util.toInt(days);
		for(var i = 0; i < days; i++) {
			this.getArtistOnDate(artist, startDate.getFullYear(), startDate.getMonth(), parseInt(startDate.getDate()) + i);
		}
	}
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
		if(this.model.get("loading")>0) {
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
			min : -14,
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
})