$CamUI = {
	dpad: null,
	options: null,
	startVals: {},
	init : function(){
		$CamUI.dpad = document.querySelector('#dpad-settings');
		$CamUI.options = document.querySelector('#options');
		
		$CamUI.saveStart($CamUI.dpad, 'top');
		$CamUI.saveStart($CamUI.options, 'left');

		document.querySelector('#toggle-source').addEventListener('click', $VidStream.toggleStream, false);

		document.querySelector('#toggle-fullscreen').addEventListener('click', function(){
			if (screenfull.enabled) {
				if (screenfull.isFullscreen)
					screenfull.exit();
				else
					screenfull.request();
			}
		})

		var settingsControl = document.querySelector('#toggle-settings');
		settingsControl.addEventListener('click', function(){
            morpheus($CamUI.dpad, { top: '-130px', duration: 250});
            morpheus($CamUI.options, { left: '30px', duration: 250 });
		});

		var contrastControl = document.querySelector('#contrast')
		contrastControl.value = $GzCam.defaults.x;
		contrastControl.addEventListener('input', function(evt){
			$GzCam.uniforms.setting.value.x = (evt.target.value/5) * 0.5;
		});

		var ditherControl = document.querySelector('#threshold');
		ditherControl.value = $GzCam.defaults.y;
		ditherControl.addEventListener('input', function(evt){
			$GzCam.uniforms.setting.value.y = evt.target.value;
		});

		document.querySelector('#leave-options').addEventListener('click', function(){

            morpheus($CamUI.dpad, { top: $CamUI.startVals[$CamUI.dpad.id], duration: 250 });
            morpheus($CamUI.options, { left: $CamUI.startVals[$CamUI.options.id], duration: 250 });
		});

		document.querySelector('#snap').addEventListener('click', $GzCam.takeSnap);
	},
	saveStart: function(element, styleName){
		if ($CamUI.startVals[element.id] === undefined)
			$CamUI.startVals[element.id] = window.getComputedStyle(element)[styleName];
	}
}