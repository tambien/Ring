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
		//expanded view
		"expanded" : false,
		//loading info in the corner
		"visiblePosts" : 0,
		"loading" : 0,
		"loadingText" : "",
	},
	initialize : function(attributes, options) {
		var blue = new THREE.Color().setRGB(40 / 255, 170 / 255, 225 / 255);
		var purple = new THREE.Color().setRGB(158 / 255, 65 / 255, 195 / 255);
		var yellow = new THREE.Color().setRGB(1, 226 / 255, 31 / 255);
		var red = new THREE.Color().setRGB(1, 48 / 255, 49 / 255);
		var green = new THREE.Color().setRGB(151 / 255, 201 / 255, 76 / 255);
		this.availableColors = [blue, purple, yellow, red, green];
		this.colorPointer = 0;
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
		this.loadingScreen = new RING.LoadingScreen({
			model : this,
		});
		if(!RING.installation) {
			this.search = new RING.Search({
				model : this,
			});
		}
		//start the loading
		this.loadCache();
	},
	updateArtists : function(model, checked) {
		if(checked) {
			if(this.artists.length > 4) {
				var artist = this.artists.shift();
				this.availableColors.push(artist.get('color'));
				artist.set("checked", false);
			}
			//remove the old one before adding a new one
			model.set("color", this.availableColors.shift());
			this.setCollectionColors(model);
			this.artists.push(model);
		} else {
			//cut out the one that matches
			var index = this.artists.indexOf(model);
			if(index > -1) {
				var removed = this.artists.splice(index, 1);
				this.availableColors.push(removed[0].get("color"));
			}
		}
		this.render();
	},
	setCollectionColors : function(artist) {
		//get all of the models that have a particular artist
		var artistName = artist.get("name");
		var artistColor = artist.get("color");
		RING.tumblrCollection.forEach(function(model) {
			if(model.get("artist") === artistName) {
				model.set("color", artistColor);
			}
		})
		RING.twitterCollection.forEach(function(tweet) {
			if(tweet.get("artist") === artistName) {
				tweet.set("color", artistColor);
			}
		})
	},
	render : function() {
		var delayTime = 600;
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
				setTimeout(function(model) {
					//set it as  notvisible
					model.set("visible", false);
				}, RING.Util.randomInt(0, delayTime), model);
				continue;
			}
			//check that it's the right time range
			var modelTime = new Date(model.get("timestamp"));
			var timeMatch = (modelTime > startTime && modelTime <= endTime);
			//atempt to speed things up
			if(!timeMatch) {
				setTimeout(function(model) {
					model.set("visible", false);
				}, RING.Util.randomInt(0, delayTime), model);
				continue;
			}
			//set it as visible
			setTimeout(function(model) {
				model.set("visible", true);
				//and all it's reblogs
				model.makeReblogsVisible(reblogLevel);
			}, RING.Util.randomInt(0, delayTime), model);
		};
		var twitterModels = RING.twitterCollection.models
		for(var i = 0, len = twitterModels.length; i < len; i++) {
			var model = twitterModels[i];
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
				setTimeout(function(model) {
					//set it as not visible
					model.set("visible", false);
				}, RING.Util.randomInt(0, delayTime), model);
				continue;
			}
			//check that it's the right time range
			var modelTime = new Date(model.get("timestamp"));
			var timeMatch = (modelTime > startTime && modelTime <= endTime);
			//atempt to speed things up
			if(!timeMatch) {
				setTimeout(function(model) {
					//set it as not visible
					model.set("visible", false);
				}, RING.Util.randomInt(0, delayTime), model);
				continue;
			}
			setTimeout(function(model) {
				//set it as visible
				model.set("visible", true);
			}, RING.Util.randomInt(0, delayTime), model);
		};
		/*
		 //update the counter
		 var visibleTumblrs = RING.tumblrCollection.where({
		 "visible" : true
		 })
		 var visibleTwitter = RING.twitterCollection.where({
		 "visible" : true
		 })
		 this.set("visiblePosts", visibleTumblrs.length + visibleTwitter.length);
		 */
	},
	//this is the loading sequence for all of the info
	loadCache : function() {
		var reqString = window.location + "get?type=cache";
		var self = this;
		self.set("loadingText", "Connecting to server")
		$.ajax(reqString, {
			success : function(response) {
				var posts = response.posts;
				//increment the loading bar
				self.set("loading", self.get('loading') + 1);
				self.set("loadingText", "Fetching Artists Posts")
				//for each artist, add it to the twitter and tumblr posts
				for(var i = 0; i < posts.length; i++) {
					var post = posts[i];
					setTimeout(function(post) {
						self.set("loadingText", "Loading posts from " + post.artist.name);
						RING.tumblrCollection.addArtist(post);
						RING.twitterCollection.addArtist(post);
						//add the artist to the list also
						//make an artist
						var artist = new RING.Artist(post.artist);
						//add that artist to the collection
						self.artistList.add(artist, {
							merge : false,
						});
						//increment the loading bar
						self.set("loading", self.get('loading') + 1);
					}, i * 10, post);
				}
			},
			error : function() {
				console.error("could not get that artist");
			}
		})
	},
	loadArtists : function(artistName, callback) {
		//search the artist for the past week
		artistName = encodeURIComponent(artistName);
		var reqString = window.location + "get?type=week&artist=" + artistName;
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				if(response.artist !== null) {
					//update the tumblr and twitter collections with the results
					RING.tumblrCollection.add(response.tumblr, {
						merge : false,
					});
					RING.twitterCollection.add(response.twitter, {
						merge : false,
					});
					//gotta do all that loading bullshit
					//need to do this just on the new artists
					RING.tumblrCollection.loadArtist(artistName);
					RING.twitterCollection.loadArtist(artistName);
					//make an artist
					var artist = new RING.Artist(response.artist);
					//add that artist to the collection
					self.model.artistList.add(artist, {
						merge : false,
					});
					callback();
					//check that artist
					//artist.set("checked", true);
				}
			},
			error : function() {
				console.error("could not get that artist");
			}
		})
	},
});

RING.Controls.View = Backbone.View.extend({

	className : 'controls',

	initialize : function() {
		this.setElement($("#controls"));
		this.$loading = $("<div id=loading>LOADING</div>").appendTo(this.$el);
		//the show/hide button
		this.$revealButton = $("<div id='revealButton'><span class='titleText'>SHOW OPTIONS</span></div>").appendTo($("#container"));
		this.$revealButton.click(this.changeExpand.bind(this));
		//the data display
		this.$dateRange = $("#dateRange");
		this.$reblogLevel = $("#reblogDisplay");
		this.$visiblePosts = $("#visiblePosts");
		//this.$dateRange = $().appendTo(this.$dataDisplay);
		//listen for changes
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:expanded", this.expand);
		this.render(this.model);
		//make the emuze link for web version only
		if(!RING.installation) {
			this.$visitEmuze = $("<div id='visitEmuze'><span class='titleText'>VISIT EMUZE</span></div>").insertAfter($("#controls"));
			this.$visitEmuze.click(function() {
				window.open("http://www.emuze.com", '_blank');
			});
		}
	},
	render : function(model) {
		/*
		if(this.model.get("loading") > 0) {
		this.$loading.show(0);
		} else {
		this.$loading.hide(0);
		}
		*/
		//set the date range stuff
		var startTime = this.model.get("startTime");
		var endTime = this.model.get("endTime");
		var startText = startTime.getMonthName() + " " + startTime.getDate();
		var endText = endTime.getMonthName() + " " + endTime.getDate();
		//show the reblogs shown
		var reblogLevel = this.model.get("reblogLevel");
		switch(reblogLevel) {
			case 0:
				this.$reblogLevel.html("<span class='titleText'>DISPLAYING:</span><span class='titleText purpleText'>PRIMARY POSTS</span>");
				break;
			case 1:
				this.$reblogLevel.html("<span class='titleText'>DISPLAYING:</span><span class='titleText purpleText'>PRIMARY POSTS</span><span class='titleText'>AND</span><span class='titleText purpleText'>REBLOGS</span>");
				break;
			case 2:
				this.$reblogLevel.html("<span class='titleText'>DISPLAYING:</span><span class='titleText purpleText'>PRIMARY POSTS</span><span class='titleText'>AND</span><span class='titleText purpleText'>REBLOGS OF REBLOGS</span>");
				break;
		}
		var visiblePosts = this.model.get("visiblePosts");
		this.$visiblePosts.html(visiblePosts);

		this.$dateRange.html(startText + " TO " + endText);
	},
	changeExpand : function() {
		this.model.set("expanded", !this.model.get("expanded"));
	},
	expand : function(model, expand) {
		var time = 500;
		var width = "400px";
		var height = "580px";
		var self = this;
		if(expand) {
			//first expand the y direction
			this.$el.css({
				width : "5px"
			})
			//shrink the emuze visit button
			if(!RING.installation) {
				$("#visitEmuze").hide(time / 2, function() {
					self.$el.transition({
						height : height
					}, time, function() {
						$(this).transition({
							width : width,
						}, time, function() {
							//rerender when opened
							self.render();
							self.model.datePicker.render();
							self.model.reblogLevel.render();
						});
					});
				});
			} else {
				this.$el.transition({
					height : height
				}, time, function() {
					$(this).transition({
						width : width,
					}, time, function() {
						//rerender when opened
						self.render();
						self.model.datePicker.render();
						self.model.reblogLevel.render();
					});
				});
			}
			this.$revealButton.find("span").html("HIDE OPTIONS");
		} else {
			//first shrink the in x direction then y
			this.$el.stop().transition({
				width : "5px"
			}, time, function() {
				$(this).transition({
					height : "0px"
				}, time, function() {
					//reopen the emuze visit button
					if(!RING.installation) {
						$("#visitEmuze").show(time / 2)
					}
				});
			});
			this.$revealButton.find("span").html("SHOW OPTIONS")
		}
	},
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
		this.$title = $("<div id='title' class='titleText'>DATE RANGE</div>").appendTo(this.$el);
		this.$slider = $("<div id='slider'></div>").appendTo(this.$el);
		this.$range = $("<div id='range'></div>").appendTo(this.$slider);
		this.$el.appendTo($("#controls"));
		this.listenTo(this.model, "change:startTime", this.render);
		this.listenTo(this.model, "change:endTime", this.render);
		this.$dots = []
		//make the dots
		for(var i = 0; i <= 6; i++) {
			var left = (100 / 6) * i;
			var dot = $("<div class='dot'></div>").appendTo(this.$slider);
			dot.css({
				left : left + "%",
			})
			this.$dots.push(dot);
		}
		//make the dates
		this.$dates = [];
		for(var i = 0; i <= 7; i++) {
			var left = (100 / 6) * i;
			var dot = $("<div class='date'>0</div>").appendTo(this.$slider);
			dot.css({
				left : left + "%",
			})
			this.$dates.push(dot);
		}
		this.render(this.model);
	},
	render : function(model) {
		var now = new Date();
		var startTime = this.model.get("startTime");
		var endTime = this.model.get("endTime");
		var dayInMS = 60 * 1000 * 60 * 24;
		var min = Math.ceil((startTime - now) / dayInMS);
		var max = Math.ceil((endTime - now) / dayInMS);
		this.$slider.slider({
			range : true,
			min : -6,
			max : 0,
			values : [min, max],
		});
		var range = this.$el.find(".ui-slider-range");
		var left = range.css('left');
		var width = range.css('width');
		this.$range.css({
			left : left,
			width : width,
		});
		left = parseInt(left);
		width = parseInt(width);
		var right = left + width;
		for(var i = 0; i < this.$dots.length; i++) {
			var dot = this.$dots[i];
			var position = dot.css('left');
			position = parseInt(position);
			if(position >= left && position <= right) {
				dot.css({
					"background-color" : "#9E41C3"
				})
			} else {
				dot.css({
					"background-color" : "#fff"
				})
			}
		}
		for(var i = 0; i < this.$dates.length; i++) {
			var dot = this.$dates[i];
			var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (i - 6));
			var monthNum = date.getMonth() + 1;
			var day = date.getDate();
			dot.html(monthNum + "/" + day);
		}
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
		this.listenTo(this.model, "change:reblogLevel", this.render);
		this.$title = $("<div id='title' class='titleText'>REBLOG LEVEL</div>").appendTo(this.$el);
		$("<div id='notes'><div id='primary'>PRIMARY</div><div id='reblogs'>REBLOGS</div><div id='reblogreblogs'>REBLOGS OF REBLOGS</div></div>").appendTo(this.$el);
		this.$slider = $("<div id='slider'></div>").appendTo(this.$el);
		this.$range = $("<div id='range'></div>").appendTo(this.$slider);
		this.$el.appendTo($("#controls"));
		//make the dots
		this.$dots = []
		//make the dots
		for(var i = 0; i <= 2; i++) {
			var left = (100 / 2) * i;
			var dot = $("<div class='dot'></div>").appendTo(this.$slider);
			dot.css({
				left : left + "%",
			})
			this.$dots.push(dot);
		}
		this.render(this.model);
	},
	render : function(model) {
		var val = this.model.get("reblogLevel");
		this.$slider.slider({
			min : 0,
			max : 2,
			value : val,
			range : "min"
		});
		//the range stuff
		var range = this.$el.find(".ui-slider-range");
		var left = range.css('left');
		var width = range.css('width');
		this.$range.css({
			left : left,
			width : width,
		});
		left = parseInt(left);
		width = parseInt(width);
		var right = left + width;
		for(var i = 0; i < this.$dots.length; i++) {
			var dot = this.$dots[i];
			var position = dot.css('left');
			position = parseInt(position);
			if(position >= left && position <= right) {
				dot.css({
					"background-color" : "#9E41C3"
				})
			} else {
				dot.css({
					"background-color" : "#fff"
				})
			}
		}
	},
	changeVisibility : function(event, ui) {
		this.model.set("reblogLevel", ui.value);
	}
});

RING.Search = Backbone.View.extend({

	className : "search",

	events : {
		"click #button" : "searchArtist"
	},

	initialize : function() {
		this.$title = $("<div id='title' class='titleText'>SEARCH FOR AN ARTIST</div>").appendTo(this.$el);
		this.$search = $("<input class='titleText' id='search'/>").appendTo(this.$el);
		this.$button = $("<div class='titleText' id='button'>SEARCH</div>").appendTo(this.$el);
		this.$el.insertAfter($("#tags"));
		this.getAutoCompleteList();
	},
	getAutoCompleteList : function(model) {
		var reqString = window.location + "get?type=artists";
		var self = this;
		$.ajax(reqString, {
			success : function(response) {
				console.log('got auto complete');
				self.addAutoComplete(response);
			},
			error : function() {
				console.error("could not get autocomplete list");
			}
		})
	},
	addAutoComplete : function(list) {
		this.$search.autocomplete({
			source : list
		});
	},
	searchArtist : function() {
		//get the artist from the search box
		var artistName = this.$search.val();
		//if the artist is already in the list, check it
		var found = this.model.artistList.where({
			name : artistName,
		});
		if(found.length > 0) {
			found[0].set("checked", true);
		} else {
			//search the artist for the past week
			artistName = encodeURIComponent(artistName);
			var reqString = window.location + "get?type=week&artist=" + artistName;
			var self = this;
			$.ajax(reqString, {
				success : function(response) {
					console.log('got artist');
					if(response.artist !== null) {
						//update the tumblr and twitter collections with the results
						RING.tumblrCollection.add(response.tumblr, {
							merge : false,
						});
						RING.twitterCollection.add(response.twitter, {
							merge : false,
						});
						//gotta do all that loading bullshit
						//need to do this just on the new artists
						RING.tumblrCollection.loadArtist(artistName);
						RING.twitterCollection.loadArtist(artistName);
						//make an artist
						var artist = new RING.Artist(response.artist);
						//add that artist to the collection
						self.model.artistList.add(artist, {
							merge : false,
						});
						callback();
						//check that artist
						//artist.set("checked", true);
					}
				},
				error : function() {
					console.error("could not get that artist");
				}
			})
		}
	}
})

RING.LoadingScreen = Backbone.View.extend({

	className : "loadingScreen",

	events : {
		"click .loaded" : "begin",
	},

	initialize : function() {
		this.$loadingArea = $("#loadedArea");
		this.$loadingText = $("#loadingText");
		this.setElement($("#loadingBar"));
		this.listenTo(this.model, "change:loadingText", this.updateText);
		this.listenTo(this.model, "change:loading", this.updateProgress);
	},
	updateText : function(model, text) {
		this.$loadingText.html(text);
	},
	updateProgress : function(model, loadedCount) {
		var total = 1;
		if(RING.installation) {
			total = 15;
		} else {
			total = 15;
		}
		var percentage = Math.round((loadedCount / total) * 100);
		percentage += "%";
		this.$loadingArea.css({
			width : percentage,
		});
		//turn the bar into a next button
		if(percentage === "100%") {
			//it's done loading
			this.updateText(this.model, "BEGIN");
			this.$el.addClass("begin").transition({
				width : "126px",
			}, 200).click(this.begin.bind(this));
		}
	},
	begin : function() {
		$("#loadingScreen").transition({
			width : "0px"
		}, 200, function() {
			$(this).css({
				"z-index" : -1000,
			})
		})
	}
});

Date.prototype.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

Date.prototype.getMonthName = function() {
	return this.monthNames[this.getMonth()];
};
