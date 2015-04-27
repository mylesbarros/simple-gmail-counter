/* Gmail Counter – Firefox Add-On
Copyright (C) 2015 Myles V. Barros

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>. */

const { ActionButton } = require("sdk/ui/button/action");
const panels = require("sdk/panel");
const sprefs = require("sdk/simple-prefs");
const tabs = require("sdk/tabs");
const { setInterval, clearInterval } = require("sdk/timers");
const xhr = require("sdk/net/xhr");

const mailAddress = "https://mail.google.com";
let signinState = 1;
let primaryColor = "#186DEE";
let intervalID;

let button = ActionButton({
	id: "gmail-link",
	label: "Gmail Counter",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	},
	onClick: handleClick,
	badgeColor: primaryColor
});

function handleClick(state) {
	let activeTabURL = tabs.activeTab.url;
	if (activeTabURL === "about:newtab" || activeTabURL === "about:blank") {
		tabs.activeTab.url = mailAddress;
	}
	else {
		tabs.open(mailAddress);
	}
}

let panel = panels.Panel({
	contentURL: "./signin-panel.html",
	contentScriptFile: "./signin-content-script.js",
	position: button,
	width: 240,
	height: 128
});

function onColorChange() {
	primaryColor = sprefs.prefs.color;
	console.log("The color has changed! " + primaryColor);
	button.badgeColor = primaryColor;
	panel.port.emit("color", primaryColor);
}
sprefs.on("color", onColorChange);
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
