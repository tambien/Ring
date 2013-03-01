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
		"nowX" : -1000,
		"nowY" : -1000,
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
		//calculate the position
		this.getSizeFromNoteCount();
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
	},
	//sets the x and y based on the time + a little randomness
	getPositionFromTime : function() {
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
		var count = this.get("note_count");
		var size = 0;
		size = Math.log(count) * 4 + 8;
		this.set("size", size);
	},
	moved : function(){
		//it woul be cool to do a tween here
		var x = this.get("x");
		var y = this.get("y");
		//set the bounding box for touches
		RING.rtree
		
		//set the theta
		this.setTheta(x, y);
	},
	setTheta : function(x, y){
		this.theta = Math.atan2(y, x);
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
		//console.log(this.model);
		//load the photo only when it's clicked on
	},
	remove : function() {
		//remove all of the objects that were added to the scene
		RING.scene.remove(this.object);
	},
	setVisible : function(model, visible) {
		//just move it off the screen to make it invisible
		if(visible) {
			this.position(model);
		} else {
			RING.Particles.position(model, -1000, -1000);
		}
	}
})