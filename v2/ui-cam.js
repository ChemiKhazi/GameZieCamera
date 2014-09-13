$CamUI = {
	handedness: "left",
	init : function(){
		document.querySelector('#toggle-source').addEventListener('click', $VidStream.toggleStream, false);
		document.querySelector('#toggle-fullscreen').addEventListener('click', function(){
			if (screenfull.enabled) {
				if (screenfull.isFullscreen)
					screenfull.exit();
				else
					screenfull.request();
			}
		})
		document.querySelector('#toggle-hand').addEventListener('click', $CamUI.toggleHand);
	},
	toggleHand : function(){
		if (document.querySelector('body#hand-right') == null)
		{
			document.body.id = "hand-right";
		}
		else
		{
			document.body.id = "hand-left";
		}
	}
}

$CamUI.init();