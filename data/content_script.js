(function() {
	let audioPlayer = document.getElementById("audio-player");

	self.port.on("notify user", function() {
		audioPlayer.play();
	});
})();
