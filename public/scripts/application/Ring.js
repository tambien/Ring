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

	//INITIALIZATION///////////////////////////////////////////////////////////

	function initialize() {
		//check if it's the installation version and set the flag
		if(window.location.hash === "#installation") {
			RING.installation = true;
			RING.artistCount = 26;
		} else {
			RING.installation = false;
			RING.artistCount = 14;
		}
		//set the container
		$container = $("#container");
		RING.$container = $container;
		//setup the rendering context
		//do our initial test
		if(WebGLTest() && Modernizr.webaudio) {
			//get rid of the noChrome
			$("#noChrome").css({
				"z-index" : -100,
				opacity : 0,
			})
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
			//make the sound playing module
			RING.sound = new RING.Sound();
		} else {

		}
	}

	function WebGLTest() {
		var test = function() {
			try {
				return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
			} catch( e ) {
				return false;
			}
		}();
		return test;
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
		//set the controls so they display correctly by scrolling on smaller screens
		/*
		 if(RING.height < 800) {
		 var $controls = $("#controls");
		 var top = $controls.position().top;
		 $controls.css({
		 "max-height" : RING.height - top,
		 });
		 }
		 */
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
		//remove the previous views whenever the mouse is down
		$container.mousedown(function() {
			RING.removeHighlight();
		});
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
		//find the new object
		var mouseX = event.offsetX;
		var mouseY = event.offsetY;
		var vector = new THREE.Vector3((mouseX / RING.width ) * 2 - 1, -(mouseY / RING.height ) * 2 + 1, 1);
		projector.unprojectVector(vector, RING.camera);
		var dir = vector.sub(RING.camera.position).normalize();
		var ray = new THREE.Ray(RING.camera.position, dir);
		var distance = -RING.camera.position.z / dir.z;
		var pos = RING.camera.position.clone().add(dir.multiplyScalar(distance));
		//get all the visible posts
		var visible = RING.tumblrCollection.where({
			visible : true,
		})
		visible = visible.concat(RING.twitterCollection.where({
			visible : true,
		}));
		pos.setZ(1);
		var closestDist = 100000;
		var closestModels = []
		//var closest
		_.forEach(visible, function(model) {
			//var dist = model.view.particle.distanceTo(pos);
			//if(dist < closestDist) {
			//	closestDist = dist;
			//	closestModel = model;
			//}
			var dist = model.view.particle.distanceTo(pos);
			if(dist < model.get('size')) {
				closestModels.push(model);
			}
		});
		//for all of the matching models, find the one with the highest z
		var highestZ = -10000;
		var closestModel;
		_.forEach(closestModels, function(model) {
			var modelZ = model.view.particle.z
			if(modelZ > highestZ) {
				closestModel = model;
				highestZ = modelZ;
			}
		});
		if(closestModel) {
			closestModel.clicked(mouseX, mouseY);
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
		loaded : loaded,
		pause : pause,
		start : start,
		removeHighlight : function() {
			//remove any other post displays
			$(".post").remove();
			RING.highlight.position.x = -10000;
			RING.highlight.position.y = -10000;
		}
	};

}();

//development version
RING.dev = false;
RING.dontLoad = false;
/*
 RING.installation = false;
 if(RING.installation) {
 RING.artistCount = 26;
 } else {
 RING.artistCount = 14;
 }*/