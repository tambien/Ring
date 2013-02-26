/*
 * TUMBLR
 *
 * each unit represents a post
 */

RING.Tumblr = Backbone.Model.extend({

	defaults : {
		"id" : 0,
		"blog_name" : "",
		"photo" : "",
		"url" : "",
		"artist" : '',
		"reblogs" : [],
		"text" : "",
		"timestamp" : 0,
		"note_count" : 0,
		"x" : 0,
		"y" : 0,
		"size" : 0,
		"reblog" : false,
	},
	initialize : function(attributes, options) {
		//setup the changes
		this.on("change:timestamp", this.getPositionFromTime);
		this.on("change:note_count", this.getSizeFromNoteCount);
		this.on("change:x", this.updateRTreePosition);
		this.on("change:y", this.updateRTreePosition);
		this.on("change:size", this.updateRTreePosition);
		//calculate the position
		this.getSizeFromNoteCount();
		//setup the force directed stuff
		this.velocity = new THREE.Vector2(1, 1);
		this.acceleration = new THREE.Vector2(0, 0);
		this.cid = this.get("id");
		//make the view
		this.view = new RING.Tumblr.View({
			model : this,
		});
	},
	//called when all of the posts are loaded in the collection
	allLoaded : function() {
		if(this.get("x") === 0 && this.get("y") === 0) {
			this.getSizeFromNoteCount();
			this.getPositionFromTime();
			//this.view.drawEdgesToReblogs();
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
		if(!this.get("reblog")) {
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
			this.positionReblogs(timeAngle, randomRadius);
		}
	},
	positionReblogs : function(origAngle, origRadius) {
		//position the reblogs also
		var x = this.get("x");
		var y = this.get("y");
		_.each(this.get("reblogs"), function(reblogId, index, array) {
			var reblog = RING.tumblrCollection.get(reblogId.reblog_id);
			var angle = origAngle + RING.Util.scale(index, 0, array.length, 0, 1);
			var radius = origRadius + 100;
			reblog.set({
				x : 100 * Math.cos(angle) + x,
				y : 100 * Math.sin(angle) + y,
			});
			reblog.positionReblogs(angle, radius)
		});
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count");
		var size = 0;
		if(!this.get("reblog")) {
			size = Math.log(count) * 4 + 8;
		} else {
			var reblogs = this.get("reblogs").length;
			size = Math.log(count) + 12 + reblogs;
		}
		this.set("size", size);
	},
	//RTREE////////////////////////////////////////////////////////////////////
	setBoundingBox : function() {
		var size = this.get("size");
		var x = this.get("x");
		var y = this.get("y");
		this.boundingBox = {
			x : x - size / 2,
			y : y - size / 2,
			w : size,
			h : size,
		}
	},
	updateRTreePosition : function() {
		if(this.boundingBox) {
			//remove the previous object from the rtree
			RING.rtree.remove(this.boundingBox, this);
		}
		this.setBoundingBox();
		RING.rtree.insert(this.boundingBox, this);
	},
	//FORCE-DIRECTED///////////////////////////////////////////////////////////
	applyPhysics : function() {
		//if(this.totalEnergy() > .01) {
		this.applyHookesLaw();
		this.applyCoulombsLaw();
		//}

	},
	applyHookesLaw : function() {
		//apply to each of the edges going to the reblogs
		var reblogs = this.get("reblogs");
		var position = new THREE.Vector2(this.get('x'), this.get('y'));
		var springLength = 120;
		var stiffness = 5;
		for(var i = 0; i < reblogs.length; i++) {
			var reblog = RING.tumblrCollection.get(reblogs[i].reblog_id);
			if(reblog) {
				var reblogPosition = new THREE.Vector2(reblog.get('x'), reblog.get('y'));
				var d = reblogPosition.sub(position);
				// the direction of the spring
				var magnitude = d.length();
				var displacement = springLength - magnitude;
				//normalize
				var direction = d.normalize();
				//var displacement = spring.length - d.magnitude();
				//var direction = d.normalise();
				var force = direction.multiplyScalar(stiffness * displacement);
				// apply force to each end point
				//this.applyForce(force.negate());
				reblog.applyForce(force);
			}
		}
	},
	applyForce : function(force) {
		var mass = this.get("size") * 100;
		this.acceleration = this.acceleration.add(force.divideScalar(mass));
	},
	updateVelocity : function() {
		var dampening = .5;
		this.velocity = this.velocity.add(this.acceleration).multiplyScalar(dampening);
		this.acceleration = new THREE.Vector2(0, 0);
	},
	updatePosition : function() {
		if(this.get("reblog")) {
			var x = this.get("x") + this.velocity.x;
			var y = this.get("y") + this.velocity.y;
			this.set({
				x : x,
				y : y,
			});
		}
	},
	applyCoulombsLaw : function() {
		if(this.get("reblog")) {
			//get nearby nodes from the rtree (searching 8 times the size of the object)
			var size = this.get("size");
			var repulsion = 1000 * size;
			//var repulsion = 400;
			var padding = 1;
			var boundingBox = {
				x : this.get("x") - size * padding,
				y : this.get("y") - size * padding,
				w : size * padding,
				h : size * padding,
			}
			var neighbors = RING.rtree.search(boundingBox);
			var position = new THREE.Vector2(this.get('x'), this.get('y'));
			for(var i = 0; i < neighbors.length; i++) {
				var neighbor = neighbors[i];
				if(this.cid !== neighbor.cid) {
					var neighborPosition = new THREE.Vector2(neighbor.get('x'), neighbor.get('y'));
					var d = position.sub(neighborPosition);
					var distance = d.length() + .1;
					var direction = d.normalize();

					// apply force to each end point
					var force = direction.multiplyScalar(repulsion).divideScalar(distance);
					neighbor.applyForce(force.multiplyScalar(-.5));
					this.applyForce(force.multiplyScalar(5));
				}
			}
		}
	},
	pushOutward : function() {
		var center = new THREE.Vector2(0, 0);
		var position = new THREE.Vector2(this.get('x'), this.get('y'));
		var force = position.sub(center).normalize().multiplyScalar(50000);
		this.applyForce(force)
	},
	// Calculate the kinetic energy of the model
	totalEnergy : function() {
		var mass = this.get("size");
		var speed = this.velocity.length();
		var energy = speed * speed * mass * 0.5;
		return energy;
	},
});

var PI2 = 2 * Math.PI;

RING.Tumblr.View = Backbone.View.extend({

	className : "tumblrPost",

	events : {
		//"click #canvas" : "clicked",
	},

	initialize : function() {
		//trigger callbacks on repositioning
		this.listenTo(this.model, "change:x", this.position);
		this.listenTo(this.model, "change:y", this.position);
		//make the THREE.js object
		//var material = new THREE.ParticleBasicMaterial( { map: new THREE.Texture( generateSprite() ), blending: THREE.AdditiveBlending } );
		//var texture = THREE.ImageUtils.loadTexture('./images/circle.png');
		//var geometry = new THREE.CircleGeometry(1, 10);
		/*
		 var t = THREE.ImageUtils.loadTexture('./images/whitecircle.png');
		 var material = new THREE.SpriteMaterial({
		 map : t,
		 useScreenCoordinates : false,
		 color : 0xffffff,
		 });
		 this.object = new THREE.Sprite(material);
		 */
		this.object = new THREE.Particle(new THREE.ParticleCanvasMaterial({
			color : Math.random() * 0x808080 + 0x808080,
			program : this.draw.bind(this),
		}));
		this.object.position.z = RING.Util.randomFloat(-.5, .5);
		this.object.scale.x = this.object.scale.y = this.model.get("size");
		//the center is the vector which floats above the circle's center
		this.lineCenter = this.object.position.clone().setZ(1);
		this.position();
		//attach the callback when it's been clicked on
		this.object.onclick = this.clicked.bind(this);
		//add it to the scene
		RING.scene.add(this.object);
		//array of lines that connect reblogs
		this.lines = [];
	},
	createElement : function() {

	},
	position : function() {
		var x = this.model.get("x");
		var y = this.model.get("y");
		this.object.position.x = x;
		this.object.position.y = y;
		this.lineCenter.x = x;
		this.lineCenter.y = y;
	},
	draw : function(context) {
		//if(!this.model.get("reblog")) {
		context.beginPath();
		context.arc(0, 0, 1, 0, PI2, false);
		context.closePath();
		context.fill();
		//}

	},
	drawCanvas : function() {
		var canvas = document.createElement('canvas');
		var radius = 25;
		canvas.width = radius * 2;
		canvas.height = radius * 2;

		var context = canvas.getContext('2d');
		context.beginPath();
		context.arc(radius, radius, radius, 0, PI2, false);
		context.closePath();
		context.fillStyle = "#f00"
		context.fill();

		return canvas;
	},
	//draw edges to the connected reposts
	drawEdgesToReblogs : function() {
		//if there are already lines, don't draw some more
		if(this.lines.length === 0) {
			var reblogs = this.model.get("reblogs");
			for(var i = 0; i < reblogs.length; i++) {
				var reblog = RING.tumblrCollection.get(reblogs[i].reblog_id);
				if(reblog) {
					var geometry = new THREE.Geometry();
					geometry.vertices.push(this.lineCenter);
					geometry.vertices.push(reblog.view.lineCenter);
					var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
						color : 0xffffff,
						opacity : .5,
						linewidth : 1.5,
					}));
					RING.scene.add(line);
					this.lines.push(line);
				}
			}
		}
	},
	clicked : function() {
		console.log(this.model);
		//for(var i = 0; i < 100; i++) {
		this.model.applyCoulombsLaw();
		//this.model.applyHookesLaw();
		//}
	},
	remove : function() {
		//remove all of the objects that were added to the scene
		RING.scene.remove(this.object);
		for(var i = 0; i < this.lines.length; i++) {
			RING.scene.remove(this.lines[i]);
		}
	}
})