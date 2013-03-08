RING.Sound = Backbone.Model.extend({

	defaults : {
		"loaded" : 0,
		"playable" : false,
		"started" : false,
	},

	initialize : function(attributes, options) {
		if(Modernizr.webaudio) {
			//listen to the new posts being visible
			this.context = new webkitAudioContext();
			this.makeColors();
			//the buffers
			this.files = ["in0", 'in1', 'in2', 'in3', 'in4', 'out0', 'out1', 'out2', 'out3', 'out4'];
			//this.files = ['out0.wav', 'out1.wav', 'out2.wav', 'out0.wav', 'out1.wav', 'out2.wav'];
			this.inBuffer = [];
			this.outBuffer = [];
			//load the buffers
			for(var i = 0; i < this.files.length; i++) {
				if(i < 5) {
					var buffArray = this.inBuffer;
				} else {
					var buffArray = this.outBuffer;
				}
				this.loadBuffer(this.files[i], buffArray, i % 5)
			}
			//listen for changes in visibility
			var throttledPlay = _.throttle(this.soundModel, 100);
			this.listenTo(RING.tumblrCollection, "change:visible", throttledPlay);
			this.listenTo(RING.twitterCollection, "change:visible", throttledPlay);
			//listen for loading
			this.on("change:loaded", this.canPlay);
			this.on("change:started", this.canPlay);
			//the main output
			this.output = this.context.createGain();
			this.compressor = this.context.createDynamicsCompressor();
			this.output.connect(this.compressor);
			this.compressor.connect(this.context.destination);
			//mute it to start
			this.output.gain.value = 0;
		}
	},
	makeColors : function() {
		var blue = new THREE.Color().setRGB(40 / 255, 170 / 255, 225 / 255);
		var purple = new THREE.Color().setRGB(158 / 255, 65 / 255, 195 / 255);
		var yellow = new THREE.Color().setRGB(1, 226 / 255, 31 / 255);
		var red = new THREE.Color().setRGB(1, 48 / 255, 49 / 255);
		var green = new THREE.Color().setRGB(151 / 255, 201 / 255, 76 / 255);
		this.colors = [blue, yellow, purple, red, green];
	},
	//load a single file
	loadBuffer : function(url, buffArray, index) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', "./audio/" + url + ".mp3", true);
		xhr.responseType = 'arraybuffer';
		var self = this;
		xhr.onload = function(e) {
			//loaded
			self.context.decodeAudioData(xhr.response, function(buffer) {
				//decoded
				self.set("loaded", self.get("loaded") + 1);
				buffArray[index] = buffer;
			});
		}
		//send the request
		xhr.send();
	},
	canPlay : function(model) {
		if(this.get("started") && this.get("loaded") === this.files.length) {
			this.set("playable", true);
			this.output.gain.value = 1.;
		}
	},
	soundModel : function(model, visible) {
		if(this.get("playable")) {
			var source = this.context.createBufferSource();
			//pass it through a gain node
			var volume = RING.Util.scaleExp(model.get("size"), 10, 60, 0., 1.);
			volume = Math.min(volume, 1.);
			var gain = this.context.createGainNode();
			gain.gain.value = volume;
			source.connect(gain);
			//position it
			var panner = this.context.createPanner();
			panner.setPosition(model.get("x") / 200, model.get("y") / 200, 0);
			gain.connect(panner);
			panner.connect(this.output);
			//pick which buffer to play
			//get buffer from color
			var index = this.indexFromColor(model);
			if(visible) {
				if(index >= 0) {
					source.buffer = this.inBuffer[index];
				}
			} else {
				if(index >= 0) {
					source.buffer = this.outBuffer[index];
				}
			}
			source.start(.2);
		}
	},
	indexFromColor : function(model) {
		var color = model.get('color');
		for(var i = 0; i < this.colors.length; i++) {
			var testColor = this.colors[i];
			if(color.r === testColor.r && color.g === testColor.g && color.b === testColor.b) {
				return i;
			}
		}
		return -1;
	}
})