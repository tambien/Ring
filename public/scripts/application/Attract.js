/*
 * ATRACT MODE
 *
 * randomized search parameters when there hasn't been any contact for a few minutes
 */

RING.AttractMode = Backbone.Model.extend({

	defaults : {
		"lastTouch" : new Date(),
		"attractMode" : false,
	},

	initialize : function(attributes, options) {
		//listen for clicks to the screen
		RING.$container.click(this.touched.bind(this));
		//change into / out of attract mode
		this.on("change:attractMode", this.changeAttract);
		this.listenTo(RING.controls, "change:allLoaded", this.allLoaded);
	},
	//updates the last touched time
	touched : function() {
		this.set("lastTouch", new Date());
	},
	allLoaded : function() {
		this.set("lastTouch", new Date());
		//set a timer for when to switch into attract mode
		setInterval(this.testAttractMode.bind(this), 30000);
	},
	testAttractMode : function() {
		var lastTouch = this.get("lastTouch");
		var now = new Date();
		//start when it hasn't been touched for a minute
		if(now - lastTouch > 30000) {
			this.set("attractMode", true);
		} else {
			this.set("attractMode", false);
		}
	},
	changeAttract : function(model, attractMode) {
		RING.controls.set("expanded", true);
		this.attract();
	},
	attract : function() {
		//remove any post displays
		$(".post").remove();
		if(this.get("attractMode")) {
			//pick a random action
			var actions = [this.changeTime, this.changeArtist, this.showPopOver, this.showPopOver, this.showPopOver, this.showPopOver, this.changeReblogLevel];
			//pick a random action
			var action = RING.Util.choose(actions);
			//do that action
			action();
			//do it again in a little bit
			setTimeout(this.attract.bind(this), RING.Util.randomInt(5000, 8000));
		}
	},
	changeTime : function() {
		//pick a random start time in the past 5 days
		var now = new Date();
		var startDiff = RING.Util.randomInt(0, 5);
		var endDiff = RING.Util.randomInt(0, 4);
		//make sure they are in the right order
		if(startDiff < endDiff) {
			var tmp = startDiff;
			startDiff = endDiff;
			endDiff = tmp;
			//and that they aren't the same date
		} else if(startDiff === endDiff) {
			if(endDiff > 0) {
				endDiff--
			} else {
				startDiff++;
			}
		}
		//get the times
		var startTime = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) - startDiff);
		var endTime = new Date(now.getFullYear(), now.getMonth(), parseInt(now.getDate()) - endDiff);
		//set the times
		RING.controls.set({
			startTime : startTime,
			endTime : endTime,
		})
	},
	changeArtist : function() {
		//choose a random artist from the artist list
		var list = RING.controls.artistList.models;
		var artist = RING.Util.choose(list);
		//switch the state of that artist
		artist.set("checked", !artist.get('checked'));
	},
	showPopOver : function() {
		//select one of hte visible posts
		var visible = RING.tumblrCollection.where({
			visible : true,
		});
		visible.concat(RING.twitterCollection.where({
			visible : true,
		}))
		var post = RING.Util.choose(visible);
		if(post) {

			//convert the post's coords to screen coords
			var width = RING.width, height = RING.height;
			var widthHalf = width / 2, heightHalf = height / 2;

			var projector = new THREE.Projector();
			var vector = projector.projectVector(new THREE.Vector3(post.get("x"), post.get("y"), 0), RING.camera);

			vector.x = (vector.x * widthHalf ) + widthHalf;
			vector.y = -(vector.y * heightHalf ) + heightHalf;

			post.clicked(vector.x, vector.y);
		}
	},
	changeReblogLevel : function() {
		RING.controls.set("reblogLevel", RING.Util.randomInt(0, 3));
	},
});
