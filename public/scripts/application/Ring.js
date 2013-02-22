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
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		//make the tags collection
		RING.tags = new RING.Tags();
		//getTags();

		//start the drawing
		render();
	}

	//THREE////////////////////////////////////////////////////////////////////

	var camera, projector, renderer;

	function setupTHREE() {
		camera = new THREE.PerspectiveCamera(70, 4 / 3, 1, 10000);
		camera.position.set(0, 0, 1000);
		RING.scene = new THREE.Scene();
		projector = new THREE.Projector();
		//the renderer
		renderer = new THREE.CanvasRenderer();
		$container.append(renderer.domElement);
		//initialize the size
		sizeTHREE();
	}

	function sizeTHREE() {
		RING.width = $container.width();
		RING.height = $container.height();
		camera.aspect = RING.width / RING.height;
		camera.updateProjectionMatrix();
		renderer.setSize(RING.width, RING.height);
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
	
	function bindEvents(){
		$(window).resize(sizeTHREE);
		$container.click(mouseClicked);
	}
	
	function mouseClicked(event){
		event.preventDefault();
		var vector = new THREE.Vector3((event.offsetX / RING.width ) * 2 - 1, -(event.offsetY /RING.height ) * 2 + 1, 0.5);
		projector.unprojectVector(vector, camera);

		var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
		
		var intersects = raycaster.intersectObjects(RING.scene.children);
		if(intersects.length > 0) {
			var intersected = intersects[0].object;
			if (intersected.onclick){
				intersected.onclick();
			}
		}
	}

	//DRAW LOOP//////////////////////////////////////////////////////////////////

	function render() {
		requestAnimationFrame(render);
		if(RING.dev) {
			stats.update();
		}
		renderer.render(RING.scene, camera);
		//update tumblr collection
		RING.tumblrCollection.render();
	}

	//API//////////////////////////////////////////////////////////////////////

	return {
		initialize : initialize,
		rtree : rtree,
	};

}();

RING.Controls = Backbone.Model.extend({
	
});

//development version
RING.dev = true;
