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
		// document.getElementById('prog-lvl').style.width = "0%";
		$scope.isPlaying = true;
	};
	$scope.next = function () {

		vlc.playlist.next ();
		// document.getElementById('prog-lvl').style.width = "0%";
		$scope.isPlaying = true;
	};

	// prog bar click
	$scope.goTo = function (event) {

		// vlc refresh
		vlc.input.time =
			Math.floor ((event.offsetX / document.getElementById('prog-bar').offsetWidth) * vlc.input.length);

		// view refresh
		document.getElementById('prog-lvl').style.width =
			"" + (100 * vlc.input.position) + "%";
	};

	// status bars refresh
	$interval (function () {

		if ($scope.isPlaying) {

			// prog bar
			document.getElementById('prog-lvl').style.width =
				"" + (100 * vlc.input.position) + "%";

			// vol bar
			if (!$scope.isVolumeChanging) {
				document.getElementById('vol-lvl').style.height =
					"" + (100 - vlc.audio.volume) + "%";
			}
		}
	}, 1000);


	// vol bar click
	$scope.volTo = function (event) {

		$scope.mute (false);
		var volBar = document.getElementById('vol-bar');
		volBar.addEventListener ('mousemove', refreshVol);

	};
	document.addEventListener ('mouseup', function (e) {
		var volBar = document.getElementById('vol-bar');
		volBar.removeEventListener ('mousemove', refreshVol);
		$scope.isVolumeChanging = false;
	});

	function refreshVol (e) {

		var volBar = document.getElementById('vol-bar');
		var volLvl = document.getElementById('vol-lvl');

		e.preventDefault();

		// stop refreshing volume
		$scope.isVolumeChanging = true;

		var tmpVol =
			Math.floor ((1 - e.offsetY / volBar.offsetHeight) * 100);

		// ui refresh
		volLvl.style.height =
			"" + (100 - tmpVol) + "%";

		// vlc refresh
		vlc.audio.volume = tmpVol;
	}

	$scope.isVolumeChanging = false;

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
	$scope.files = [];
	$scope.playingAlbum = "";
	$scope.searchPattern = "";

	// play album
	$scope.playAlbum = function () {

		if ($scope.isPlaying || $scope.playingAlbum === $scope.files[$scope.files.length - 1].path) {

			$scope.togglePause ();

		} else {

			$scope.playingAlbum = $scope.files[$scope.files.length - 1].path;

			vlc.playlist.clear ();
			angular.forEach ($scope.files[$scope.files.length - 1].subs, function (file) {

				if (!file.isDir) {

					vlc.playlist.add ('file://' + file.path);
				}
			});
			vlc.playlist.play ();
			$scope.isPlaying = true;
		}
	};

	// select a file, an album, or a directory
	$scope.selectFile = function (file, index) {

		if (file.isDir) {

			$scope.files.push (file);
			document.getElementById('files').scrollTop = 0;
			$scope.searchPattern = "";

		} else {

			// file is already opened
			if ($scope.isOpen (file, index)) {

				$scope.togglePause ();

			} else  {

				// open from search
				if ($scope.searchPattern.length) {

					vlc.playlist.clear ();
					vlc.playlist.add ('file://' + file.path);
					vlc.playlist.play ();
					$scope.isPlaying = true;

				// album is already opened
				} else if ($scope.playingAlbum === $scope.files[$scope.files.length - 1].path) {

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


	// initial read
	$scope.loadingFiles = true;
	$scope.refreshLib = function () {

		$scope.loadingFiles = true;
		scanLib ('/home/lapin/Data/Music/Local', function (result) {

			$scope.files = [];
			$scope.files.push (result);
			$scope.loadingFiles = false;
		});
	};
	$scope.refreshLib();
}]);


