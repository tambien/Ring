/*
 * TAG
 *
 * a model representing a single tag
 */

RING.Artist = Backbone.Model.extend({
	defaults : {
		"checked" : false,
		"name" : "",
		"count" : 0,
		"color" : "#fff",
		"visible" : false,
	},
	initialize : function(attributes, options) {

		//make the view
		this.view = new RING.Artist.View({
			model : this,
		});
	},
});

/*
 * ARTIST VIEW
 */
RING.Artist.View = Backbone.View.extend({

	className : "tag",

	events : {
		"click .checkbox" : "check",
	},

	initialize : function() {
		//listen for changes
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:visible", this.addOrRemove);
		this.$checkbox = $("<div class='checkbox'></div>").appendTo(this.$el);
		this.$artist = $("<div class='artist'>" + this.model.get("name") + "</div>").appendTo(this.$el);
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
 * ARTIST COLLECTION
 */

RING.Artists = Backbone.Collection.extend({

	model : RING.Artist,

	initialize : function(models, options) {
		//get the tags initially
		this.getArtists();
		//make a request whenever there is a change in the tags
		//this.on("add", this.makeVisible);
		//this.listenTo("change:checked", this.searchTags);
	},
	getArtists : function() {
		var reqString = window.location + "get?type=top";
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				console.log("artist list loaded");
				self.update(response);
				self.makeVisible();
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
			if(i < 26) {
				model.set('visible', true);
			} else {
				model.set('visible', false);
				//if it's invisible it's not checked either
				model.set('checked', false);
			}
		}
	},
	//get the color of an artist
	getColor : function(artist) {

	}
});
