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
		//move the reblogs when the origin is moved
		//this.on("change:theta", this.repositionReblogs);
		//resize if it's a reblog
		if(this.get("reblogged_from")) {
			this.set("size", this.get("size") / 2);
		}
		//make the view
		this.view = new RING.Tumblr.View({
			model : this,
		});
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
		} else {
			//move the origin when the time changes
			this.listenTo(RING.controls, "change:startTime", this.getPositionFromTime);
			this.listenTo(RING.controls, "change:endTime", this.getPositionFromTime);
		}
		//the first point is the center of the circle
		this.systemNodes = [new THREE.Vector3(this.get("x"), this.get('y'), 0)];
		this.on("change:x", _.throttle(this.moveStartLine, 100));
		this.on("change:y", _.throttle(this.moveStartLine, 100));

	},
	//second pass at loading things
	allLoaded2 : function() {
		//position the reblogs if this is the origin
		if(!this.origin) {
			this.positionReblogs();
			this.on("change:theta", this.thetaChange);
		} else {
			//this.view.drawEdgeToOrigin();
		}
		//listen for changes and move all of the lines
		if(!this.origin) {
			
		}
		//this.on("change:theta", this.moveLine);
	},
	originVisibility : function(model, visible) {
		//if the origin isn't visible, neither should this
		if(!visible) {
			this.set("visible", false);
		} 
	},
	changeReblogLevel : function(model, reblogLevel) {
		var origin = this.origin;
		if(origin) {
			if(origin.get("visible")) {
				if(reblogLevel >= this.get("reblog_level")) {
					this.set("visible", true);
				} else {
					this.set("visible", false);
				}
			}
		}
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
			//is it already in there?
			if(this.origin.reblogs.indexOf(this) < 0) {
				this.origin.reblogs.push(this);
			}
		}
	},
	positionReblogs : function() {
		this.makeSystemNodes();
		var x = this.get('x');
		var y = this.get('y');
		var theta = this.get("theta");
		for(var i = 0, len = this.reblogs.length; i < len; i++) {
			var reblog = this.reblogs[i];
			var angle = theta + RING.Util.randomFloat(-.1, .1);
			var radius = RING.Util.randomInt(30, 50);
			reblog.systemNodeIndex = RING.Util.randomInt(0, this.systemNodes.length);
			//get that position
			var position = this.systemNodes[reblog.systemNodeIndex];
			var rX = radius * Math.cos(angle) + position.x;
			var rY = radius * Math.sin(angle) + position.y;
			rRadius = Math.sqrt(rX * rX + rY * rY);
			reblog.set({
				x : rX,
				y : rY,
				theta : angle,
				radius : rRadius,
			});
			reblog.positionReblogs();
			reblog.view.drawEdgeToOrigin()
		}
	},
	//when the theta changes, move everything by that amount
	thetaChange : function(model, theta){
		//this.positionReblogs();
		var diff = theta - this.previous("theta");
		this.repositionReblogs(diff);
	},
	moveStartLine : function(){
		var x = this.get("x");
		var y = this.get("y");
		this.systemNodes[0].x = x;
		this.systemNodes[0].y = y;
	},
	repositionReblogs : function(diff) {
		//this.moveLine();
		var x = this.get('x');
		var y = this.get('y');
		this.moveLine(diff);
		for(var i = 0, len = this.reblogs.length; i < len; i++) {
			var reblog = this.reblogs[i];
			var angle = reblog.get("theta") + diff;
			var radius = reblog.get('radius');
			reblog.set({
				x : radius * Math.cos(angle),
				y : radius * Math.sin(angle),
				theta : angle,
			});
			reblog.repositionReblogs(diff);
		}
		//this.moveLine();
	},
	//L-SYSTEM LINES///////////////////////////////////////////////////////////
	makeSystemNodes : function() {
		//add a randomized amount of additional points < the number of reblogs
		var reblogCount = this.reblogs.length;
		var minLines = Math.floor(reblogCount * .25);
		var maxLines = Math.ceil(reblogCount * .75);
		maxLines = Math.min(maxLines, 10);
		//find the position's angle
		var x = this.get("x");
		var y = this.get('y');
		var angle = this.get("theta");
		var nodeCount = RING.Util.randomInt(maxLines, minLines);
		for(var i = 0; i < nodeCount; i++) {
			//make a random point that reaches a little further than the last in roughly the same direction
			var randomAngle = angle + RING.Util.randomFloat(-.1, .1);
			var randomRadius = RING.Util.randomInt(30, 50);
			var newX = randomRadius * Math.cos(randomAngle) + x;
			var newY = randomRadius * Math.sin(randomAngle) + y;
			//push that position on
			var vect = new THREE.Vector3(newX, newY, 0);
			this.systemNodes.push(vect);
			x = newX;
			y = newY;
		}
	},
	moveLine : function(diff) {
		var x = this.get("x");
		var y = this.get("y");
		this.systemNodes[0].x = x;
		this.systemNodes[0].y = y;
		//move all of the system nodes by that angle
		for(var i = 1; i < this.systemNodes.length; i++) {
			var node = this.systemNodes[i];
			var nx = node.x;
			var ny = node.y;
			//convert these to polar
			var theta = Math.atan2(ny, nx) + diff;
			var radius = Math.sqrt(nx * nx + ny * ny);
			//rotate them
			//theta = diff;
			//convert back to cartesian
			nx = radius * Math.cos(theta);
			ny = radius * Math.sin(theta);
			//set the value
			node.setX(nx);
			node.setY(ny);
		}
		//move the vertices
		if(this.view.line) {
			this.view.line.geometry.verticesNeedUpdate = true;
		}
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
	},
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
		this.listenTo(this.model, "change:visible", this.lineVisible);
		this.listenTo(this.model, "change:theta", this.updateLines);
	},
	updateLines : function() {

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
	drawEdgeToOrigin : function() {
		//if there are already lines, don't draw some more
		//if(!this.line) {
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
		//}
	},
})