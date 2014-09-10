var $GzCam = {
	size: 256,
	sizeH: 256/2,
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
			$GzCam.renderer = new THREE.WebGLRenderer( {antialias:true} );
		else
			$GzCam.renderer = new THREE.CanvasRenderer();
		$GzCam.renderer.setSize($GzCam.size, $GzCam.size);
		document.getElementById('display').appendChild($GzCam.renderer.domElement);

        // Setup the video texture
		$GzCam.videoTexture = new THREE.Texture( $VidStream.canvas );
		$GzCam.videoTexture.minFilter = THREE.NearestFilter;
		$GzCam.videoTexture.magFilter = THREE.NearestFilter;

		// Setup material material
		$GzCam.material = new THREE.ShaderMaterial({
			uniforms: {
				baseTexture : { type: 't', value: $GzCam.videoTexture }
			},
			vertexShader: document.querySelector('#vtx').innerHTML,
			fragmentShader: document.querySelector('#frg').innerHTML
		});

		var geometry = new THREE.PlaneGeometry($GzCam.size, $GzCam.size);
		$GzCam.mesh = new THREE.Mesh(geometry, $GzCam.material);
		$GzCam.mesh.position.set(0,0,0);
		$GzCam.scene.add($GzCam.mesh);

		$GzCam.render();
	},
	render: function(timestamp) {
		requestAnimationFrame($GzCam.render);

		if ($VidStream.copyToCanvas($GzCam.context))
			$GzCam.videoTexture.needsUpdate = true;
		$GzCam.renderer.render($GzCam.scene, $GzCam.camera);
	}
}