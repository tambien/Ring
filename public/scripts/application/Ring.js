//jumping off point
$(function() {
	RING.initialize();
});
/*
 * RING
 *
 * the main application
 */
var RING = function() {

	var $container;

	var rtree = new RTree(10);

	//INITIALIZATION///////////////////////////////////////////////////////////

	function initialize() {
		$container = $("#container");
		RING.$container = $container;
		//setup the rendering context
		setupTHREE();
		//addOctagon();
		makeSprite();
		setupStats();
		//bind the basic events
		bindEvents();
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		RING.twitterCollection = new RING.TwitterCollection();
		RING.Particles.initialize();
		//make the controls
		RING.controls = new RING.Controls();
		//make the attract mode
		RING.attractMode = new RING.AttractMode();
	}

	//a loaded counter which will remove the loading indicator
	var loadCounter = 0;
	function loaded() {
		loadCounter++;
		if(loadCounter === 2) {
			$("#loadingScreen").fadeTo(500, 0, function() {
				$(this).css({
					"z-index" : -100,
				})
			})
		}
	}

	//THREE////////////////////////////////////////////////////////////////////

	var projector, renderer;

	function setupTHREE() {
		RING.camera = new THREE.PerspectiveCamera(70, 4 / 3, 1, 10000);
		RING.camera.position.set(0, 0, 1000);
		RING.scene = new THREE.Scene();
		projector = new THREE.Projector();
		//the renderer
		RING.renderer = new THREE.WebGLRenderer({
			antialias : true,
			//clearColor : 0x000000,
			//clearAlpha : 1
		});
		RING.renderer.sortObjects = false;
		$("#canvas").append(RING.renderer.domElement);
		//initialize the size
		sizeTHREE();
	}

	function sizeTHREE() {
		RING.width = $container.width();
		RING.height = $container.height();
		RING.camera.aspect = RING.width / RING.height;
		RING.camera.updateProjectionMatrix();
		RING.renderer.setSize(RING.width, RING.height);
	}

	//makes the octagon in the center
	function addOctagon() {
		var octogonGeometry = new THREE.CircleGeometry(400, 8);
		var octogon = new THREE.Mesh(octogonGeometry, new THREE.MeshBasicMaterial({
			color : 0x111111,
			opacity : 1,
			wireframe : false,
			wireframeLinewidth : 1,
		}));
		//position it
		octogon.position.x = 0;
		octogon.position.y = 0;
		octogon.position.z = 1;
		octogon.rotation.z = Math.PI / 8;
		//add it to the scene
		RING.scene.add(octogon);
	}

	//this is the little ring that goes around selected objects
	function makeSprite() {
		var image = THREE.ImageUtils.loadTexture("./images/Yellow_Outline.png");
		var material = new THREE.SpriteMaterial({
			map : image,
			useScreenCoordinates : false,
			color : 0xffffff
		});
		RING.highlight = new THREE.Sprite(material);
		RING.highlight.position.x = -10000;
		RING.highlight.position.y = -10000;
		RING.highlight.position.z = 2;
		RING.highlight.scale.x = 10;
		RING.highlight.scale.y = 10;
		RING.scene.add(RING.highlight);
	}

	var stats;

	function setupStats() {
		//add the stats for the development version
		if(RING.dev) {
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			stats.domElement.style.right = '0px';
			$container.append(stats.domElement);
		}
	}

	//EVENTS/////////////////////////////////////////////////////////////////////

	function bindEvents() {
		$(window).resize(sizeTHREE);
		$container.click(mouseClicked);
		//disable right click
		$(document).bind("contextmenu", function(event) {
			event.preventDefault();
		});
	}

	function mouseClicked(event) {
		event.preventDefault();
		if(event.which == 2 || event.which == 3) {
			return false;
		}
		//remove any other post displays
		$(".post").remove();
		RING.highlight.position.x = -10000;
		RING.highlight.position.y = -10000;
		//find the new object
		var mouseX = event.offsetX;
		var mouseY = event.offsetY;
		var vector = new THREE.Vector3((mouseX / RING.width ) * 2 - 1, -(mouseY / RING.height ) * 2 + 1, 0);
		projector.unprojectVector(vector, RING.camera);
		var dir = vector.sub(RING.camera.position).normalize();
		var ray = new THREE.Ray(RING.camera.position, dir);
		var distance = -RING.camera.position.z / dir.z;
		var pos = RING.camera.position.clone().add(dir.multiplyScalar(distance));
		var width = 1;
		var res = rtree.search({
			x : pos.x - width,
			y : pos.y - width,
			w : width * 2,
			h : width * 2,
		})
		//get the post which is closest to the center of the mouse and has the highest z axis
		//go throgh and get only the points that are on top
		var topPost;
		var highestZ = -1000;
		for(var i = 0; i < res.length; i++) {
			var post = res[i];
			var postZ = post.view.particle.z;
			if (postZ > highestZ){
				topPost = post;
				highestZ = postZ;
			}
		}
		if(topPost) {
			//check that it was actually within the element
			var box = topPost.boundingBox;
			var inX = pos.x > box.x && pos.x < box.x + box.w * 10;
			var inY = pos.y > box.y && pos.y < box.y + box.h * 10;
			topPost.clicked(mouseX, mouseY);
			RING.highlight.position.x = topPost.get("x");
			RING.highlight.position.y = topPost.get("y");
			RING.highlight.scale.x = topPost.get("size") * 2;
			RING.highlight.scale.y = topPost.get("size") * 2;
		}
	}

	//DRAW LOOP//////////////////////////////////////////////////////////////////

	var paused = true;

	function pause() {
		paused = true;
	}

	function start() {
		paused = false;
		render();
	}

	function render() {
		if(!paused) {
			requestAnimationFrame(render);
			if(RING.dev) {
				stats.update();
			}
			RING.renderer.render(RING.scene, RING.camera);
			//update the tweet
			TWEEN.update();
			//update tumblr collection
			//RING.tumblrCollection.render();
		}
	}

	//API//////////////////////////////////////////////////////////////////////

	return {
		initialize : initialize,
		rtree : rtree,
		loaded : loaded,
		pause : pause,
		start : start,
	};

}();

//development version
RING.dev = true;
RING.dontLoad = false;
RING.installation = false;
