/*
 * Three
 *
 * renders the visuals using Three.js
 */

RING.Three = function() {

	var container, stats;
	var camera, scene, projector, renderer;

	function init() {
		container = $("#canvas")[0];
		//document.body.appendChild(container);
		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
		camera.position.set(0, 0, 100);
		scene = new THREE.Scene();

		var PI2 = Math.PI * 2;
		projector = new THREE.Projector();
		renderer = new THREE.WebGLRenderer({
			clearColor : 0x000000,
			clearAlpha : 1,
			antialias : false
		});
		renderer.autoClear = false;
		renderer.setSize(window.innerWidth, window.innerHeight);

		container.appendChild(renderer.domElement);
		renderer.domElement.style.position = 'absolute';
		renderer.domElement.style.top = '0px';
		renderer.domElement.style.left = '0px';

		if(RING.dev) {
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			container.appendChild(stats.domElement);
		}
		//make the central octogon
		var octogonGeometry = new THREE.CircleGeometry(48, 8);
		var octogon = new THREE.Mesh(octogonGeometry, new THREE.MeshBasicMaterial({
			color : 0x000000,
			opacity : 1,
			wireframe : false,
			wireframeLinewidth : 1,
		}));
		//position it
		octogon.position.x = 0;
		octogon.position.y = 0;
		octogon.position.z = 0;
		octogon.rotation.z = Math.PI/8;
		//add it to the scene
		scene.add(octogon);

		document.addEventListener('mousedown', onDocumentMouseDown, false);

		//

		window.addEventListener('resize', onWindowResize, false);
		animate();

	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	}

	function onDocumentMouseDown(event) {

		event.preventDefault();

		var vector = new THREE.Vector3((event.clientX / window.innerWidth ) * 2 - 1, -(event.clientY / window.innerHeight ) * 2 + 1, 0.5);
		projector.unprojectVector(vector, camera);

		var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

		var intersects = raycaster.intersectObjects(circles);

		if(intersects.length > 0) {

			intersects[0].object.material.color.setHex(RING.Util.randomFloat(.2, .8) * 0xffffff);

		}

	}

	function animate() {
		requestAnimationFrame(animate);
		renderer.render(scene, camera);
		if(RING.dev) {
			stats.update();
		}
	}

	//adds a circle and returns that object
	function addCircle(x, y, size) {
		return new Circle(x, y, size);
	}

	/*
	 * CIRCLE
	 *
	 * a wrapper on the threejs object to make it easier to change
	 */

	var circles = [];

	function Circle(x, y, size) {
		this.x = x;
		this.y = y;
		this.size = size;

		var self = this;

		function init() {
			//create the obj
			self.object = new THREE.Mesh(self.geometry, new THREE.MeshBasicMaterial({
				color : RING.Util.randomFloat(.2, .8) * 0xffffff,
				opacity : .8,
				wireframe : false,
				wireframeLinewidth : 1,
			}));
			//position it
			self.object.position.x = self.x;
			self.object.position.y = self.y;
			self.object.position.z = RING.Util.randomFloat(-.5, .5);
			//size it
			self.object.scale.x = Math.log(self.size) + 1;
			self.object.scale.y = Math.log(self.size) + 1;

			//add it to the scene
			scene.add(self.object);
			circles.push(self.object);
		}

		init();
	}


	Circle.prototype.moveTo = function(x, y) {
		this.object.position.x = x;
		this.object.position.y = y;
	}

	Circle.prototype.geometry = new THREE.CircleGeometry(1, 100);

	/*
	 * API
	 */

	return {
		initialize : init,
		add : addCircle,
	}
}();
