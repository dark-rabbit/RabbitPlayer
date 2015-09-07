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
		'mp3', 'flac', 'wav', 'aac', 'mp4'
	];
	for (j = 0; j < readableExt.length; j++) {
		if (extName === '.' + readableExt [j]) {
			return true;
		}
	}
	return false;
}
// library scan
function scanLib (musicPath, callback) {

	// file object prototype
	var result = {
		path: musicPath,
		name: path.basename (musicPath),
		isDir: true,
		isAlbum: false,
		subs: []
	};

	// read current dir
	fs.readdir (musicPath, function (err, files) {

		if (err) {

			console.error (err);

		} else {

			// indicate if it's over
			var pending = files.length;

			angular.forEach (files, function (file) {

				fs.lstat (path.join (musicPath, file), function (err, stats) {

					// directory case : recursive callback
					if (stats.isDirectory ()) {

						scanLib (path.join (musicPath, file), function (res) {

							// add only is contains something
							if (res.subs.length > 0) {

								result.subs.push (res);
							}
							pending--;
							if (!pending) {
								result.subs.sort (function (a, b) {
									return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
								});
								return callback (result);
							}
						});

					} else {
						// no dir case

						var tmpExt = path.extname (file);

						// check if vlc can read it
						if (isReadable (tmpExt)) {

							result.subs.push (
								{
									path: path.join (musicPath, file),
									name: file.slice (0, - tmpExt.length),
									isDir: false,
									isAlbum: false,
								}
							);
							result.isAlbum = true;
						}
						pending--;
						if (!pending) {
							result.subs.sort (function (a, b) {
								return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
							});
							return callback (result);
						}
					}
				});
			});
		}
	});
}
