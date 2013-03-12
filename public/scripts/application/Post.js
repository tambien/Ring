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
		"radius" : 0,
		"theta" : 0,
		"size" : 0,
		//displaying
		"visible" : false,
		//ParticleSystemStuff
		"particleIndex" : 0,
		"style" : 'circle',
		"color" : new THREE.Color(0xffffff),
	},

	superInit : function(attributes, options) {
		//set the radius initially
		this.set("radius", RING.Util.randomFloat(350, 420));
		//when the note count changes, update the size
		this.on("change:note_count", this.getSizeFromNoteCount);
		//calculate the position
		this.getSizeFromNoteCount();
		//the cid
		this.cid = this.get("id");
	},
	//called when all of the posts are loaded in the collection
	superLoaded : function() {
		this.getInitialPosition();
	},
	//called when a model is removed from the collection
	remove : function() {
		this.view.remove();
	},
	//take all of the things off of the screen
	removeAll : function() {
		if(this.line) {
			RING.scene.remove(this.line);
		}
		//put hte particle off of the screen
		RING.Particles.positionInstant(this, this.get("x") > 0 ? 10000 : -10000, this.get("y") > 0 ? 10000 : -10000);
	},
	getInitialPosition : function() {
		//the 360 degrees is from the startTime to the endTime
		var startTime = RING.controls.get("startTime");
		var endTime = RING.controls.get("endTime");
		var timestamp = new Date(this.get("timestamp")) - 0;
		//the timeline length
		var duration = endTime - startTime;

		if(duration > 0) {
			var position = (timestamp - startTime) / duration;
			var angle = position * Math.PI * 2 + Math.PI / 2;
			angle = (angle + Math.PI * 2) % (Math.PI * 2);
			this.theta = angle;
			this.set("theta", angle);
			var radius = this.get("radius");
			this.set({
				x : radius * Math.cos(angle),
				y : radius * Math.sin(angle),
				theta : angle,
			});
		}
	},
	//sets the x and y based on the time + a little randomness
	getPositionFromTime : function() {
		if(this.get("visible")) {
			//the 360 degrees is from the startTime to the endTime
			var startTime = RING.controls.get("startTime");
			var endTime = RING.controls.get("endTime");
			var timestamp = new Date(this.get("timestamp")) - 0;
			//the timeline length
			var duration = endTime - startTime;

			if(duration > 0) {
				var position = (timestamp - startTime) / duration;
				var angle = position * Math.PI * 2 + Math.PI / 2;
				this.theta = angle;
				this.set("theta", angle);
				var radius = this.get("radius");
				this.set({
					x : radius * Math.cos(angle),
					y : radius * Math.sin(angle),
					theta : angle,
				});
			}
		}
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count") / 10 + 1;
		var size = 0;
		size = Math.log(count) * 20 + 5;
		this.set("size", size);
	},
	setTheta : function(x, y) {
		this.theta = Math.atan2(y, x);
		this.set("theta", this.theta);
		this.set("radius", Math.sqrt(x * x + y * y));
	},
	clicked : function(x, y) {
		//position the element relative to the click
		this.view.createElement();
		this.view.$el.appendTo($("#container"));
		this.view.positionElement(x, y);
		//console.log(this);
	},
});

RING.Post.View = Backbone.View.extend({

	className : "post",

	superInit : function() {
		//trigger callbacks on repositioning
		var throttledPosition = _.throttle(this.position, 500);
		this.listenTo(this.model, "change:x", throttledPosition);
		this.listenTo(this.model, "change:y", throttledPosition);
		this.listenTo(this.model, "change:color", this.setColor);
		this.listenTo(this.model, "change:size", this.setSize);
		this.listenTo(this.model, "change:visible", this.setVisible);
		//get the particle from the particle system
		this.particle = RING.Particles.get(this.model);
		RING.Particles.updateSize(this.model);
		//set the posiiton initially
		//make the contianer
		this.$container = $("<div class='container'></div>").appendTo(this.$el);
	},
	createElement : function() {

	},
	position : function(model) {
		if(model.get('visible')) {
			RING.Particles.position(model, model.get("x"), model.get("y"));
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
		//RING.scene.remove(this.object);
	},
	setVisible : function(model, visible) {
		var self = this;
		//setTimeout(function(model) {
		//just move it off the screen to make it invisible
		if(visible) {
			RING.controls.set("visiblePosts", RING.controls.get("visiblePosts") + 1, {
				silent : false,
			})
			if(model.origin) {

				setTimeout(function() {
					RING.Particles.positionInstant(model, model.origin.get("x"), model.origin.get("y"));
					self.position(model, model.get("x"), model.get("y"));
				}, 800);
			} else {
				RING.Particles.positionInstant(model, model.get("x") > 0 ? 10000 : -10000, model.get("y") > 0 ? 10000 : -10000);
				self.position(model, model.get("x"), model.get("y"));
			}
		} else {
			RING.controls.set("visiblePosts", RING.controls.get("visiblePosts") - 1, {
				silent : false,
			});
			RING.Particles.position(model, model.get("x") > 0 ? 10000 : -10000, model.get("y") > 0 ? 10000 : -10000);
		}
		//}, RING.Util.randomInt(0, 600), model);
	},
	positionElement : function(x, y) {
		var elCss = {	};
		var containerCss = {};
		//remove all of the classes
		this.$el.find(".pointer").remove();
		var posX = this.model.get("x");
		var posY = this.model.get("y");
		var paddingSide = "0px"
		var paddingTop = "0px"
		if(posX > 0 && posY > 0) {
			elCss.left = RING.Util.toInt(x) - 280;
			elCss.top = RING.Util.toInt(y);
			containerCss.right = paddingSide;
			containerCss.top = paddingTop;
			containerCss.left = "";
			containerCss.bottom = "";
			$(".top_right").clone().appendTo(this.$el);
		} else if(posX > 0 && posY < 0) {
			elCss.left = RING.Util.toInt(x) - 280;
			elCss.top = RING.Util.toInt(y) - 500;
			containerCss.right = paddingSide;
			containerCss.bottom = paddingTop;
			containerCss.top = "";
			containerCss.left = "";
			$(".bottom_right").clone().appendTo(this.$el);
		} else if(posX < 0 && posY > 0) {
			elCss.left = RING.Util.toInt(x);
			elCss.top = RING.Util.toInt(y);
			containerCss.left = paddingSide;
			containerCss.top = paddingTop;
			containerCss.bottom = "";
			containerCss.right = "";
			$(".top_left").clone().appendTo(this.$el);
		} else if(posX < 0 && posY < 0) {
			elCss.left = RING.Util.toInt(x);
			elCss.top = RING.Util.toInt(y) - 500;
			containerCss.bottom = paddingTop;
			containerCss.left = paddingSide;
			containerCss.right = "";
			containerCss.top = "";
			$(".bottom_left").clone().appendTo(this.$el);
		}
		this.$el.css(elCss);
		this.$container.css(containerCss);
		//position the highlight
		RING.highlight.position.x = this.model.get("x");
		RING.highlight.position.y = this.model.get("y");
		RING.highlight.scale.x = this.model.get("size") * 1.6;
		RING.highlight.scale.y = this.model.get("size") * 1.6;
	},
})