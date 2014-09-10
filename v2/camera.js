var $GzCam = {
	size: 256,
	sizeH: 256/2,
	webGl: function() {
		return ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();
	},
	init: function(){
		console.log("Init GameZieCamera");
		$GzCam.scene = new THREE.Scene();
		$GzCam.camera = new THREE.OrthographicCamera(-$GzCam.sizeH, $GzCam.sizeH, $GzCam.sizeH, -$GzCam.sizeH, 1, 1);

		if ( $GzCam.webGl() )
			$GzCam.renderer = new THREE.WebGLRenderer( {antialias:true} );
		else
			$GzCam.renderer = new THREE.CanvasRenderer();
		$GzCam.renderer.setSize($GzCam.size, $GzCam.size);

		// Setup a default material
		$GzCam.material = new THREE.ShaderMaterial({
			vertexShader: document.getElementById('vtx').textContent,
			fragmentShader: document.getElementById('frg').textContent
		})

		var geometry = new THREE.PlaneGeometry($GzCam.size, $GzCam.size);
		$GzCam.mesh = new THREE.Mesh(geometry, $GzCam.material);
		$GzCam.scene.add($GzCam.mesh);

		document.getElementById('display').appendChild($GzCam.renderer.domElement);
		$GzCam.camera.position.z = 1;

		$GzCam.render();
	},
	setupMaterial: function(){
		$GzCam.material = new THREE.MeshBasicMaterial({
			map: $VidStream.texture,
			overdraw: true,
			side: THREE.DoubleSide
		});
		$GzCam.mesh.material = $GzCam.material;
	},
	render: function(timestamp) {
		requestAnimationFrame($GzCam.render);

		$VidStream.copyToCanvas();

		$GzCam.renderer.render($GzCam.scene, $GzCam.camera);
	}
}