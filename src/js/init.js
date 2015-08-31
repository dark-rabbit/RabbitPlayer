var fs = require ('fs');
var path = require ('path');
var wc = require ('webchimera.js');
var mm = require ('musicmetadata');
var gui = require ('nw.gui');
var win = gui.Window.get();


//
// VLC INIT
//
var vlc = wc.createPlayer ();


//
// RESPONSIVE
//

responsive ();

win.window.addEventListener ('resize', responsive);

function responsive () {

	var windowHeight = win.window.innerHeight;

	// player size is fixed
	var playerHeight = document.getElementById('player').offsetHeight;

	var fileExpHeight = windowHeight - playerHeight;
	document.getElementById('file-explorer').style.height = "" + fileExpHeight + "px";
	var fileBarHeight = document.getElementById('file-bar').offsetHeight;
	var filesHeight = fileExpHeight - fileBarHeight;
	document.getElementById('files').style.height = "" + filesHeight + "px";

	document.getElementById('lyrics').style.height = "" + fileExpHeight + "px";
}


// 
// TOOLS
//

function isReadable (extName) {

	var readableExt = [
		'.mp3', '.flac'
	];
	for (j = 0; j < readableExt.length; j++) {
		if (extName === readableExt [j]) {
			return true;
		}
	}
	return false;
}
