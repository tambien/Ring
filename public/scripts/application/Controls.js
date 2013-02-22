/*
 * CONTROLS
 *
 * the date range
 */

RING.Controls = Backbone.Model.extend({
	defaults : {
		//the start of SXSW
		"startTime" : new Date(2012, 2, 8),
		//right now
		"endTime" : new Date(),
		//primary/reblogs/reblogs of reblogs
		"cardinality" : 0,
		"tags" : [],
		"expanded" : true,
		"loading" : false,
	},
	initialize : function(attributes, options) {
		//get the tag collection
		this.tags = new RING.Tags();
		//listen for changes to the tags
		this.listenTo(this.tags, "change:checked", this.updateTags);
		//search whenever there has been a change
		this.on("change:tags", this.search);
		this.on("change:startTime", this.search);
		this.on("change:endTime", this.search);

		//make the views
		this.view = new RING.Controls.View({
			model : this,
		});
		this.datePicker = new RING.DatePicker({
			model : this,
		});
	},
	updateTags : function() {
		var tags = [];
		var checkedTags = this.tags.forEach(function(model) {
			if(model.get("checked")) {
				tags = tags.concat(model.get("tumblrhashtags"));
			}
		});
		this.set("tags", tags);
	},
	//retrieves the posts from the server
	search : function() {
		if(this.request&&this.request.state()==='pending'){
			this.request.abort();
		}
		this.set("loading", true);
		this.getTagsBetween(this.get("tags"), this.get("startTime").toISOString(), this.get("endTime").toISOString());
	},
	getTagsBetween : function(tags, timeFrom, timeTo) {
		if(tags.length > 0) {
			var obj = {
				type : "range",
				tags : tags,
				start : timeFrom,
				end : timeTo
			}
			var reqString = window.location + "get?" + decodeURIComponent($.param(obj));
			var self = this;
			this.request = $.ajax(reqString, {
				success : function(response) {
					console.log(response.tumblr.length)
					RING.tumblrCollection.update(response.tumblr, {
						merge : false,
					});
					RING.tumblrCollection.allLoaded();
					self.set("loading", false);
				},
				error : function() {
					
				}
			})
		} else {
			RING.tumblrCollection.update([]);
			this.set("loading", false);
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
	render : function(model){
		if (this.model.get("loading")){
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
	
	className: 'datePicker',
	
	events : {
		"slide" : "changeDate",
	},

	initialize : function() {
		this.$title = $("<div id='title'>DATE RANGE</div>").appendTo(this.$el);
		this.$slider = $("<div id='slider'></div>").appendTo(this.$el);
		this.$el.appendTo($("#controls"));
		this.render(this.model);
	},
	render : function(model){
		var now = new Date();
		var startTime = this.model.get("startTime");
		var endTime = this.model.get("endTime");
		var min = startTime.getDate() - now.getDate();
		var max = endTime.getDate() - now.getDate();
		//values[0] = 
		this.$slider.slider({
			range: true,
			min : -14, 
			max : 0,
			values: [min, max],
		});
	},
	changeDate : function(event, ui){
		var now = new Date();
		var minDate = new Date();
		var maxDate = new Date();
		minDate.setDate(now.getDate() + ui.values[0]);
		maxDate.setDate(now.getDate() + ui.values[1]);
		this.model.set({
			startTime : minDate,
			endTime : maxDate,
		});		
	}
})