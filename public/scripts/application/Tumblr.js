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
		"reblogged_from" : null,
		"text" : "",
		"timestamp" : 0,
		"note_count" : 0,
		"x" : 0,
		"y" : 0,
		"size" : 0,
		"new" : true,
		"visible" : false,
		"reblog_level" : 0,
	},
	initialize : function(attributes, options) {
		this.on("change:visible", this.makeReblogsInvisible);
		//set hte cid
		this.cid = this.get("id");
		//an array to store all the reblogs
		this.reblogs = [];
		//set the position initially
		this.setPosition();
		//set the size and create the view
		this.getSizeFromNoteCount();
		//make the view
		this.view = new RING.Tumblr.View({
			model : this,
		});
	},
	//called when a model is removed from the collection
	remove : function() {
		this.view.remove();
	},
	//called when all of the posts are loaded in the collection
	allLoaded : function() {
		//connect to the reblogs
		this.connectReblogs();
		//get the reblog level
		this.getReblogLevel();
		//position the reblogs if it's an origin node
		//this.view.drawEdgesToReblogs();
	},
	//sets the x and y based on the time + a little randomness
	setPosition : function() {
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
	//sets which level of reblog it is
	//primary/reblog/reblogOfReblog
	getReblogLevel : function() {
		//if it's a primary post, it doesn't have any reblogs
		var reblogged_from = this.get("reblogged_from")
		if(reblogged_from === null) {
			this.set("reblog_level", 0);
		} else {
			//if the origin is not a reblog
			var origin = this.collection.get(reblogged_from);
			if(origin && origin.get("reblogged_from") === null) {
				this.set("reblog_level", 1);
			} else {
				this.set("reblog_level", 2);
			}
		}
	},
	connectReblogs : function() {
		var reblogged_from = this.get("reblogged_from");
		if(reblogged_from !== null) {
			//point the origin blog back to this one
			var origin = this.collection.get(reblogged_from);
			if(origin) {
				origin.reblogs.push(this);
			}
		}
	},
	positionReblogs : function() {
		var x = this.get("x");
		var y = this.get("y");
		var r = Math.sqrt(x * x + y * y);
		var theta = Math.atan2(y, x);
		for(var i = 0, len = this.reblogs.length; i < len; i++) {
			var reblog = this.reblogs[i];
			var angle = theta + RING.Util.scale(i, 0, len, -.5, .5);
			var radius = RING.Util.randomInt(100, 150);
			reblog.set({
				x : radius * Math.cos(angle) + x,
				y : radius * Math.sin(angle) + y,
			});
			reblog.positionReblogs();
		}
	},
	getSizeFromNoteCount : function() {
		var count = this.get("note_count");
		var size = 0;
		if(!this.get("reblogged_from")) {
			size = Math.log(count) * 4 + 8;
		} else {
			size = Math.log(count) + 12;
		}
		this.set("size", size);
	},
	makeReblogsVisible : function(level) {
		_.forEach(this.reblogs, function(reblog, index) {
			if(reblog.get('reblog_level') <= level) {
				reblog.set("visible", true);
				reblog.makeReblogsVisible(level);
			} else {
				reblog.set("visible", false);
			}
		});
	},
	makeReblogsInvisible : function(model, visible) {
		if(!visible) {
			_.forEach(model.reblogs, function(reblog, index) {
				reblog.set("visible", false);
				reblog.makeReblogsInvisible(reblog, visible);
			});
		}
	}
});

var PI2 = 2 * Math.PI;
var material = new THREE.ParticleCanvasMaterial({
	color : 0xfffffff,
	program : function(context) {
		//var size = this.model.get("size")/2;
		context.beginPath();
		context.arc(0, 0, 1, 0, PI2, false);
		context.closePath();
		context.fill();
	}
})

RING.Tumblr.View = Backbone.View.extend({

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
		this.object = new THREE.Particle(material);
		//this.object.position.z = RING.Util.randomFloat(-.5, .5);
		//this.object.position.z = this.model.get("size")*10;
		this.object.scale.x = this.object.scale.y = this.model.get("size");
		//the center is the vector which floats above the circle's center
		this.lineCenter = this.object.position.clone().setZ(1);
		this.position();
		//attach the callback when it's been clicked on
		this.object.onclick = this.clicked.bind(this);
		//not visible by default
		//this.object.visible = false;
	},
	setColor : function(color) {

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
		//var size = this.model.get("size")/2;
		context.beginPath();
		context.arc(0, 0, 1, 0, PI2, false);
		context.closePath();
		context.fill();
	},
	makeTexture : function() {
		var size = this.model.get("size");
		var cache = document.createElement('canvas');
		cache.width = size;
		cache.height = size;
		var ctx = cache.getContext('2d');
		this.draw(ctx);
		var texture = new THREE.Texture(cache);
		texture.needsUpdate = true;
	},
	//draw edges to the connected reposts
	drawEdgesToReblogs : function() {
		//if there are already lines, don't draw some more
		if(!this.line) {
			var reblogID = this.model.get("reblogged_from");
			var reblog = RING.tumblrCollection.get(reblogID);
			if(reblog) {
				var geometry = new THREE.Geometry();
				geometry.vertices.push(this.lineCenter);
				geometry.vertices.push(reblog.view.lineCenter);
				this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
					color : 0xffffff,
					opacity : .5,
					linewidth : 1.5,
				}));
			}
		}
	},
	clicked : function() {
		console.log(this.model);
	},
	remove : function() {
		//remove all of the objects that were added to the scene
		RING.scene.remove(this.object);
		if(this.line) {
			RING.scene.remove(this.line);
		}
	},
	setVisible : function(model, visible) {
		if(visible) {
			//add it to the scene
			RING.scene.add(this.object);
			if(this.line) {
				RING.scene.add(this.line);
			}
		} else {
			RING.scene.remove(this.object);
			if(this.line) {
				RING.scene.remove(this.line);
			}
		}

	}
})