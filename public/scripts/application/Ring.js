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
		//setup the rendering context
		setupTHREE();
		setupStats();
		//bind the basic events
		bindEvents();
		//make the controls
		RING.controls = new RING.Controls();
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		RING.twitterCollection = new RING.TwitterCollection();
		RING.Particles.initialize();
		//start it off
		render();
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
			clearColor : 0x000000,
			clearAlpha : 1
		});
		RING.renderer.sortObjects = false;
		$container.append(RING.renderer.domElement);
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

	var stats;

	function setupStats() {
		//add the stats for the development version
		if(RING.dev) {
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			$container.append(stats.domElement);
		}
	}

	//EVENTS/////////////////////////////////////////////////////////////////////

	function bindEvents() {
		$(window).resize(sizeTHREE);
		$container.click(mouseClicked);
	}

	function mouseClicked(event) {
		//remove any other post displays
		$(".post").remove();
		//find a new post to display
		event.preventDefault();
		var vector = new THREE.Vector3((event.offsetX / RING.width ) * 2 - 1, -(event.offsetY / RING.height ) * 2 + 1, 0.5);
		projector.unprojectVector(vector, RING.camera);

		var raycaster = new THREE.Raycaster(RING.camera.position, vector.sub(RING.camera.position).normalize());

		var intersects = raycaster.intersectObjects(RING.scene.children);
		if(intersects.length > 0) {
			var intersected = intersects[0].object;
			if(intersected.onclick) {
				intersected.onclick();
			}
		}
	}

	//DRAW LOOP//////////////////////////////////////////////////////////////////

	function start() {

	}

	function render() {
		requestAnimationFrame(render);
		if(RING.dev) {
			stats.update();
		}
		RING.renderer.render(RING.scene, RING.camera);
		//update tumblr collection
		//RING.tumblrCollection.render();
	}

	//API//////////////////////////////////////////////////////////////////////

	return {
		initialize : initialize,
		start : start,
		rtree : rtree,
	};

}();

//development version
RING.dev = true;
