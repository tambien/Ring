/*
 * Three
 *
 * renders the visuals using Three.js
 */

RING.Particles = function() {

	var circleSystem, circleAttributes, circleUniforms;
	var circleSystemPointer = 0;

	var circleGradSystem, circleGradAttributes, circleGradUniforms;
	var circleGradSystemPointer = 0;

	var octaSystem, octaAttributes, octaUniforms;
	var octaSystemPointer = 0;

	function init() {
		//circle
		var ret = initSystemWithTexture(circleSystem, circleAttributes, circleUniforms, "./images/Circle.gif");
		circleSystem = ret.system;
		circleAttributes = ret.attributes;
		circleUniforms = ret.uniforms;
		//circle grad
		var ret = initSystemWithTexture(circleGradSystem, circleGradAttributes, circleGradUniforms, "./images/Circle_Grad.gif");
		circleGradSystem = ret.system;
		circleGradAttributes = ret.attributes;
		circleGradUniforms = ret.uniforms;
		//octagon
		var ret = initSystemWithTexture(octaSystem, octaAttributes, octaUniforms, "./images/Octogon_Grad.gif");
		octaSystem = ret.system;
		octaAttributes = ret.attributes;
		octaUniforms = ret.uniforms;
	}

	/*
	 * PARTICLE SYSTEMS
	 */

	function initSystemWithTexture(system, attributes, uniforms, image) {
		attributes = {

			size : {
				type : 'f',
				value : []
			},
			ca : {
				type : 'c',
				value : []
			}

		};
		uniforms = {

			amplitude : {
				type : "f",
				value : 1.0
			},
			color : {
				type : "c",
				value : new THREE.Color(0xffffff)
			},
			texture : {
				type : "t",
				value : THREE.ImageUtils.loadTexture(image)
			},

		};

		uniforms.texture.value.wrapS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

		var shaderMaterial = new THREE.ShaderMaterial({

			uniforms : uniforms,
			attributes : attributes,
			vertexShader : document.getElementById('vertexshader').textContent,
			fragmentShader : document.getElementById('fragmentshader').textContent,
			depthTest : false,
			transparent : true,
			opacity : .8,

		});

		var particleCount = 30000;
		var geometry = new THREE.Geometry();

		for(var i = 0; i < particleCount; i++) {

			var vertex = new THREE.Vector3();
			//make them all off the screen
			vertex.x = -10000;
			vertex.y = -10000;
			vertex.z = RING.Util.randomFloat(-1, 1);
			geometry.vertices.push(vertex);

		}
		system = new THREE.ParticleSystem(geometry, shaderMaterial);

		system.dynamic = true;
		//system.sortParticles = true;

		var vertices = system.geometry.vertices;
		var values_size = attributes.size.value;
		var values_color = attributes.ca.value;

		for(var v = 0; v < vertices.length; v++) {
			values_size[v] = 1;
			values_color[v] = new THREE.Color(0xffffff);
		}

		RING.scene.add(system);

		return {
			system : system,
			attributes : attributes,
			uniforms : uniforms
		}
	}

	/*
	 * sets the attributes in the model
	 */

	function get(model) {
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				//get hte particle vector
				var particle = circleSystem.geometry.vertices[circleSystemPointer];
				//return it's index and increment the pointer
				model.set("particleIndex", circleSystemPointer);
				circleSystemPointer++;
				return particle;
				break;
			case 'octagon':
				//get hte particle vector
				var particle = octaSystem.geometry.vertices[octaSystemPointer];
				//return it's index and increment the pointer
				model.set("particleIndex", octaSystemPointer);
				octaSystemPointer++;
				return particle;
				break;
			case 'circle_grad':
				//get hte particle vector
				var particle = circleGradSystem.geometry.vertices[circleGradSystemPointer];
				//return it's index and increment the pointer
				model.set("particleIndex", circleGradSystemPointer);
				circleGradSystemPointer++;
				return particle;
				break;
			default:
		}
	}

	function updateAll(model) {
		var index = model.get("particleIndex");
		var attributes, system;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		attributes.size.value[index] = model.get("size");
		attributes.ca.value[index] = model.get("color");
		system.geometry.vertices[index].x = model.get("x");
		system.geometry.vertices[index].y = model.get("y");
		attributes.size.needsUpdate = true;
		attributes.ca.needsUpdate = true;
		system.geometry.verticesNeedUpdate = true;

	}

	function updatePosition(model) {
		var index = model.get("particleIndex");
		var system;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		system.geometry.vertices[index].x = model.get("x");
		system.geometry.vertices[index].y = model.get("y");
		system.geometry.verticesNeedUpdate = true;
	}

	function positionParticle(model, x, y, callback) {
		var index = model.get("particleIndex");
		var system;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		//var easing = model.get("reblog_level") > 0 ? TWEEN.Easing.Elastic.Out : TWEEN.Easing.Linear.None;
		var easing = TWEEN.Easing.Linear.None;
		var tween = new TWEEN.Tween({
			x : system.geometry.vertices[index].x,
			y : system.geometry.vertices[index].y,
		}).to({
			x : x,
			y : y,
		}, RING.Util.randomInt(500, 800)).easing(easing).onUpdate(function() {
			system.geometry.vertices[index].x = this.x;
			system.geometry.vertices[index].y = this.y;
			system.geometry.verticesNeedUpdate = true;
		}).onComplete(function() {
			if(callback) {
				callback();
			}
		}).start();
		//.easing( TWEEN.Easing.Elastic.InOut )
	}

	//like position particle, but without the tween
	function positionInstant(model, x, y) {
		var index = model.get("particleIndex");
		var system;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		system.geometry.vertices[index].x = x;
		system.geometry.vertices[index].y = y;
	}

	function makeInvisible(model) {
		var index = model.get("particleIndex");
		var system;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		system.geometry.vertices[index].x = -1000;
		system.geometry.vertices[index].y = -1000;
		system.geometry.verticesNeedUpdate = true;
	}

	function updateColor(model) {
		var index = model.get("particleIndex");
		var attributes;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		attributes.ca.value[index] = model.get("color");
		attributes.ca.needsUpdate = true;
	}

	function updateSize(model) {
		var index = model.get("particleIndex");
		var attributes;
		//get an object from the array depending on the type of the object
		switch(model.get("style")) {
			case 'circle':
				attributes = circleAttributes;
				system = circleSystem;
				break;
			case 'circle_grad':
				attributes = circleGradAttributes;
				system = circleGradSystem;
				break;
			case 'octagon':
				attributes = octaAttributes;
				system = octaSystem;
				break;
			default:
				return;
		}
		attributes.size.value[index] = model.get("size");
		attributes.size.needsUpdate = true;
	}

	return {
		get : get,
		initialize : init,
		update : updateAll,
		updateSize : updateSize,
		updateColor : updateColor,
		updatePosition : updatePosition,
		position : positionParticle,
		makeInvisible : makeInvisible,
		positionInstant : positionInstant,
	}
}();
