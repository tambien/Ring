/*
 * TAG
 *
 * a model representing a single tag
 */

RING.Tag = Backbone.Model.extend({
	defaults : {
		"checked" : false,
		"artist" : "",
		"tumblrhashtags" : [],
		"twitterhandle" : "",
		"twitterhashtags" : "",
		"color" : "#ffffff",
		"count" : 0,
		"visible" : false,
	},
	initialize : function(attributes, options) {

		//make the view
		this.view = new RING.Tag.View({
			model : this,
		});
	},
});

/*
 * TAG VIEW
 */
RING.Tag.View = Backbone.View.extend({

	className : "tag",

	events : {
		"click .checkbox" : "check",
	},

	initialize : function() {
		//listen for changes
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:visible", this.addOrRemove);
		this.$checkbox = $("<div class='checkbox'></div>").appendTo(this.$el);
		this.$artist = $("<div class='artist'>" + this.model.get("artist") + "</div>").appendTo(this.$el);
		//render for the first time
		this.render(this.model);
	},
	render : function(model) {
		if(this.model.get("checked")) {
			this.$checkbox.css({
				"background-color" : this.model.get("color")
			})
		} else {
			this.$checkbox.css({
				"background-color" : "inherit"
			})
		}
	},
	check : function(event) {
		this.model.set("checked", !this.model.get("checked"));
	},
	addOrRemove : function() {
		if(this.model.get("visible")) {
			this.$el.appendTo($("#tagsList"));
		} else {
			this.$el.remove();
		}
	}
});

/*
 * DATE RANGE
 */

RING.DateRange = Backbone.Model.extend({
	defaults : {
		"start" : new Date(2013, 2, 8),
		"end" : new Date(),
	},
	initialize : function(attributes, options) {

		//make the view
		this.view = new RING.Tag.View({
			model : this,
		});
	},
});

/*
 * TAGS COLLECTION
 */

RING.Tags = Backbone.Collection.extend({

	model : RING.Tag,

	initialize : function(models, options) {
		//get the tags initially
		this.getTags();
		//make a request whenever there is a change in the tags
		this.on("add", this.makeVisible);
		this.on("change:checked", this.searchTags);
		//this.listenTo("change:checked", this.searchTags);
	},
	getTags : function() {
		var reqString = window.location + "get?type=tags";
		$.ajax(reqString, {
			success : function(response) {
				RING.tags.update(response);
			},
			error : function() {
				console.error("could not fetch that data");
			}
		})
	},
	comparator : function(a, b) {
		var aCount = a.get("count");
		var bCount = b.get("count");
		if(aCount > bCount) {
			return -1;
		} else if(aCount === bCount) {
			return 0;
		} else {
			return 1;
		}
	},
	makeVisible : function() {
		//make the most popular posts visible in the list
		for(var i = 0; i < this.length; i++) {
			var model = this.models[i];
			if(i < 24) {
				model.set('visible', true);
			} else {
				model.set('visible', false);
			}
		}
	},
	searchTags : function() {
		console.log("searching");
	},
	getTagsBetween : function(tags, timeFrom, timeTo) {
		var obj = {
			type : "range",
			tags : tags,
			start : timeFrom,
			end : timeTo
		}
		var reqString = window.location + "get?" + decodeURIComponent($.param(obj));
		$.ajax(reqString, {
			success : function(response) {
				RING.tumblrCollection.update(response.tumblr);
				RING.tumblrCollection.allLoaded();
			},
			error : function() {
				console.error("could not fetch that data");
			}
		})
	}
});
