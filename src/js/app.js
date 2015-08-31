var app = angular.module ('app', ['ngSanitize']);

app.controller('appCtrl', ['$scope', '$interval', function ($scope, $interval) {

	//
	// PLAYER
	//

	// playing state
	$scope.isPlaying = false;

	// muted state
	$scope.isMuted = false;

	// vol bar display
	$scope.showVol = false;

	// togglePause
	$scope.togglePause = function () {

		if (vlc.playlist.itemCount > 0) {

			$scope.isPlaying = !$scope.isPlaying;

			vlc.playlist.togglePause ();
		}
	};
	$scope.prev = function () {

		vlc.playlist.prev ();
		document.getElementById('prog-lvl').style.width = "0%";
		$scope.isPlaying = true;
	};
	$scope.next = function () {

		vlc.playlist.next ();
		document.getElementById('prog-lvl').style.width = "0%";
		$scope.isPlaying = true;
	};

	// status bars refresh
	$interval (function () {

		if ($scope.isPlaying) {

			// prog bar
			document.getElementById('prog-lvl').style.width =
				"" + (100 * vlc.input.position) + "%";

			// vol bar
			if ($scope.isVolumeChanging) {
				document.getElementById('vol-lvl').style.height =
					"" + (100 - vlc.audio.volume / 2) + "%";
			}
		}
	}, 1000);

	// prog bar click
	$scope.goTo = function (event) {

		// vlc refresh
		vlc.input.time =
			Math.floor ((event.offsetX / document.getElementById('prog-bar').offsetWidth) * vlc.input.length);

		// view refresh
		document.getElementById('prog-lvl').style.width =
			"" + (100 * vlc.input.position) + "%";
	};

	// vol bar click
	$scope.volTo = function (e) {

		$scope.mute (false);

		var volBar = document.getElementById('vol-bar');
		var volLvl = document.getElementById('vol-lvl');

		var tmpVol =
			Math.floor ((1 - e.offsetY / volBar.offsetHeight) * 100);

		// ui refresh
		volLvl.style.height =
			"" + (100 - tmpVol) + "%";

		// vlc refresh
		vlc.audio.volume = tmpVol;

		// volBar.addEventListener ('mousemove', function (e) {
		//
		// 	e.preventDefault();
		//
		// 	// stop refreshing volume
		// 	$scope.isVolumeChanging = true;
		//
		// 	var tmpVol =
		// 		Math.floor ((1 - e.offsetY / volBar.offsetHeight) * 100);
		//
		// 	// ui refresh
		// 	volLvl.style.height =
		// 		"" + (100 - tmpVol) + "%";
		//
		// 	// vlc refresh
		// 	vlc.audio.volume = tmpVol;
		// });
		//
		// // remove the listener if mouse up
		// volBar.addEventListener ('mouseup', function (e) {
		//
		// 	e.preventDefault();
		// 	volBar.removeEventListener ('mousemove');
		// 	$scope.isVolumeChanging = false;
		// });
	};
	// $scope.isVolumeChanging = false;
	// mute
	//
	$scope.mute = function (bool) {
		$scope.isMuted = bool;
		vlc.audio.mute = bool;
	};


	//
	// PLAYLIST
	//

	$scope.playlist = [];

	$scope.playlistMode = false;

	// check if playlist item is open
	// play the clicked playlist item
	$scope.playItem = function (index) {

		$scope.isPlaying = true;
		vlc.playlist.playItem (index);
		document.getElementById('prog-lvl').style.width = "0%";
	};


	//
	// FILES
	//

	// files array
	$scope.library = {};
	$scope.files = [];
	$scope.playingAlbum = "";

	// play album
	$scope.playAlbum = function () {

		if ($scope.isPlaying) {

			$scope.togglePause ();

		} else {

			if ($scope.playingAlbum === $scope.files[$scope.files.length - 1].path) {

				vlc.playlist.playItem (0);

			} else {

				$scope.playingAlbum = $scope.files[$scope.files.length - 1].path;

				vlc.playlist.clear ();
				angular.forEach ($scope.files[$scope.files.length - 1].subs, function (file) {

					if (!file.isDir) {

						vlc.playlist.add ('file://' + file.path);
					}
				});
				vlc.playlist.play ();
			}

			$scope.isPlaying = true;
		}
	};

	// select a file, an album, or a directory
	$scope.selectFile = function (file, index) {

		if (file.isDir) {

			$scope.files.push (file);
			document.getElementById('files').scrollTop = 0;

		} else {

			// file is already opened
			if ($scope.isOpen (file, index)) {

				$scope.togglePause ();

			} else  {

				// album is already opened
				if ($scope.playingAlbum === $scope.files[$scope.files.length - 1].path) {

					vlc.playlist.playItem (index);
					$scope.isPlaying = true;

				} else {

					$scope.playingAlbum = $scope.files[$scope.files.length - 1].path;

					vlc.playlist.clear ();
					angular.forEach ($scope.files[$scope.files.length - 1].subs, function (tmpFile) {

						if (!tmpFile.isDir) {

							vlc.playlist.add ('file://' + tmpFile.path);

							if (file.name === tmpFile.name) {

								vlc.playlist.playItem (vlc.playlist.itemCount - 1);
								$scope.isPlaying = true;
							}
						}
					});
				}
				// get the lyrics
				// intégrer le mm à getLyrics, qui ne prendra qu'un param, le path
				mm (fs.createReadStream (file.path), function  (err, tags) {

					getLyrics (tags.artist[0], tags.title, function (res) {

						$scope.lyrics = res;
						document.getElementById('lyrics').scrollTop = 0;
					});
				});
			}
		}
	};

	// check if file is open
	$scope.isOpen = function (file, index) {


		return (
			$scope.playingAlbum === $scope.files[$scope.files.length - 1].path &&
				!file.isDir &&
				index === vlc.playlist.currentItem
		);
	};

	// back in the file three
	$scope.navBack = function () {	

		if ($scope.files.length > 1) {

			$scope.files.pop ();
		}
	};

	// library scan
	$scope.scanLib = function (musicPath, callback) {

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

							$scope.scanLib (path.join (musicPath, file), function (res) {

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
										isAlbum: false
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
	};

	// initial read
	$scope.scanLib ('/home/lapin/Data/Music/Local', function (result) {

		$scope.library = result;
		$scope.files.push (result);
	});
}]);


