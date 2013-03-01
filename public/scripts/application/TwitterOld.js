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
		//set the position initially
		this.setPosition();
		//set the size and create the view
		this.getSizeFromNoteCount();
		//make the view
		this.view = new RING.Twitter.View({
			model : this,
		});
	},
	//called when a model is removed from the collection
	remove : function() {
		this.view.remove();
	},
	//sets the x and y based on the time + a little randomness
	setPosition : function() {
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

	className : "post",

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
			color : 0xffffff,
			program : this.draw.bind(this),
		}));
		this.object.position.z = RING.Util.randomFloat(-.5, .5);
		//this.object.position.z = this.model.get("size")*10;
		this.object.scale.x = this.object.scale.y = this.model.get("size");
		//rotate it a random amount
		this.object.rotation.z = RING.Util.randomFloat(0, Math.PI / 2);
		this.position();
		//attach the callback when it's been clicked on
		this.object.onclick = this.clicked.bind(this);
		this.createElement();
	},
	createElement : function() {
		var handle = RING.controls.artistList.getHandle(this.model.get("artist"));
		this.$title = $("<div id='title'> @" + handle + "</div>").appendTo(this.$el);
		var text = this.model.get("text");
		this.$text = $("<div id='text'>" + text + "</div>").appendTo(this.$el);
		this.$notes = $("<div id='reblogs'>retweets: " + this.model.get("note_count") + "</div>").appendTo(this.$el);
	},
	setColor : function(color) {
		this.object.material.color.setRGB(color[0] / 255, color[1] / 255, color[2] / 255);
	},
	position : function() {
		var x = this.model.get("x");
		var y = this.model.get("y");
		this.object.position.x = x;
		this.object.position.y = y;
	},
	draw : function(context) {
		var side = .707;
		context.beginPath();
		context.moveTo(-side, -side / 2);
		context.lineTo(-side, side / 2);
		context.lineTo(-side / 2, side);
		context.lineTo(side / 2, side);
		context.lineTo(side, side / 2);
		context.lineTo(side, -side / 2);
		context.lineTo(side / 2, -side);
		context.lineTo(-side / 2, -side);
		context.lineTo(-side, -side / 2);
		context.closePath();
		context.fill();
	},
	clicked : function() {
		var width = RING.width, height = RING.height;
		var widthHalf = width / 2, heightHalf = height / 2;

		var projector = new THREE.Projector();
		var vector = projector.projectVector(this.object.matrixWorld.getPosition().clone(), RING.camera);

		vector.x = (vector.x * widthHalf ) + widthHalf;
		vector.y = -(vector.y * heightHalf ) + heightHalf;
		var css = {	};
		if(this.model.get("x") > 0) {
			css.left = RING.Util.toInt(vector.x) - 250;
		} else {
			css.left = RING.Util.toInt(vector.x);
		}
		if(this.model.get("y") > 0) {
			css.top = RING.Util.toInt(vector.y);
		} else {
			css.top = RING.Util.toInt(vector.y) - 250;
		}
		this.$el.appendTo($("#container")).css(css);
	},
	remove : function() {
		RING.scene.remove(this.object);
	},
	setVisible : function(model, visible) {
		if(visible) {
			//add it to the scene
			RING.scene.add(this.object);
		} else {
			RING.scene.remove(this.object);
		}

	}
})