(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// Globals, because whatevs
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var buffer = document.getElementById('buffer');
var bufferContext = buffer.getContext('2d');
var videoStream = null;
var thresholdControl = document.getElementById('threshold');

var btnRecord = document.getElementById("record-button");
var btnPicture = document.getElementById("picture-button");

var gbWidth = 256;
var gbHeight = 224;

var recordGif = null;
var recordStart = null;
var recordRendering = false


/*
monochrome code partially from
https://github.com/meemoo/iframework/blob/gh-pages/src/nodes/image-monochrome-worker.js
*/
var bayerThresholdMap = [
	[  1,  9,  3, 11 ],
	[ 13,  5, 15,  7 ],
	[  4, 12,  2, 10 ],
	[ 16,  8, 14,  6 ]
/*	[ 0, 12, 3, 15],
	[ 8, 4, 11, 7],
	[ 2, 14, 1, 13],
	[ 10, 6, 9, 5]*/
];

function getClosest(color)
{
	var palette = [
		[255, 214, 156],
		[115,198,198],
		[255, 99, 41],
		[49, 74, 99]];
	
	var closest = Number.MAX_VALUE;
	var closestColor = palette[3];
	for (var i = 0; i < palette.length; i++)
	{
		// Calculate closeness
		var testPal = palette[i];
		var rVal
		var closeness = (color[0] - testPal[0]) * (color[0] - testPal[0]);
		closeness += (color[1] - testPal[1]) * (color[1] - testPal[1]);
		closeness += (color[2] - testPal[2]) * (color[2] - testPal[2]);
		
		if (closeness < closest)
		{
			closestColor = testPal;
			closest = closeness;
		}
	}
	return closestColor;
}

function monochrome(imageData, threshold){

  var imageDataLength = imageData.data.length;
  
  var w = imageData.width;
  var newPixel, err;

  for (var currentPixel = 0; currentPixel <= imageDataLength; currentPixel+=4) {
	// 4x4 Bayer ordered dithering algorithm
	var x = currentPixel/4 % w;
	var y = Math.floor(currentPixel/4 / w);
	
	var row = (y+1) * (w * 4);
	
	var factor = bayerThresholdMap[x%4][y%4];
	var pixelColor = [];
	for (var i = 0; i < 3; i++)
	{
		pixelColor[i] = imageData.data[currentPixel + i] + factor * threshold;
	}
	pixelColor = getClosest(pixelColor);
	for (var i = 0; i < 3; i++)
	{
		imageData.data[currentPixel + i] = pixelColor[i];
	}
  }

  return imageData;
}
/*
end monochrome code
*/

/* Camera handling */
function noStream() {
    alert('Access to camera was denied!');
}

function gotStream(stream)
{
	buffer.width = canvas.width = gbWidth;
	buffer.height = canvas.height = gbHeight;
	
    videoStream = stream;
    video.onerror = function () {
        alert('video.onerror');
    };
    stream.onended = noStream;
    if (window.webkitURL) video.src = window.webkitURL.createObjectURL(stream);
    else if (video.mozSrcObject !== undefined) { //FF18a
        video.mozSrcObject = stream;
        video.play();
    } else if (navigator.mozGetUserMedia) { //FF16a, 17a
        video.src = stream;
        video.play();
    } else if (window.URL) video.src = window.URL.createObjectURL(stream);
    else video.src = stream;
	
	requestAnimationFrame(updateCamera);
}
/* End camera handling */

/* Recording functions */
function toggleRecord()
{
	if (recordGif == null)
	{
		recordGif = new GIF({workers: 3, quality: 10});
		recordRendering = false;
		btnRecord.innerHTML = "Stop Recording";
	}
	else if (!recordRendering)
	{
		recordGif.on('finished', function(blob) {
			if (recordRendering)
			{
				newSnap(URL.createObjectURL(blob));
				recordGif = null;
				recordStart = null;
				recordRendering = false;
				btnRecord.innerHTML = "GIF";
			}
		});
		recordGif.render();
		recordRendering = true;
		btnRecord.innerHTML = "Rendering...";
	}
}

function snap()
{
	newSnap(canvas.toDataURL("image/png"));
}

function newSnap(source)
{
	var filmroll = document.getElementById("filmroll");
	img = document.createElement("img");
	img.src = source;
	img.width = canvas.width;
	img.height = canvas.height;
	filmroll.insertBefore(img, filmroll.firstChild);
}

/* update function */
function updateCamera(timestamp)
{
	// Figure out the part of the video we need to grab
	var targetWidthRatio = gbWidth/gbHeight;
	var videoWidthRatio = video.videoWidth/video.videoHeight;
	
	var sourceX, sourceY, sourceWidth, sourceHeight = 0;
	
	if (videoWidthRatio < targetWidthRatio)
	{
		targetHeightRatio = gbHeight/gbWidth;
		sourceWidth = video.videoWidth;
		sourceHeight = Math.floor(video.videoWidth * targetHeightRatio);
	}
	else
	{
		sourceHeight = video.videoHeight;
		sourceWidth = video.videoHeight * targetWidthRatio;
	}
	
	sourceX = Math.floor((video.videoWidth/2)-(sourceWidth/2));
	sourceY = Math.floor((video.videoHeight/2) - (sourceHeight/2));
	// Copy that part of the video to the buffer context
	bufferContext.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, gbWidth, gbHeight);
	var imageData = bufferContext.getImageData(0, 0, gbWidth, gbHeight);
	// Run the buffer through the monochrome code
	var monoImage = monochrome(imageData, thresholdControl.value);
	
	context.putImageData(monoImage, 0, 0);
	
	// If user is recording, put frames into recorder
	if (recordGif != null)
	{
		// first frame of recording not really recorded
		if (recordStart == null)
		{
			recordStart = timestamp;
		}
		else if (!recordRendering)
		{
			var delayTime = Math.round(timestamp-recordStart);
			recordStart = timestamp;
			// Copy the current frame data into the recording
			// or else gif.js will start grabbing frames from
			// the canvas *after* recording has been stopped
			recordGif.addFrame(canvas, {copy:true, delay:delayTime});
		}
	}
	
	requestAnimationFrame(updateCamera);
}

function start() {
	btnRecord.onclick = toggleRecord;
	btnPicture.onclick = snap;
	
    if ((typeof window === 'undefined') || (typeof navigator === 'undefined'))
		alert('This page needs a Web browser with the objects window.* and navigator.*!');
    else if (!(video && canvas)) alert('HTML context error!');
    else {
        //log('Get user media…');
        if (navigator.getUserMedia) navigator.getUserMedia({
            video: true
        }, gotStream, noStream);
        else if (navigator.oGetUserMedia) navigator.oGetUserMedia({
            video: true
        }, gotStream, noStream);
        else if (navigator.mozGetUserMedia) navigator.mozGetUserMedia({
            video: true
        }, gotStream, noStream);
        else if (navigator.webkitGetUserMedia) navigator.webkitGetUserMedia({
            video: true
        }, gotStream, noStream);
        else if (navigator.msGetUserMedia) navigator.msGetUserMedia({
            video: true,
            audio: false
        }, gotStream, noStream);
        else alert('getUserMedia() not available from your Web browser!');
    }
}

// Start once dom has been loaded
document.addEventListener('DOMContentLoaded', start ,false);