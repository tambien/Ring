/*
 * POST
 *
 * parent class of both tumblr and twitter posts
 */

RING.Post = Backbone.Model.extend({

	defaults : {
		//shared post attributes
		"id" : 0,
		"artist" : '',
		"text" : "",
		"timestamp" : 0,
		"note_count" : 0,
		//position and size
		"x" : 0,
		"y" : 0,
		"size" : 0,
		//displaying
		"visible" : false,
		//ParticleSystemStuff
		"particleIndex" : 0,
		"style" : 'circle',
		"color" : new THREE.Color(0xffffff),
	},

	superInit : function(attributes, options) {
		this.on("change:x", this.moved);
		this.on("change:y", this.moved);
		this.on("change:visible", this.changeVisible);
		//this.listenTo(RING.controls, "change:startTime", this.getPositionFromTime);
		//this.listenTo(RING.controls, "change:endTime", this.getPositionFromTime);
		//calculate the position
		this.getSizeFromNoteCount();
		this.setBoundingBox();
		//the cid
		this.cid = this.get("id");
	},
	//called when all of the posts are loaded in the collection
	superLoaded : function() {
		this.getPositionFromTime();
	},
	//called when a model is removed from the collection
	remove : function() {
		this.view.remove();
		if(this.boundingBox) {
			//remove the previous object from the rtree
			RING.rtree.remove(this.boundingBox, this);
		}
	},
	setBoundingBox : function() {
		var size = this.get("size");
		var x = this.get("x");
		var y = this.get("y");
		this.boundingBox = {
			x : x - (size / 2),
			y : y - (size / 2),
			w : size,
			h : size,
		}
	},
	updateRTreePosition : function() {
		if(this.get('visible')) {
			console.log('here')
			if(this.boundingBox) {
				//remove the previous object from the rtree
				RING.rtree.remove(this.boundingBox, this);
			}
			this.setBoundingBox();
			RING.rtree.insert(this.boundingBox, this);
		}
	},
	//set initial position
	setInitialPosition : function() {
		//the 360 degrees is from the startTime to the endTime
		var startTime = RING.controls.get("startTime");
		var endTime = RING.controls.get("endTime");
		var timestamp = new Date(this.get("timestamp"));
		//the timeline length
		var duration = endTime - startTime;
		var position = (endTime - timestamp) / duration;

		var angle = position * Math.PI * 2;

		this.theta = angle;

		var randomRadius = RING.Util.randomFloat(350, 420);

		this.set({
			x : randomRadius * Math.cos(angle),
			y : randomRadius * Math.sin(angle),
		});
	},
	//sets the x and y based on the time + a little randomness
	/*
	getPositionFromTime : function() {
	if(this.get("visible")) {
	//the 360 degrees is from the startTime to the endTime
	var startTime = RING.controls.get("startTime");
	var endTime = RING.controls.get("endTime");
	var timestamp = new Date(this.get("timestamp"));
	//the timeline length
	var duration = endTime - startTime;
	var position = (endTime - timestamp) / duration;

	var angle = position * Math.PI * 2;

	this.theta = angle;

	var randomRadius = RING.Util.randomFloat(350, 420);

	this.set({
	x : randomRadius * Math.cos(angle),
	y : randomRadius * Math.sin(angle),
	});
	}
	},
	*/
	//sets the x and y based on the time + a little randomness
	getPositionFromTime : function() {
		//the 360 degrees is from the startTime to the endTime
		var startTime = RING.controls.get("startTime");
		var endTime = RING.controls.get("endTimeTime");
		//var position =

		var timestamp = this.get("timestamp");
		var date = new Date(timestamp);
		var hoursAngle = Math.PI * 2 * (date.getHours() / 24);
		var minutesAngle = (Math.PI / 12) * (date.getMinutes() / 60);
		var timeAngle = hoursAngle + minutesAngle;
		var randomRadius = RING.Util.randomFloat(350, 420);
		this.set({
			x : randomRadius * Math.cos(timeAngle),
			y : randomRadius * Math.sin(timeAngle),
		});
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count") + 1;
		var size = 0;
		size = Math.log(count) * 4 + 8;
		this.set("size", size);
	},
	moved : function() {
		//it woul be cool to do a tween here
		var x = this.get("x");
		var y = this.get("y");
		this.setTheta(x, y);
		//update the rtree position
		this.updateRTreePosition();
	},
	setTheta : function(x, y) {
		this.theta = Math.atan2(y, x);
	},
	changeVisible : function(model, visible) {
		if(visible) {
			//add it to the rtree
			this.setBoundingBox();
			RING.rtree.insert(this.boundingBox, this);
		} else {
			//otherwise remove it from the rtree
			if(this.boundingBox) {
				//remove the previous object from the rtree
				RING.rtree.remove(this.boundingBox, this);
			}

		}
	},
	clicked : function(x, y) {
		//position the element relative to the click
		this.view.createElement();
		this.view.$el.appendTo($("#container"));
		this.view.positionElement(x, y);
	}
});

RING.Post.View = Backbone.View.extend({

	className : "post",

	superInit : function() {
		//trigger callbacks on repositioning
		this.listenTo(this.model, "change:x", this.position);
		this.listenTo(this.model, "change:y", this.position);
		this.listenTo(this.model, "change:color", this.setColor);
		this.listenTo(this.model, "change:size", this.setSize);
		this.listenTo(this.model, "change:visible", this.setVisible);
		//get the particle from the particle system
		this.particle = RING.Particles.get(this.model);
		RING.Particles.updateSize(this.model);
		//set the posiiton initially
		//this.position();
	},
	createElement : function() {

	},
	position : function(model) {
		if(model.get('visible')) {
			RING.Particles.updatePosition(model);
		}
	},
	setSize : function(model, size) {
		RING.Particles.updateSize(model);
	},
	setColor : function(model) {
		RING.Particles.updateColor(model);
	},
	clicked : function() {
		//load the photo only when it's clicked on
	},
	remove : function() {
		//remove all of the objects that were added to the scene
		RING.scene.remove(this.object);
	},
	setVisible : function(model, visible) {
		var self = this;
		setTimeout(function(model) {
			//just move it off the screen to make it invisible
			if(visible) {
				RING.controls.set("visiblePosts", RING.controls.get("visiblePosts") + 1, {
					silent : false,
				})
				self.position(model);
			} else {
				RING.controls.set("visiblePosts", RING.controls.get("visiblePosts") - 1, {
					silent : false,
				})
				RING.Particles.position(model, -1000, -1000);
			}
		}, RING.Util.randomInt(0, 600), model);
	},
	positionElement : function(x, y) {
		var css = {	};
		if(this.model.get("x") > 0) {
			css.left = RING.Util.toInt(x) - 250;
		} else {
			css.left = RING.Util.toInt(x);
		}
		if(this.model.get("y") > 0) {
			css.top = RING.Util.toInt(y);
		} else {
			css.top = RING.Util.toInt(y) - 250;
		}
		this.$el.css(css);
	}
})