var $GzCam = {
	size: 256,
	sizeH: 256/2,
	defaults: {x:0, y:6},
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

		// Setup material settings
		$GzCam.uniforms = {
			baseTexture: { type: 't', value: $GzCam.videoTexture },
			pal1: { type: "v3", value: new THREE.Vector3(0.10,0.25,0.17) },
			pal2: { type: "v3", value: new THREE.Vector3(0.30,0.47,0.20) },
			pal3: { type: "v3", value: new THREE.Vector3(0.66,0.74,0.23) },
			pal4: { type: "v3", value: new THREE.Vector3(0.82,0.88,0.56) },
			setting: { type: "v2", value: new THREE.Vector2($GzCam.defaults.x, $GzCam.defaults.y) }
		};

		if (window.devicePixelRatio == 2) {
			$GzCam.uniforms.ditherTexture = { type: 't', value: THREE.ImageUtils.loadTexture('images/packedBayerX4.png') };
			$GzCam.uniforms.resolution = { type: "v2", value: new THREE.Vector2(16, 16) };
		}
		else {
			$GzCam.uniforms.ditherTexture = { type: 't',
												value: THREE.ImageUtils.loadTexture('images/packedBayerMaps.png') };
			$GzCam.uniforms.resolution = { type: "v2", value: new THREE.Vector2(8, 8) };
		}
		$GzCam.uniforms.ditherTexture.minFilter = THREE.NearestFilter;
		$GzCam.uniforms.ditherTexture.magFilter = THREE.NearestFilter;

		// Setup actual material
		$GzCam.material = new THREE.ShaderMaterial({
			uniforms: $GzCam.uniforms,
			vertexShader: document.querySelector('#vtx').innerHTML,
			fragmentShader: document.querySelector('#frg').innerHTML
		});

		var geometry = new THREE.PlaneGeometry($GzCam.size, $GzCam.size);
		$GzCam.mesh = new THREE.Mesh(geometry, $GzCam.material);
		// $GzCam.mesh.position.set(0.5,0.5,0);
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
		img = document.createElement("img");
		img.src = source;
		img.height = 0;
		img.width = img.height = $GzCam.size;
		img.style.top = -$GzCam.size;
		filmroll.insertBefore(img, filmroll.firstChild);
		morpheus(img, { top: 0, duration: 1000 });
	}
}