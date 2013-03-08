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
		"handle" : '',
		"color" : [255, 255, 255],
		"visible" : false,
		//put the emuze ones in a special container
		"eMuze" : false,
		//signifies if the artist was added from a search
		"searchedFor" : false,
	},
	initialize : function(attributes, options) {
		this.id = this.get("name");
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
		"click" : "check",
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
			var color = this.model.get("color")
			this.$checkbox.css({
				"background-color" : "rgb(" + color.r * 255 + "," + color.g * 255 + "," + color.b * 255 + ")"
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
		if(this.model.get("eMuze")) {
			if(this.model.get("visible")) {
				this.delegateEvents();
				this.$el.appendTo($("#eMuzeTags"));
			} else {
				// this.undelegateEvents();
				this.$el.remove();
			}
		} else if(this.model.get("searchedFor")) {
			if(this.model.get("visible")) {
				this.delegateEvents();
				this.$el.appendTo($("#searchList"));
			} else {
				this.delegateEvents();
				this.$el.remove();
			}
		} else {
			if(this.model.get("visible")) {
				this.delegateEvents();
				this.$el.appendTo($("#tagsList"));
			} else {
				this.delegateEvents();
				this.$el.remove();
			}
		}
	}
});

/*
 * ARTIST COLLECTION
 */

RING.Artists = Backbone.Collection.extend({

	model : RING.Artist,

	initialize : function(models, options) {
		this.on("add", this.added);
		this.topPostsLength = RING.artistCount;
		this.searchLength = 4;
		//the list of searches
		this.searches = [];
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
	added : function(model) {
		if(model.get("searchedFor")) {
			this.searches.push(model);
			model.set({
				visible : true,
			})
			// if there are too many searches, remove the first one
			if(this.searches.length > this.searchLength) {
				var rmArtist = this.searches.shift();
				rmArtist.set({
					checked : false,
					visible : false,
				})
				this.remove(rmArtist);
			}
		} else {
			var topPosts = this.filter(function(model) {
				return !(model.get("searchedFor") || model.get("eMuze"));
			});
			if(topPosts.length > this.topPostsLength) {
				//remove the last one
				var rmArtist = _.last(topPosts);
				rmArtist.set({
					checked : false,
					visible : false,
				})
				this.remove(rmArtist);
			}
			this.putInOrder();
		}
	},
	putInOrder : function() {
		var topPosts = this.filter(function(model) {
			return !(model.get("searchedFor") || model.get("eMuze"));
		});
		for(var i = 0; i < topPosts.length; i++) {
			//remove them all
			var post = topPosts[i];
			post.set("visible", false);
		}
		//add them back in the correct order
		for(var i = 0; i < topPosts.length; i++) {
			//remove them all
			if(i < this.topPostsLength) {
				var post = topPosts[i];
				post.set("visible", true);
			}
		}
	},
	clearSearches : function() {
		for(var i = 0; i < this.searches.length; i++) {
			var search = this.searches[i];
			search.set({
				visible : false,
				checked : false,
			});
			this.remove(search);
		}
		this.searches = [];
	},
	//returns the handle for an artist name
	getHandle : function(artist) {
		var item = this.where({
			name : artist,
		});
		return item[0].get("handle");
	},
	//performs a smart update on the list
	updateList : function(artist) {
		var listArtist = this.get(artist);
		if(!listArtist) {
			this.add(artist);
		} else {
			//update the info
			listArtist.set({
				count : artist.get("count"),
			});
		}
	}
});
