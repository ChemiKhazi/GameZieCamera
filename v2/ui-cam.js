$CamUI = {
	dpad: null,
	options: null,
	settings: null,
	palette: null,
	startVals: {},
	init : function(){
		$CamUI.dpad = document.querySelector('#dpad-settings');
		$CamUI.options = document.querySelector('#options');
		
		$CamUI.saveStart($CamUI.dpad, 'top');
		$CamUI.saveStart($CamUI.options, 'left');

		$CamUI.settings = document.querySelector('#settings');
		$CamUI.palette = document.querySelector('#palette');

		document.querySelector('#toggle-source').addEventListener('click', $VidStream.toggleStream, false);

		document.querySelector('#toggle-fullscreen').addEventListener('click', function(){
			if (screenfull.enabled) {
				if (screenfull.isFullscreen)
					screenfull.exit();
				else
					screenfull.request();
			}
		});

		// Toggle from Dpad to options
		document.querySelector('#toggle-settings').addEventListener('click', function(){ $CamUI.showOptions(true); });
		document.querySelector('#toggle-palette').addEventListener('click', function(){ $CamUI.showOptions(false); });
		// Toggle from options to dpad
		document.querySelector('#leave-options').addEventListener('click', function(){
            morpheus($CamUI.dpad, { top: $CamUI.startVals[$CamUI.dpad.id], duration: 250 });
            morpheus($CamUI.options, { left: $CamUI.startVals[$CamUI.options.id], duration: 250 });
		});

		document.querySelector('#show-settings').addEventListener('click', function(){$CamUI.showSetting(true);});
		document.querySelector('#show-palette').addEventListener('click', function(){$CamUI.showSetting(false);});

		// Palette options
		document.querySelector('#switch-palette').addEventListener('click', $GzCam.togglePalette, false);
		document.querySelector('#switch-color-mode').addEventListener('click', $GzCam.toggleColorMode, false);

		// Setting options
		var contrastControl = document.querySelector('#contrast');
		contrastControl.addEventListener('input', function(evt){
			$GzCam.uniforms.setting.value.x = 1 + evt.target.value * 0.1;
		});

		var brightnessControl = document.querySelector('#brightness');
		brightnessControl.addEventListener('input', function(evt){
			$GzCam.uniforms.setting.value.y = (evt.target.value / 5);
		});

		var ditherControl = document.querySelector('#threshold');
		ditherControl.addEventListener('input', function(evt){
			$GzCam.uniforms.setting.value.z = 1 + parseInt(evt.target.value);
		});

		// Main camera button
		document.querySelector('#snap').addEventListener('click', $GzCam.takeSnap);
	},
	saveStart: function(element, styleName){
		if ($CamUI.startVals[element.id] === undefined)
			$CamUI.startVals[element.id] = window.getComputedStyle(element)[styleName];
	},
	showOptions: function(isSettings){
        morpheus($CamUI.dpad, { top: '-130px', duration: 250});
        morpheus($CamUI.options, { left: '0px', duration: 250 });
        $CamUI.showSetting(isSettings);
	},
	showSetting: function(isSettings){
	    if (isSettings)
		{
			$CamUI.settings.style.display = "block";
			$CamUI.palette.style.display = "none";
		}
		else
		{
			$CamUI.settings.style.display = "none";
			$CamUI.palette.style.display = "block";
		}
	}
}