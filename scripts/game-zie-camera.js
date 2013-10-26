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
var btnOpts = document.getElementById("show-opts-button");
var gbWidth = 128;
var gbHeight = 112;

var optionsPanel = document.getElementById("options");
optionsPanel.style.visibility = "hidden";

var recordGif = null;
var recordStart = null;
var recordRendering = false

var colorMode = "index";

/*
monochrome code partially from
https://github.com/meemoo/iframework/blob/gh-pages/src/nodes/image-monochrome-worker.js
*/
var bayerThresholdMap = [
/*	[  1,  9,  3, 11 ],
	[ 13,  5, 15,  7 ],
	[  4, 12,  2, 10 ],
	[ 16,  8, 14,  6 ]*/
	[ 0, 12, 3, 15],
	[ 8, 4, 11, 7],
	[ 2, 14, 1, 13],
	[ 10, 6, 9, 5]
];

var lumR = [];
var lumG = [];
var lumB = [];
for (var i=0; i<256; i++) {
  lumR[i] = i*0.299;
  lumG[i] = i*0.587;
  lumB[i] = i*0.114;
  /*lumR[i] = i*0.2126;
  lumG[i] = i*0.7152;
  lumB[i] = i*0.0722;*/
}

// RGB and minimum luminance
var palette = [
	[49, 74, 99, 0],
	[255, 99, 41, 90],
	[115,198,198, 135],
	[255, 214, 156, 170]
	];
	
var paletteChoices = [
	[
	[49, 74, 99, 0],
	[255, 99, 41, 90],
	[115,198,198, 135],
	[255, 214, 156, 170]
	],
	[
	[8, 56, 8, 0],
	[48, 96, 48, 90],
	[136,168,8, 135],
	[183, 220, 17, 170]
	],
	[
	[41, 41, 156, 0],
	[123, 49, 239, 90],
	[239, 140, 140, 135],
	[255, 198, 255, 170]
	]
];

function swapPalette(index)
{
palette = paletteChoices[index];
}

function toggleColorMode()
{
if (colorMode == "index")
	colorMode = "near";
else
	colorMode = "index";
}

function getIndex(color)
{
	var luminance = Math.floor(lumR[color[0]] + lumG[color[1]] + lumB[color[2]]);
	var paletteIndex = 0;
	var maxLum = 0;
	for (var palIdx = 0; palIdx < palette.length; palIdx++)
	{
		var palLum = palette[palIdx][3];
		if (luminance >= palLum && palLum > maxLum)
		{
			paletteIndex = palIdx;
			maxLum = palLum;
		}
	}
	return [palette[paletteIndex][0],
			palette[paletteIndex][1],
			palette[paletteIndex][2]];// [luminance,luminance,luminance];
}

function getClosest(color)
{
	var closest = Number.MAX_VALUE;
	var closestColor = palette[3];
	for (var i = 0; i < palette.length; i++)
	{
		// Calculate closeness
		var testPal = palette[i];
		var closeness = 0;
		for (var channelIdx = 0; channelIdx < 3; channelIdx++)
		{
			var value = (color[channelIdx] - testPal[channelIdx]);
			closeness += value * value;
		}
		
		if (closeness < closest)
		{
			closestColor = testPal;
			closest = closeness;
		}
	}
	return closestColor;
}

function processImage(imageData, threshold)
{
  var scaledImageData = context.createImageData(gbWidth * 2, gbHeight * 2);
  var imageDataLength = imageData.data.length;
  
  var w = imageData.width;

  for (var currentPixel = 0; currentPixel < imageDataLength; currentPixel+=4) {
	// 4x4 Bayer ordered dithering algorithm
	var x = currentPixel/4 % w;
	var y = Math.floor(currentPixel/4 / w);
	
	// Pack all the calculated dithered colors
	var factor = bayerThresholdMap[x%4][y%4];
	var pixelColor = [];
	for (var i = 0; i < 3; i++)
	{
		pixelColor[i] = Math.min(255, imageData.data[currentPixel + i] + factor * threshold);
	}
	// Get the color
	if (colorMode == "index")
		pixelColor = getIndex(pixelColor);
	else
		pixelColor = getClosest(pixelColor);
	
	// Put the caclulated colors into the scaled image data
	var scaledPixel = (2 * (y * w * 8)) + x * 8;
	var nextRowPixel = scaledPixel + (w * 8);
	for (var i = 0; i < 4; i++)
	{
		if (i != 3)
		{
			scaledImageData.data[scaledPixel + i] = scaledImageData.data[scaledPixel + i + 4] = pixelColor[i];
			scaledImageData.data[nextRowPixel + i] = scaledImageData.data[nextRowPixel + i + 4] = pixelColor[i];
		}
		else
		{
			scaledImageData.data[scaledPixel + 3] = scaledImageData.data[scaledPixel + 7] = 255;
			scaledImageData.data[nextRowPixel + 3] = scaledImageData.data[nextRowPixel + 7] = 255;
		}
	}
  }
  
  // Put the scaled image into the context
  context.putImageData(scaledImageData, 0, 0);
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
	buffer.width = gbWidth;
	buffer.height = gbHeight;
	canvas.width = gbWidth * 2;
	canvas.height = gbHeight * 2;
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
		recordGif = new GIF({workers: 10, quality: 10});
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

function toggleOptions()
{
	if (optionsPanel.style.visibility == "hidden")
	{
		optionsPanel.style.visibility = "visible";
		optionsPanel.style.height = "auto";
	}
	else
	{
		optionsPanel.style.visibility = "hidden";
		optionsPanel.style.height = "0px";
	}
}

/* update function */
function updateCamera(timestamp)
{
	// Figure out the part of the video we need to grab
	var sourceX, sourceY, sourceWidth, sourceHeight = 0;
	sourceWidth = gbWidth * 3.5;
	sourceHeight = gbHeight * 3.5;
	
	if (sourceWidth > video.videoWidth)
	{
		var targetHeightRatio = gbHeight/gbWidth;
		sourceWidth = video.videoWidth;
		souceHeight = Math.floor(video.videoWidth * targetHeightRatio);
	}
	
	sourceX = Math.floor((video.videoWidth/2) - (sourceWidth/2));
	sourceY = Math.floor((video.videoHeight/2) - (sourceHeight/2));
	// Copy that part of the video to the buffer context
	bufferContext.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, gbWidth, gbHeight);
	var imageData = bufferContext.getImageData(0, 0, gbWidth, gbHeight);
	// Run the buffer through the monochrome code
	processImage(imageData, thresholdControl.value);
	
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
	btnOpts.onclick = toggleOptions;
	
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