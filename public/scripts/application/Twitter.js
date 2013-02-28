/*
 * TWEET
 *
 * parent class of both tumblr and twitter posts
 */

RING.Twitter = Backbone.Model.extend({

	defaults : {
		"id" : 0,
		"artist" : '',
		"text" : "",
		"timestamp" : 0,
		"note_count" : 0,
		"x" : 0,
		"y" : 0,
		"size" : 0,
		"visible" : false,
	},
	initialize : function(attributes, options) {
		//setup the changes
		this.on("change:timestamp", this.getPositionFromTime);
		this.on("change:note_count", this.getSizeFromNoteCount);
		//calculate the position
		this.getPositionFromTime();
		this.getSizeFromNoteCount();
		//setup the force directed stuff
		this.velocity = new THREE.Vector2(1, 1);
		this.acceleration = new THREE.Vector2(0, 0);
		this.cid = this.get("id");
		//make the view
		this.view = new RING.Twitter.View({
			model : this,
		});
	},
	//called when all of the posts are loaded in the collection
	allLoaded : function() {
		if(this.get("x") === 0 && this.get("y") === 0) {
			this.getSizeFromNoteCount();
			this.getPositionFromTime();
		}
	},
	validate : function(attributes, options) {
		//don't update the model to an out of date model
		if(attributes.timestamp < this.previous("timestamp")) {
			return false;
		}
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
		var randomRadius = RING.Util.randomFloat(380, 400);
		this.set({
			x : randomRadius * Math.cos(timeAngle),
			y : randomRadius * Math.sin(timeAngle),
		});
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count");
		var size = Math.log(count) * 4 + 8;
		this.set("size", size);
	},
});

RING.Twitter.View = Backbone.View.extend({

	className : "tumblrPost",

	events : {
		//"click #canvas" : "clicked",
	},

	initialize : function() {
		//trigger callbacks on repositioning
		this.listenTo(this.model, "change:x", this.position);
		this.listenTo(this.model, "change:y", this.position);
		this.listenTo(this.model, "change:visible", this.setVisible);
		//make the THREE.js object
		this.object = new THREE.Particle(new THREE.ParticleCanvasMaterial({
			color : Math.random() * 0x808080 + 0x808080,
			program : this.draw.bind(this),
		}));
		this.object.position.z = RING.Util.randomFloat(-.5, .5);
		this.object.scale.x = this.object.scale.y = this.model.get("size");
		this.position();
		//attach the callback when it's been clicked on
		this.object.onclick = this.clicked.bind(this);
		//the objects are initially not visible
		this.object.visible = false;
		//add it to the scene
		RING.scene.add(this.object);
	},
	createElement : function() {

	},
	position : function() {
		var x = this.model.get("x");
		var y = this.model.get("y");
		this.object.position.x = x;
		this.object.position.y = y;
	},
	draw : function(context) {
		context.beginPath();
		//context.arc(0, 0, 1, 0, PI2, false);
		context.rect(0, 0, 1, 1);
		context.closePath();
		context.fill();
	},
	clicked : function() {
		console.log(this.model);
	},
	remove : function() {
		RING.scene.remove(this.object);
	}, 
	setVisible : function(model, visible) {
		this.object.visible = visible;
	}
})