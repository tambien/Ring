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
		addOctagon();
		setupStats();
		//bind the basic events
		bindEvents();
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		RING.twitterCollection = new RING.TwitterCollection();
		RING.Particles.initialize();
		//make the controls
		RING.controls = new RING.Controls();
		//start it off
		render();
	}
	
	//a loaded counter which will remove the loading indicator
	var loadCounter = 0;
	function loaded(){
		loadCounter++;
		if (loadCounter === 2){
			$("#loadingScreen").fadeTo(500, 0, function(){
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
	
	//makes the octagon in the center
	function addOctagon(){
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
	}

	function mouseClicked(event) {
		event.preventDefault();
		//remove any other post displays
		$(".post").remove();
		//find the new object
		var mouseX = event.offsetX;
		var mouseY = event.offsetY;
		var vector = new THREE.Vector3((mouseX / RING.width ) * 2 - 1, -(mouseY / RING.height ) * 2 + 1, 0);
		projector.unprojectVector(vector, RING.camera);
		var dir = vector.sub(RING.camera.position).normalize();
		var ray = new THREE.Ray(RING.camera.position, dir);
		var distance = -RING.camera.position.z / dir.z;
		var pos = RING.camera.position.clone().add(dir.multiplyScalar(distance));
		var width = 25;
		var res = rtree.search({
			x : pos.x - width,
			y : pos.y - width,
			w : width * 2,
			h : width * 2,
		})
		//get the post which is closest to the center of the mouse
		var closest;
		var closestDist = 10000;
		for(var i = 0; i < res.length; i++) {
			var xDist = res[0].get('x') - pos.x;
			var yDist = res[0].get('y') - pos.y;
			var dist = Math.sqrt(xDist * xDist + yDist * yDist);
			if(dist < closestDist) {
				closestDist = dist;
				closest = res[i];
			}
		}
		if(closest) {
			//check that it was actually within the element
			var box = closest.boundingBox;
			var inX = pos.x > box.x && pos.x < box.x + box.w;
			var inY = pos.y > box.y && pos.y < box.y + box.h;
			closest.clicked(mouseX, mouseY);
			if(inX && inY) {
				
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
		loaded: loaded,
	};

}();

//development version
RING.dev = true;
RING.dontLoad = false;
RING.installation = true;
