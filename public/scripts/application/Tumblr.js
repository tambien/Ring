/*
 * TUMBLR
 *
 * each unit represents a post
 */

RING.Tumblr = RING.Post.extend({

	//INITIALIZATION///////////////////////////////////////////////////////////

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
	},
	//called when all of the posts are loaded in the collection
	allLoaded : function() {
		this.superLoaded();

		this.origin = this.collection.get(this.get("reblogged_from"));
		//connect to the reblogs
		this.connectReblogs();
		//get the reblog level
		this.getReblogLevel();
		//listen for changes in visibility
		if(this.origin) {
			//listen to the reblogged_from post to set the visibility
			this.listenTo(this.origin, "change:visible", this.originVisibility);
			//this.listenTo(RING.controls, "change:reblogLevel", this.changeReblogLevel);
		} else {
			//move the origin when the time changes
			this.listenTo(RING.controls, "change:startTime", this.getPositionFromTime);
			this.listenTo(RING.controls, "change:endTime", this.getPositionFromTime);
			this.on("change:visible", this.getPositionFromTime);
		}
		//the first point is the center of the circle
		this.systemNodes = [{
			v : new THREE.Vector3(this.get("x"), this.get('y'), 0),
			t : this.get("theta"),
			r : this.get('radius'),
		}];
		this.systemNodesTween = [];
		this.on("change:x", _.throttle(this.moveStartLine, 100));
		this.on("change:y", _.throttle(this.moveStartLine, 100));
	},
	//second pass at loading things
	allLoaded2 : function() {

		//position the reblogs if this is the origin
		if(!this.origin) {
			this.positionReblogs();
			this.on("change:theta", this.thetaChange);
			//this.on("change", this.positionReblogs);
		} else {
			this.view.drawEdgeToOrigin();
		}
	},
	//third pass at loading things
	allLoaded3 : function() {
		//position the reblogs if this is the origin
		if(this.origin) {
			//this.view.drawEdgeToOrigin();
		}
	},
	//VISIBILITY///////////////////////////////////////////////////////////////
	originVisibility : function(model, visible) {
		//if the origin isn't visible, neither should this
		if(!visible) {
			this.set("visible", false);
		}
		//this.lineVisible(model, visible);
	},
	changeReblogLevel : function(model, reblogLevel) {
		if(this.origin.get("visible")) {
			if(this.get("reblog_level") <= reblogLevel) {
				reblog.set("visible", true);
			} else {
				reblog.set("visible", false);
			}
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
	//REBLOG LEVEL/////////////////////////////////////////////////////////////
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
			//pick a random index
			reblog.systemNodeIndex = RING.Util.randomInt(0, this.systemNodes.length);
			//position the post relative to that node
			var node = this.systemNodes[reblog.systemNodeIndex];
			var angle = node.t + RING.Util.randomFloat(-.1, .1);
			var radius = RING.Util.randomInt(30, 50) + node.r;
			//get that position
			//var position = this.systemNodes[reblog.systemNodeIndex].v;
			var rX = radius * Math.cos(angle);
			var rY = radius * Math.sin(angle);
			rRadius = Math.sqrt(rX * rX + rY * rY);
			reblog.set({
				x : rX,
				y : rY,
				theta : angle,
				radius : rRadius,
			});
			reblog.positionReblogs();
		}
	},
	//POSITION AND MOVEMENT////////////////////////////////////////////////////
	//when the theta changes, move everything by that amount
	thetaChange : function(model, theta) {
		//this.positionReblogs();
		var diff = theta - this.previous("theta");
		//this.view.lineVisible(this, false);
		this.repositionReblogs(diff);
		//setTimeout(function(self){
		//	self.view.lineVisible(self, true);
		//}, 800, this);
	},
	moveStartLine : function() {
		var x = this.get("x");
		var y = this.get("y");
		this.systemNodes[0].r = this.get("radius");
		this.systemNodes[0].t = this.get("theta");
		//this.systemNodes[0].x = x;
		//this.systemNodes[0].y = y;
		//stop the previous tween if there is one
		if(this.systemNodesTween[0]) {
			this.systemNodesTween[0].stop();
		}
		this.systemNodesTween[0] = new TWEEN.Tween({
			x : this.systemNodes[0].v.x,
			y : this.systemNodes[0].v.y,
		}).to({
			x : x,
			y : y,
		}, 800).onUpdate( function(node, view) {
			return function() {
				//set the value
				node.v.setX(this.x);
				node.v.setY(this.y);
				if(view.line) {
					view.line.geometry.verticesNeedUpdate = true;
				}
			}
		}(this.systemNodes[0], this.view)).start();
	},
	repositionReblogs : function(diff) {
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
			var randomAngle = angle + RING.Util.randomFloat(-.5, .5);
			var randomRadius = RING.Util.randomInt(30, 50);
			var newX = randomRadius * Math.cos(randomAngle) + x;
			var newY = randomRadius * Math.sin(randomAngle) + y;
			//get the angle and radius of that new xy
			var t = Math.atan2(newY, newX);
			var r = Math.sqrt(newX * newX + newY * newY);
			//push that position on
			var vect = new THREE.Vector3(newX, newY, 0);
			var node = {
				t : t,
				r : r,
				v : vect,
			}
			this.systemNodes.push(node);
			x = newX;
			y = newY;
		}
	},
	moveLine : function(diff) {
		//make sure the view is removed and replaced with the new position
		//this.view.lineVisible(this, false);
		//this.view.lineVisible(this, true);
		//move all of the system nodes by that angle
		for(var i = 1; i < this.systemNodes.length; i++) {
			var node = this.systemNodes[i];
			var nx = node.v.x;
			var ny = node.v.y;
			//rotate the coords
			node.t += diff;
			//recalculate the vector position relative to the previous node
			var newX = node.r * Math.cos(node.t);
			var newY = node.r * Math.sin(node.t);
			var view = this.view;

			if(this.systemNodesTween[i]) {
				this.systemNodesTween[i].stop();
			}
			this.systemNodesTween[i] = new TWEEN.Tween({
				x : nx,
				y : ny,
			}).to({
				x : newX,
				y : newY
			}, 800).onUpdate( function(node, view) {
				return function() {
					//set the value
					node.v.setX(this.x);
					node.v.setY(this.y);
					if(view.line) {
						view.line.geometry.verticesNeedUpdate = true;
					}
				}
			}(node, view)).start();
			//node.v.setX(newX);
			//node.v.setY(newY);
		}
		//move the vertices
		if(this.view.line) {
			this.view.line.geometry.verticesNeedUpdate = true;
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
	},
	//animate the entrance and exit of lines
	lineVisible : function(model, visible) {
		if(this.lineTimeout) {
			clearTimeout(this.lineTimeout);
		}
		this.lineTimeout = setTimeout(function(self, model) {
			if(self.line) {
				var originX = model.origin.get("x");
				var originY = model.origin.get("y");
				if(visible) {
					RING.scene.add(self.line);
					//make the lines come from the origin node

					for(var i = 0; i < model.systemNodes.length; i++) {
						var node = model.systemNodes[i];
						//make each of the lines start at the origin, and reach towards their final position
						//calculate final position
						var x = node.r * Math.cos(node.t);
						var y = node.r * Math.sin(node.t);
						//set the vertex to the origin
						node.v.x = originX;
						node.v.y = originY;
						if(self.lineVisibleTween) {
							self.lineVisibleTween.stop();
						}
						self.lineVisibleTween = new TWEEN.Tween({
							x : originX,
							y : originY,
						}).to({
							x : x,
							y : y
						}, 500).easing(TWEEN.Easing.Elastic.Out).onUpdate( function(node, view) {
							return function() {
								//set the value
								node.v.setX(this.x);
								node.v.setY(this.y);
								if(view.line) {
									view.line.geometry.verticesNeedUpdate = true;
								}
							}
						}(node, self)).start();
					}
				} else {
					//make the lines fly out
					RING.scene.remove(self.line);
				}
			}
		}, 800, this, model);
		//should be removed instantly
		if (this.line) {
			if (!visible){
				RING.scene.remove(this.line);
			}
		}
	},
	createElement : function() {
		this.$container.html(" ");
		this.$title = $("<div id='title'>posted in <span class='yellow'>" + this.model.get("blog_name") + "</span></div>").appendTo(this.$container);
		this.$reblogCount = $("<div id='reblog_count'>reblogged <span class='yellow'>" + this.model.reblogs.length + "</span> times</div>").appendTo(this.$container);
		var text = this.model.get("text");
		if(text.length > 500) {
			text = text.slice(0, 498);
			text += "...";
		}
		var photo = this.model.get("photo");
		if(photo !== "") {
			var self = this;
			this.$photo = $("<img id='photo'/>").attr('src', photo).load(function() {
				if(!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
					alert('broken image!');
				} else {
					//self.$container.append(self.$photo);
				}
			}).appendTo(this.$container);
		}
		if(text !== "") {
			this.$text = $("<div id='text'>" + text + "</div>").appendTo(this.$container);
		}
		this.$notes = $("<div id='note_count'>notes: <span class='yellow'>" + this.model.get("note_count") + "</span></div>").appendTo(this.$container);
		this.$artists = $("<div id='artist'><span class='yellow'>#" + this.model.get("artist") + "</span></div>").appendTo(this.$container);
	},
	//draw edges to the connected reposts
	drawEdgeToOrigin : function() {
		//if there are already lines, don't draw some more
		//if(!this.line) {
		var origin = this.model.origin;
		if(origin) {
			var geometry = new THREE.Geometry();
			geometry.vertices.push(this.model.systemNodes[0].v);
			//geometry.vertices.push(origin.systemNodes[0]);
			for(var i = this.model.systemNodeIndex; i >= 0; i--) {
				geometry.vertices.push(origin.systemNodes[i].v);
			}
			this.line = new THREE.Line(geometry, RING.Tumblr.lineMaterial);
		}
		//}
	},
	remove : function() {
		//remove all of the objects that were added to the scene
		if(this.line) {
			RING.scene.remove(this.line);
		}
	},
})