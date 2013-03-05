/*
 * TUMBLR
 *
 * each unit represents a post
 */

RING.Tumblr = RING.Post.extend({

	initialize : function(attributes, options) {
		this.superInit();
		this.set("style", RING.Util.choose(['circle_grad', 'circle']))
		//an array to store all the reblogs
		this.reblogs = [];
		//resize if it's a reblog
		if(this.get("reblogged_from")) {
			this.set("size", this.get("size") / 2);
		}
		//make the view
		this.view = new RING.Tumblr.View({
			model : this,
		});
		//the first point is the center of the circle
		this.systemNodes = [new THREE.Vector3(this.get("x"), this.get('y'), 0)];
		//listen for movement and move all of the lines
		this.on("change:x", this.moveLine);
		this.on("change:y", this.moveLine);
		//this.on("change:theta", this.moveSystemNodes);
		//this.on("change:radius", this.moveSystemNodes);
		//this.listenTo(RING.controls, "change:reblogLevel", this.changeReblogLevel);
	},
	//called when all of the posts are loaded in the collection
	allLoaded : function() {
		this.superLoaded();
		//listen to the reblogged_from post to set the visibility
		this.origin = this.collection.get(this.get("reblogged_from"));
		//connect to the reblogs
		this.connectReblogs();
		//get the reblog level
		this.getReblogLevel();
		//listen for changes in visibility
		if(this.origin) {
			this.listenTo(this.origin, "change:visible", this.originVisibility);
			//add tumblr specific flags
			this.set({
				"reblogLevelMatch" : false,
				"originVisible" : false,
			});
			this.listenTo(RING.controls, "change:reblogLevel", this.testReblogLevel);
		} else {
			this.set({
				"timeMatch" : false,
				"artistMatch" : false,
			});
			//and add the listeners for those
			this.listenTo(RING.controls, "change:startTime", this.testTime);
			this.listenTo(RING.controls, "change:endTime", this.testTime);
			this.listenTo(RING.controls.artistList, "change:checked", this.testArtist);
		}
	},
	originVisibility : function(model, visible) {
		//if the origin isn't visible, neither should this
		this.set("originVisible", visible);
		this.visibilityTest();
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
			//this.origin = this.collection.get(reblogged_from);
			if(this.origin && this.origin.get("reblogged_from") === null) {
				this.set("reblog_level", 1);
			} else {
				this.set("reblog_level", 2);
			}
		}
	},
	connectReblogs : function() {
		if(this.origin) {
			this.origin.reblogs.push(this);
		}
	},
	/*
	positionReblogs : function() {
		this.makeSystemNodes();
		for(var i = 0, len = this.reblogs.length; i < len; i++) {
			var reblog = this.reblogs[i];
			var angle = RING.Util.randomFloat(-1, 1);
			var radius = RING.Util.randomInt(30, 80);
			reblog.systemNodeIndex = RING.Util.randomInt(0, this.systemNodes.length);
			//get that position
			var position = this.systemNodes[reblog.systemNodeIndex];
			reblog.set({
				theta : angle + position.t,
				radius : radius + position.r,
			});
			reblog.positionReblogs();
		}
	},
	*/
	positionReblogs : function() {
		this.makeSystemNodes();
		var x = this.get('x');
		var y = this.get('y');
		var theta = this.theta;
		for(var i = 0, len = this.reblogs.length; i < len; i++) {
			var reblog = this.reblogs[i];
			var angle = theta + RING.Util.randomFloat(-1, 1);
			var radius = RING.Util.randomInt(30, 80);
			reblog.systemNodeIndex = RING.Util.randomInt(0, this.systemNodes.length);
			//get that position
			var position = this.systemNodes[reblog.systemNodeIndex];
			reblog.set({
				x : radius * Math.cos(angle) + position.x,
				y : radius * Math.sin(angle) + position.y,
			});
			reblog.positionReblogs();
		}
	},
	moveLine : function() {
		var x = this.get("x");
		var y = this.get("y");
		this.systemNodes[0].x = x;
		this.systemNodes[0].y = y;
	},
	/*
	moveSystemNodes : function() {
		var angle = this.get("theta");
		var radius = this.get("radius");
		//set the first node at this nodes position
		var center = this.systemNodes[0];
		center.t = this.get("theta");
		center.r = this.get("radius");
		center.v.setX(this.get("x"));
		center.v.setY(this.get("y"));
		var diff = this.previous("theta") - angle;
		for(var i = 1; i < this.systemNodes.length; i++) {
			center.t+=diff;
			center.v.setX(center.r * Math.cos(center.t))
			center.v.setY(center.r * Math.sin(center.t))
		}
		//also move reblogs
	},
	*/
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
	},
	/*
	//the system nodes array has a {t,r, v : threejs vertex} for each node
	makeSystemNodes : function() {
		//add a randomized amount of additional points < the number of reblogs
		var reblogCount = this.reblogs.length;
		var minLines = Math.floor(reblogCount * .25) + 1;
		var maxLines = Math.ceil(reblogCount * .75);
		maxLines = Math.min(maxLines, 8);
		minLines = Math.min(minLines, 3);
		//find the position's angle
		var x = this.get("x");
		var y = this.get('y');
		var angle = this.get("theta");
		var nodeCount = RING.Util.randomInt(minLines, maxLines);
		var radius = this.get("radius");
		for(var i = 0; i < nodeCount; i++) {
			//make a random point that reaches a little further than the last in roughly the same direction
			angle += RING.Util.randomFloat(-.5, .5);
			radius += RING.Util.randomInt(30, 50);
			//push the  coords on the array
			this.systemNodes.push({
				t : angle,
				r : radius,
				v : new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0)
			});
		}
	},
	*/
	makeSystemNodes : function() {
		//add a randomized amount of additional points < the number of reblogs
		var reblogCount = this.reblogs.length;
		var minLines = Math.floor(reblogCount * .25);
		var maxLines = Math.ceil(reblogCount * .75);
		maxLines = Math.min(maxLines, 10);
		//find the position's angle
		var x = this.get("x");
		var y = this.get('y');
		var angle = this.theta
		var nodeCount = RING.Util.randomInt(maxLines, minLines);
		for(var i = 0; i < nodeCount; i++) {
			//make a random point that reaches a little further than the last in roughly the same direction
			var randomAngle = angle + RING.Util.randomFloat(-.5, .5);
			var randomRadius = RING.Util.randomInt(50, 80);
			var newX = randomRadius * Math.cos(randomAngle) + x;
			var newY = randomRadius * Math.sin(randomAngle) + y;
			//push that position on
			var vect = new THREE.Vector3(newX, newY, 0);
			this.systemNodes.push(vect);
			x = newX;
			y = newY;
		}
	},
	//TESTS////////////////////////////////////////////////////////////////////
	//test if the reblog level matches this reblog level
	testReblogLevel : function(model, reblogLevel) {
		this.set("reblogLevelMatch", reblogLevel >= this.get("reblog_level"));
		this.visibilityTest();
	},
	//the post is visible when the time matches and the artist match
	visibilityTest : function() {
		if(this.origin) {
			this.set("visible", this.get("reblogLevelMatch") && this.get("originVisible"));
		} else {
			this.set("visible", this.get("timeMatch") && this.get("artistMatch"));
		}
	}
});

//cache the line material
RING.Tumblr.lineMaterial = new THREE.LineBasicMaterial({
	color : 0xfffffff,
	opacity : 0.5,
	linewidth : .5,
	transparent : true
})

RING.Tumblr.View = RING.Post.View.extend({

	initialize : function() {
		this.superInit();
		this.listenTo(this.model, "change:radius", this.moveLine);
		this.listenTo(this.model, "change:theta", this.moveLine);
		this.listenTo(this.model, "change:visible", this.lineVisible);
		this.lineCenter = new THREE.Vector3(this.model.get("x"), this.model.get("y"), 0);
	},
	moveLine : function(model, x) {
		//find the difference of previous position

		//apply that difference to every node in the systemNodes

		//and reangle it accordingly! that's kind of expensive!
		var x = model.get("x");
		var y = model.get("y");
		this.lineCenter.x = x
		this.lineCenter.y = y;
	},
	lineVisible : function(model, visible) {
		if(this.line) {
			if(visible) {
				RING.scene.add(this.line);
			} else {
				RING.scene.remove(this.line);
			}
		}
	},
	clicked : function(x, y) {

	},
	createElement : function() {
		this.$el.html(" ");
		this.$title = $("<div id='title'>" + this.model.get("blog_name") + "</div>").appendTo(this.$el);
		var text = this.model.get("text");
		if(text.length > 500) {
			text = text.slice(0, 498);
			text += "...";
		}
		this.$text = $("<div id='text'>" + text + "</div>").appendTo(this.$el);
		var photo = this.model.get("photo");
		if(photo !== "") {
			var self = this;
			this.$photo = $("<img />").attr('src', photo).load(function() {
				if(!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
					alert('broken image!');
				} else {
					self.$el.append(self.$photo);
				}
			});
		}
		this.$notes = $("<div id='reblogs'>notes: " + this.model.get("note_count") + "</div>").appendTo(this.$el);
	},
	//draw edges to the connected reposts
	/*
	drawEdgeToOrigin : function() {
		//if there are already lines, don't draw some more
		if(!this.line) {
			var origin = this.model.origin;
			if(origin) {
				var geometry = new THREE.Geometry();
				//the first points of the line is the models position
				var modelRadius = this.model.get("radius");
				var modelTheta = this.model.get("theta");
				var current = this.model.systemNodes[0].v;
				geometry.vertices.push(current);
				//geometry.vertices.push(origin.systemNodes[0]);
				for(var i = this.model.systemNodeIndex; i >= 0; i--) {
					var coords = origin.systemNodes[i];
					geometry.vertices.push(coords.v);
				}
				this.line = new THREE.Line(geometry, RING.Tumblr.lineMaterial);
			}
		}
	},*/
	//draw edges to the connected reposts
	drawEdgeToOrigin : function() {
		//if there are already lines, don't draw some more
		if(!this.line) {
			var origin = this.model.origin;
			if(origin) {
				var geometry = new THREE.Geometry();
				geometry.vertices.push(this.model.systemNodes[0]);
				//geometry.vertices.push(origin.systemNodes[0]);
				for(var i = this.model.systemNodeIndex; i >= 0; i--) {
					geometry.vertices.push(origin.systemNodes[i]);
				}
				this.line = new THREE.Line(geometry, RING.Tumblr.lineMaterial);
			}
		}
	},
})