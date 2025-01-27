var $GzCam = {
	size: 256,
	sizeH: 256/2,
	defaults: {x:1, y:0, z:6},
	currentPal: 0,
	modeIndex: true,
	palettes: [
		[
			[49, 74, 99],
			[255, 99, 41],
			[115,198,198],
			[255, 214, 156]
		],
		[
			[8, 56, 8],
			[48, 96, 48],
			[136,168,8],
			[183, 220, 17]
		],
		[
			[41, 41, 156],
			[123, 49, 239],
			[239, 140, 140],
			[255, 198, 255]
		],
		[ // https://lospec.com/palette-list/ice-cream-gb
			[124, 63, 88],
			[235, 107, 111],
			[249, 168, 117],
			[255, 246, 211]
		],
		[ // https://lospec.com/palette-list/kirokaze-gameboy
			[51, 44, 80],
			[70, 135, 143],
			[148, 227, 68],
			[226, 243, 228]
		],
		[ // https://lospec.com/palette-list/wish-gb
			[98, 46, 76],
			[117, 80, 232],
			[96, 143, 207],
			[139, 229, 255]
		],
		[ // https://lospec.com/palette-list/earth-gb
			[119, 67, 70],
			[184, 118, 82],
			[172, 185, 101],
			[245, 242, 158]
		],
		[ // https://lospec.com/palette-list/bicycle
			[22, 22, 22],
			[171, 70, 70],
			[143, 155, 246],
			[240, 240, 240]
		],
		[ // https://lospec.com/palette-list/platinum
			[24, 48, 48],
			[80, 120, 104],
			[168, 192, 176],
			[224, 240, 232]
		],
		[ // https://lospec.com/palette-list/crimson
			[27, 3, 38],
			[122, 28, 75],
			[186, 80, 68],
			[239, 249, 214]
		],
		[ // https://lospec.com/palette-list/nintendo-super-gameboy
			[51, 30, 80],
			[166, 55, 37],
			[214, 142, 73],
			[247, 231, 198]
		],
		[ // https://lospec.com/palette-list/pokemon-sgb
			[24, 16, 16],
			[132, 115, 156],
			[247, 181, 140],
			[255, 239, 255]
		],
		[ //https://lospec.com/palette-list/kirby-sgb
			[44, 44, 150],
			[119, 51, 231],
			[231, 134, 134],
			[247, 190, 247]
		],
		[ // https://lospec.com/palette-list/grapefruit
			[101, 41, 108],
			[183, 101, 145],
			[244, 178, 107],
			[255, 245, 221]
		],
		[ // https://lospec.com/palette-list/metroid-ii-sgb
			[44, 23, 0],
			[4, 126, 96],
			[182, 37, 88],
			[174, 223, 30]
		],
		[ // https://lospec.com/palette-list/super-mario-land-2-sgb
			[0, 0, 0],
			[17, 198, 0],
			[223, 166, 119],
			[239, 247, 182]
		],
		[ // https://itch.io/post/57105
			[62, 62, 62],
			[253, 128, 198],
			[140, 223, 253],
			[255, 246, 140]
		]
	],
	webGl: function() {
		return ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();
	},
	init: function(){
		// console.log("Init GameZieCamera");

        // Setup the scene
		$GzCam.scene = new THREE.Scene();

		// Setup camera
		$GzCam.camera = new THREE.OrthographicCamera(-$GzCam.sizeH, $GzCam.sizeH,
													$GzCam.sizeH, -$GzCam.sizeH,
													1, 1000);
		$GzCam.scene.add($GzCam.camera);
		$GzCam.camera.position.z = 1;

		// Setup renderer
		if ( $GzCam.webGl() )
			$GzCam.renderer = new THREE.WebGLRenderer( {antialias:true, preserveDrawingBuffer: true} );
		else
			$GzCam.renderer = new THREE.CanvasRenderer();
		$GzCam.renderer.setSize($GzCam.size, $GzCam.size);
		document.getElementById('display').appendChild($GzCam.renderer.domElement);

        // Setup the video texture
		$GzCam.videoTexture = new THREE.Texture( $VidStream.canvas );
		$GzCam.videoTexture.minFilter = THREE.NearestFilter;
		$GzCam.videoTexture.magFilter = THREE.NearestFilter;

		// Setup shader uniforms
		$GzCam.uniforms = {
			baseTexture: { type: 't', value: $GzCam.videoTexture },
			setting: { type: "v3", value: new THREE.Vector3($GzCam.defaults.x, $GzCam.defaults.y, $GzCam.defaults.z) }
		};
		$GzCam.paletteToUniform(1);
		// Use a different lookup texture for higher density displays
		if (window.devicePixelRatio == 2) {
			$GzCam.uniforms.ditherTexture = { type: 't', value: THREE.ImageUtils.loadTexture('images/packedBayerX4.png') };
			$GzCam.uniforms.resolution = { type: "v4", value: new THREE.Vector4(16, 16, 512, 512) };
		}
		else {
			$GzCam.uniforms.ditherTexture = { type: 't',
												value: THREE.ImageUtils.loadTexture('images/packedBayerMaps.png') };
			$GzCam.uniforms.resolution = { type: "v4", value: new THREE.Vector4(8, 8, 256, 256) };
		}
		$GzCam.uniforms.ditherTexture.minFilter = THREE.NearestFilter;
		$GzCam.uniforms.ditherTexture.magFilter = THREE.NearestFilter;

		// Setup the two materials/shaders for the different color modes
		$GzCam.matNearest = new THREE.ShaderMaterial({
			uniforms: $GzCam.uniforms,
			vertexShader: document.querySelector('#vtx').innerHTML,
			fragmentShader: document.querySelector('#nearest-color').innerHTML
		});
		$GzCam.matIndex = new THREE.ShaderMaterial({
			uniforms: $GzCam.uniforms,
			vertexShader: document.querySelector('#vtx').innerHTML,
			fragmentShader: document.querySelector('#index-color').innerHTML
		});

		// Set up the plane to render to, using the nearest index material
		var geometry = new THREE.PlaneGeometry($GzCam.size, $GzCam.size);
		$GzCam.mesh = new THREE.Mesh(geometry, $GzCam.matIndex);
		$GzCam.mesh.position.set(0,0,0);
		$GzCam.scene.add($GzCam.mesh);

		$GzCam.render();
	},
	render: function(timestamp) {
		requestAnimationFrame($GzCam.render);

		if ($VidStream.copyToCanvas($GzCam.context))
			$GzCam.videoTexture.needsUpdate = true;
		$GzCam.renderer.render($GzCam.scene, $GzCam.camera);
	},
	takeSnap: function(){
		var source = $GzCam.renderer.domElement.toDataURL("image/png");
		var filmroll = document.getElementById("filmroll");
		var dateTime = new Date();
		img = document.createElement("img");
		img.src = source;
		img.height = 0;
		img.width = img.height = $GzCam.size;
		img.style.top = -$GzCam.size;
		var fileName = "GZ_Cam_%Y%M%D_%H%M%S";
		fileName = fileName.replace("%Y", dateTime.getFullYear())
							.replace("%M", ("0" + dateTime.getMonth()).slice(-2) )
							.replace("%D", ("0" + dateTime.getDate()).slice(-2))
							.replace("%H", ("0" + dateTime.getHours()).slice(-2))
							.replace("%M", ("0" + dateTime.getMinutes()).slice(-2))
							.replace("%S", ("0" + dateTime.getSeconds()).slice(-2));
		img.name = fileName;
		img.addEventListener('click', function(){
			download(img.src, fileName + ".png", "image/png");
		});
		filmroll.insertBefore(img, filmroll.firstChild);
		morpheus(img, { top: 0, duration: 1000 });
	},
	togglePalette: function(){
		$GzCam.currentPal++;
		if ($GzCam.currentPal >= $GzCam.palettes.length)
			$GzCam.currentPal = 0;
		$GzCam.paletteToUniform($GzCam.currentPal);
	},
	paletteToUniform: function(index){
		$GzCam.currentPal = index;
		// Calculate the color information in 0-1 space,
		// being stored in 0-255 space
		for (var i = 0; i < $GzCam.palettes[index].length; i++)
		{
			var color = $GzCam.palettes[index][i];
			var uniformName = 'pal' + (i+1);

			if ($GzCam.uniforms[uniformName] === undefined)
				$GzCam.uniforms[uniformName] = { type: 'v3' };

			$GzCam.uniforms[uniformName].value = new THREE.Vector3(color[0]/255,
																	color[1]/255,
																	color[2]/255);
		}

		// Next calculate the luminance of each color, for the shader
		if ($GzCam.uniforms.palLum === undefined)
			$GzCam.uniforms.palLum = { type: 'v4' };
		$GzCam.uniforms.palLum.value = new THREE.Vector4($GzCam.colorToLum($GzCam.uniforms.pal1.value),
														$GzCam.colorToLum($GzCam.uniforms.pal2.value),
														$GzCam.colorToLum($GzCam.uniforms.pal3.value),
														$GzCam.colorToLum($GzCam.uniforms.pal4.value));

	},
	colorToLum: function(color) {
		// vector dot operation to get luminance
		var luminance = 0;
		luminance += (color.x * 0.2125);
		luminance += (color.y * 0.7154);
		luminance += (color.z * 0.0721);
		return luminance;
	},
	toggleColorMode: function(){
		if ($GzCam.modeIndex)
		{
			$GzCam.mesh.material = $GzCam.matNearest;
			$GzCam.modeIndex = false;
		}
		else
		{
			$GzCam.mesh.material = $GzCam.matIndex;
			$GzCam.modeIndex = true;
		}
	}
}