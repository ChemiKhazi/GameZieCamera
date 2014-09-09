var $VidStream = {
    video: null,
    canvas: null,
    context: null,
    texture: null,
    init: function(){
        // console.log("Init Video Stream");
        $VidStream.video = document.querySelector('video');
        $VidStream.canvas = document.querySelector('#videoCanvas');

        // Setup a temporary color on canvas
        $VidStream.canvas.width = 16;
        $VidStream.canvas.height = 16;
        var tempContext = $VidStream.canvas.getContext('2d');
        tempContext.fillStyle = "#000";
        tempContext.fillRect(0,0,16,16);

        // Create the texture that references the canvas
        $VidStream.texture = new THREE.Texture($VidStream.canvas);
        $VidStream.texture.minFilter = THREE.NearestFilter;
        $VidStream.texture.magFilter = THREE.NearestFilter;

        if ((typeof window === 'undefined') || (typeof navigator === 'undefined')) {
            alert('This page needs a Web browser with the objects window.* and navigator.*!');
        }
        else if (!($VidStream.video && $VidStream.canvas)) {
            alert('HTML context error!');
        }
        else {

            // Check if possible to choose video source
            if (typeof MediaStreamTrack === 'undefined'){
                // Can't choose source, call fetch sources with null
                $VidStream.fetchSources(null);
            } else {
                // Get source data
                MediaStreamTrack.getSources($VidStream.fetchSources);
            }
        }
    },
    setupContext: function(){
        $VidStream.video.removeEventListener('playing', $VidStream.setupContext);

        $VidStream.canvas.width = $VidStream.video.videoWidth;
        $VidStream.canvas.height = $VidStream.video.videoHeight;
        $VidStream.context = $VidStream.canvas.getContext('2d');

        $VidStream.context.fillStyle = '#000';
        $VidStream.context.fillRect( 0, 0, $VidStream.video.videoWidth, $VidStream.video.videoHeight );

        $GzCam.material.needsUpdate = true;
    },
    copyToCanvas: function(){
        if ($VidStream.context === null || $VidStream.video.readyState !== $VidStream.video.HAVE_ENOUGH_DATA )
            return;
        // Copy the video over to the context
        $VidStream.context.drawImage($VidStream.video, 0, 0,
                                    $VidStream.video.videoWidth, $VidStream.video.videoHeight);
        $VidStream.texture.needsUpdate = true;
    },
    fetchSources: function(sourceInfos) {
        // console.log("FetchSources: " + sourceInfos);
        navigator.getUserMedia = navigator.getUserMedia ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia ||
                                navigator.msGetUserMedia;
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
                if (sourceInfo.kind === "video")
                {
                    $VidStream.sources[$VidStream.sources.length] = sourceInfo.id;
                }
            }
        }
        $VidStream.fetchStream(0);
    },
    fetchStream: function(sourceIndex){
        // console.log("fetchStream " + sourceIndex);
        // Default parameters if no source info
        var parameters = {
            video: true,
            audio: false
        }
        if ($VidStream.sources.length > 0)
        {
            parameters.video = {optional: [{sourceId: $VidStream.sources[sourceIndex]}] };
        }

        navigator.getUserMedia(parameters, $VidStream.gotStream, $VidStream.noStream);
    },
    gotStream: function(stream){
        // console.log("gotStream");
        $VidStream.videoStream = stream;

        // Setup event for error or end of video stream
        $VidStream.video.onerror = function () {
            alert('video.onerror');
        };
        stream.onended = $VidStream.noStream;

        $VidStream.context = null;
        $VidStream.video.addEventListener('playing', $VidStream.setupContext);

        if (window.webkitURL) {
            $VidStream.video.src = window.webkitURL.createObjectURL(stream);
        } else if (video.mozSrcObject !== undefined) { //FF18a
            $VidStream.video.mozSrcObject = stream;
        } else if (navigator.mozGetUserMedia) { //FF16a, 17a
            $VidStream.video.src = stream;
        } else if (window.URL) {
            $VidStream.video.src = window.URL.createObjectURL(stream);
        } else {
            $VidStream.video.src = stream;
        }
        $VidStream.video.play();

        $GzCam.init();
    },
    noStream: function() {
        alert('Access to camera was denied!');
    }
}