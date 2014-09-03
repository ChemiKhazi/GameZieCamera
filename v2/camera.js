var gzCam = {
	render: function(timestamp) {
		requestAnimationFrame(gzCam.render);
		gzCam.renderer.render(gzCam.scene, gzCam.camera);
	}
}

document.addEventListener('DOMContentLoaded', setup, false);

function setup()
{
	gzCam.size = 256;
	gzCam.sizeH = gzCam.size/2;

	gzCam.scene = new THREE.Scene();
	gzCam.camera = new THREE.OrthographicCamera(-gzCam.sizeH, gzCam.sizeH, gzCam.sizeH, -gzCam.sizeH, 1, 1000);

	gzCam.renderer = new THREE.WebGLRenderer();
	gzCam.renderer.setSize(gzCam.size, gzCam.size);

	// gzCam.material = new THREE.MeshBasicMaterial({color: 0x00ff00});
	gzCam.material = new THREE.ShaderMaterial({
		vertexShader: document.getElementById('vtx').textContent,
		fragmentShader: document.getElementById('frg').textContent
	})

	var geometry = new THREE.PlaneGeometry(gzCam.size, gzCam.size);
	gzCam.mesh = new THREE.Mesh(geometry, gzCam.material);
	gzCam.scene.add(gzCam.mesh);

	document.getElementById('display').appendChild(gzCam.renderer.domElement);
	gzCam.camera.position.z = gzCam.sizeH;

	gzCam.render();
}