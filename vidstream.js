var $VidStream = {
    video: null,
    canvas: null,
    context: null,
    texture: null,
    currentStream: -1,
    init: function(){
        console.log("Init Video Stream");
        $VidStream.video = document.querySelector('video');

        $VidStream.canvas = document.querySelector('#videoCanvas');
        // Set size of the video canvas
        $VidStream.canvas.width = $VidStream.canvas.height = $GzCam.sizeH;

        $VidStream.context = $VidStream.canvas.getContext('2d');
        // Fill canvas with black
        $VidStream.context.fillStyle = '#000000';
        $VidStream.context.fillRect( 0, 0, $GzCam.sizeH, $GzCam.sizeH );

        if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) {
            alert('This page needs a Web browser with the objects window.* and navigator.*!');
        }
        else {
            console.log("Fetching sources");
            // Check if possible to choose video source
            if (typeof MediaDevices === 'undefined'){
                // Can't choose source, call fetch sources with null
                $VidStream.fetchSources(null);
            } else {
                // Get source data
                navigator.mediaDevices.enumerateDevices().then($VidStream.fetchSources);
            }
        }
    },
    setupContext: function(){
        console.log("Setup context");
        $VidStream.video.removeEventListener('playing', $VidStream.setupContext);

        // Find smallest size of the video
        $VidStream.minVid = Math.min($VidStream.video.videoWidth, $VidStream.video.videoHeight);

        // Setup the region of the video element that needs to be copied to canvas
        $VidStream.copyPos = [0,0];
        if ($VidStream.video.videoWidth > $VidStream.minVid)
            $VidStream.copyPos[0] = Math.round(($VidStream.video.videoWidth - $VidStream.minVid) / 2);
        if ($VidStream.video.videoHeight > $VidStream.minVid)
            $VidStream.copyPos[1] = Math.round(($VidStream.video.videoHeight - $VidStream.minVid) / 2);
    },
    copyToCanvas: function(context){
        if ($VidStream.copyPos === undefined && $VidStream.video.readyState !== $VidStream.video.HAVE_ENOUGH_DATA )
            return false;
        // Copy the video over to the context
        $VidStream.context.drawImage($VidStream.video,
                        $VidStream.copyPos[0],$VidStream.copyPos[1],
                        $VidStream.minVid, $VidStream.minVid,
                        0, 0, $GzCam.sizeH, $GzCam.sizeH);
        return true;
    },
    fetchSources: function(sourceInfos) {
        console.log("FetchSources");
        navigator.getUserMedia = navigator.mediaDevices.getUserMedia;
        if (navigator.getUserMedia === undefined)
        {
            console.log("No getUserMedia");
            alert("Video not supported in browser");
            return;
        }

        $VidStream.sources = [];
        
        // if source infos is not null, collate the video sources
        if (sourceInfos !== null) {
            for (var i = 0; i != sourceInfos.length; ++i) {
                var sourceInfo = sourceInfos[i];
                if (sourceInfo.kind === "videoinput")
                {
                    console.log("Label:" + sourceInfo.label + ", Id:" + sourceInfo.deviceId);
                    $VidStream.sources.push(sourceInfo.deviceId);
                }
            }
        }
        $VidStream.fetchStream(0);
    },
    fetchStream: function(sourceIndex){
        // console.log("fetchStream " + sourceIndex);
        // Default parameters if no source info
        var constraints = {
            video: true,
            audio: false
        }

        // Actually have sources...
        if ($VidStream.sources.length > 0)
        {
            $VidStream.currentStream = sourceIndex;
            deviceIdString = $VidStream.sources[sourceIndex] + "";
            console.log("Chosen device ID: " + deviceIdString);
            constraints.video = {
                deviceId: {
                    exact: deviceIdString
                }
            };
        }

        navigator.mediaDevices.getUserMedia(constraints)
                .then($VidStream.gotStream)
                .catch($VidStream.noStream)
    },
    toggleStream: function(){
        if ($VidStream.sources.length == 0)
            return;

        var newSource = $VidStream.currentStream;
        newSource++;
        if(newSource >= $VidStream.sources.length)
            newSource = 0;

        $VidStream.video.pause();
        $VidStream.video.src = null;
        $VidStream.videoStream.stop();
        $VidStream.fetchStream(newSource);
    },
    gotStream: function(stream){
        console.log("gotStream");
        $VidStream.videoStream = stream;

        $VidStream.video.addEventListener('playing', $VidStream.setupContext);
        $VidStream.video.src = window.URL.createObjectURL(stream);
        $VidStream.video.play();
    },
    noStream: function(error) {
        console.log(error.message);
        alert('Access to camera was denied! ' + error.message);
    }
}