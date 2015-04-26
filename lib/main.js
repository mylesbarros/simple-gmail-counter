let { ActionButton } = require("sdk/ui/button/action");
let panels = require("sdk/panel");
let prefs = require("sdk/simple-prefs").prefs;
let tabs = require("sdk/tabs");
let { setInterval, clearInterval } = require("sdk/timers");
let xhr = require("sdk/net/xhr");

let signinState = 1;
let intervalID;
let primaryColor = "#186DEE";
let button = ActionButton({
	id: "gmail-link",
	label: "Visit Gmail",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	},
	onClick: handleClick,
	badgeColor: primaryColor
});

function handleClick(state) {
	tabs.open("https://mail.google.com");
}

let panel = panels.Panel({
	contentURL: "./signin-panel.html",
	contentScriptFile: "./signin-content-script.js",
	position: button,
	width: 240,
	height: 150
});

function onColorChange() {
	primaryColor = prefs["extensions.gmail-counter.colorPrefs"];
	panel.port.emit("color", primaryColor);
}
onColorChange();

function setEmailCount(newCount) {
	button.badge = newCount;
}

function parseGmailFeed(xmlDoc) {
	let fullcountElement = xmlDoc.getElementsByTagName("fullcount").item(0);
	let unreadCount = fullcountElement.innerHTML;
	setEmailCount(unreadCount);
}

function requestGmailFeed() {
	let request = xhr.XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4) {
			if (request.status === 200) {
				parseGmailFeed(request.responseXML);
				if (signinState === 0) {
					signinState = 1;
					toggleInterval();
				}
			}
			else if (request.status === 401) {
				if (signinState === 1) {
					signinState = 0;
					toggleInterval();
					panel.show();
				}
				setEmailCount(null);
			}
		}
	}
	request.open("GET", "https://mail.google.com/mail/feed/atom");
	request.send();
}

function toggleInterval() {
	clearInterval(intervalID);
	if (signinState === 0) {
		setInterval(requestGmailFeed, 10000);
	}
	else if (signinState === 1) {
		setInterval(requestGmailFeed, 3200);
	}
}

intervalID = setInterval(requestGmailFeed, 3200);
