// background.js [3/30/2016]
/*
	For any questions message WebGL3D https://www.roblox.com/messages/compose?recipientId=48103520
	My messages will always be open for all, if you can't PM me check your settings.
*/
foreach({
	"friendNotifier": {
		on: false,
		online: true,
		offline: true,
		game: true,
		blocked: []
	},
	"notificationVolume": .5,
	"notifierSounds": {
		items: 205318910,
		tradeInbound: 0,
		tradeOutbound: 0,
		tradeCompleted: 0,
		tradeDeclined: 0,
		friend: 0,
		forum: 0,
		messages: 0,
		groupShout: 0
	},
	"changedLogin": ext.incognito,
	"startupNotification": {
		on: !ext.incognito,
		visit: browser.name != "Chrome",
		names: {}
	},
	"forums": {
		last: 0,
		floodcheck: 0,
		signature: "",
		lines: 3,
		blacklist: [],
		postIds: false,
		rap: false,
		blocking: false,
		embedding: false,
		embedSize: 75
	},
	"changedLogin": ext.incognito,
	"groupShoutNotifierList": { 2518656: "Roblox+ Fan Group" },
	"navigation": {
		"sideOpen": false,
		"counterCommas": 100000000,
		"buttons": [
			{ text: "Develop", href: "/develop" },
			{ text: "Forums", href: "/forum" }
		]
	},
	"userSince": getMil()
}, function (n, o) {
	if (type(storage.get(n)) != type(o)) {
		storage.set(n, o);
	}
});



/* Notifications, and notifiers */
notification.properties.robloxSound = function (a, note) {
	if (!Number(a)) { return notification.properties.speak(note.header + "\n" + note.lite, note); }
	soundService.robloxSound(a, function (s) {
		if (s && !note.closed) {
			s.volume(Number(storage.get("notificationVolume")) || .5).play(function () {
				if (note.closed) {
					s.stop();
				}
			}).play();
			note.close(function () { s.stop(); });
		}
	});
};

if (!ext.incognito) {
	setInterval(function () {
		chrome.browserAction.setBadgeText({ text: (Object.keys(notification.server).length || "").toString() });
	}, 250);
}



/* Forums */
chrome.webRequest.onBeforeRedirect.addListener(function (details) {
	if (url.path(details.url).toLowerCase() == "/forum/addpost.aspx" && details.method == "POST") {
		storage.get("forums", function (f) {
			f.last = Number(url.hash(details.redirectUrl))
			f.floodcheck = getMil();
			storage.set("forums", f);
		});
	}
}, { urls: ["*://*.roblox.com/Forum/*"] }, ["responseHeaders"]);



/* Harmful Website Blocker */
(function () {
	var blocked = {};
	var hasPermission = true;
	var permissions = {
		origins: ["<all_urls>"]
	};
	var mustCloseUrls = [];

	function getMaliciousUrls(callBack) {
		$.get("http://vps.roblox.plus/urlBlacklist.json").done(callBack).fail(function () {
			setTimeout(getMaliciousUrls, 30 * 1000, callBack);
		});
	}

	function blockMaliciousUrls(urls, reason, mustClose) {
		var blockList = [];
		for (var n in urls) {
			if (blocked[n]) {
				continue;
			}
			blocked[n] = urls[n];
			blockList.push(n);
		}
		if (blockList.length) {
			console.log("Blocking " + blockList.length + " url" + (blockList.length === 1 ? "" : "s") + "\n\t", blockList, "\n\tReason:", reason);
			if (mustClose) {
				mustCloseUrls = mustCloseUrls.concat(blockList);
			}
			chrome.webRequest.onBeforeRequest.addListener(function (details) {
				var note = notify({
					header: "Attempt to load malicious content blocked",
					content: "Reason: " + reason
				});
				setTimeout(note.close, 5000);
				return { cancel: true };
			}, { urls: blockList }, ["blocking"]);
		}
	}

	function getAndBlockMaliciousUrls() {
		getMaliciousUrls(function (urls) {
			for (var n in urls) {
				var list = n.split(",");
				var obj = {};
				for (var i = 0; i < list.length; i++) {
					obj[list[i]] = urls[n].dateAdded;
				}
				blockMaliciousUrls(obj, urls[n].description, urls[n].mustClose);
			}
			setTimeout(getAndBlockMaliciousUrls, 15 * 1000);
		});
	}

	function checkPermissions() {
		chrome.permissions.contains(permissions, function (hasAccess) {
			hasPermission = hasAccess;
			if (hasAccess) {
				getAndBlockMaliciousUrls();
			} else {
				setTimeout(checkPermissions, 5000);
			}
		});
	}
	checkPermissions();

	request.sent(function (req, callBack) {
		if (req.request == "isBlockingMaliciousContent") {
			callBack(hasPermission);
		} else if (req.request == "startBlockingMaliciousContent") {
			chrome.permissions.request(permissions, function (granted) {
				callBack(granted);
			});
		}
	});

	setTimeout(function () {
		setInterval(function () {
			if (mustCloseUrls.length) {
				chrome.tabs.query({
					url: mustCloseUrls,
					status: "loading"
				}, function (tabs) {
					var tabIds = [];
					tabs.forEach(function (tab) { tabIds.push(tab.id); });
					if (tabs.length && tabs.length < 3) { // Failsafe...
						console.log("Closing " + tabIds.length + " tab" + (tabIds.length === 1 ? "" : "s") + " for malicious content.");
						var note = notify({
							header: tabIds.length + " tab" + (tabIds.length === 1 ? "" : "s") + " closed for malicious content"
						});
						setTimeout(note.close, 5000);
						chrome.tabs.remove(tabIds, function () { });
					}
				});
			}
		}, 100);
	}, 60 * 1000);
})();



/* Extension Icon */
chrome.browserAction.setTitle({ title: ext.manifest.name + " " + ext.manifest.version });



/* hueee no image or ticket stealing */
chrome.webRequest.onBeforeRequest.addListener(function (details) {
	var path = url.path(details.url);
	if (path.match(/^\/asset\/?$/)) {
		return { cancel: true };
	}
}, { urls: ["*://*.roblox.com/asset/*"], types: ["sub_frame", "main_frame"] }, ["blocking"]);



/* Comment Timer */
commentTimer = type(storage.get("commentTimer")) == "object" ? storage.get("commentTimer") : {};
chrome.webRequest.onBeforeRequest.addListener(function (details) {
	commentTimer.last = getMil();
	Roblox.catalog.getAssetInfo(Number(details.requestBody.formData.assetId[0])).then(function(asset) {
		Roblox.users.getCurrentUserId().then(function (uid) {
			if (uid > 0 && uid != asset.creator.id) {
				commentTimer[uid] = commentTimer[uid] || {};
				commentTimer.last = getMil();
				commentTimer[uid][asset.id] = getMil();
			}
		});
	});
}, { urls: ["*://*.roblox.com/comments/post"] }, ["requestBody"]);

setInterval(function () {
	foreach(commentTimer, function (n, o) {
		if (n != "last") {
			foreach(o, function (i, v) {
				if (v + (60 * 60 * 1000) < getMil()) {
					delete o[i];
				}
			});
			if (!Object.keys(o).length) {
				delete commentTimer[n];
			}
		}
		if (JSON.stringify(commentTimer) != JSON.stringify(storage.get("commentTimer"))) {
			storage.set("commentTimer", commentTimer);
		}
	});
}, 5000);



/* Update Check */
if (browser.name == "Chrome") {
	setInterval(function () {
		chrome.runtime.requestUpdateCheck(function (e) {
			if (e == "update_available") {
				setTimeout(ext.reload, 10 * 1000);
			}
		});
	}, 60 * 1000);
}



/* Startup Notification */
(function (startnote, makenote) {
	startnote.names = type(startnote.names) == "object" ? startnote.names : {};
	if (startnote.on && !startnote.visit) {
		makenote(startnote);
	} else if (startnote.on) {
		var listener; listener = function () { chrome.webRequest.onCompleted.removeListener(listener); makenote(startnote); };
		chrome.webRequest.onCompleted.addListener(listener, { types: ["main_frame"], urls: ["*://*.roblox.com/*"] });
	}
})(storage.get("startupNotification"), function (startnote) {
	Roblox.users.getAuthenticatedUser().then(function (user) {
		var username = user ? user.username : "";
		for (var n in startnote.names) {
			if (n.toLowerCase() === username.toLowerCase()) {
				username = startnote.names[n];
				break;
			}
		}

		var note = $.notification({
			speachGender: "male",
			title: ext.manifest.name + " started",
			context: user ? "Hello, " + user.username + "!" : "You're currently signed out",
			speak: username ? "Hello, " + username : "",
			buttons: [
				"Problems? Suggestions? Message me!"
			],
			items: {
				"Version": ext.manifest.version,
				"Made by": "WebGL3D"
			},
			clickable: true
		}).click(function () {
			this.close();
			rplusSettings.get(function (ul) {
				window.open(ul.updateLog || "https://www.roblox.com/users/48103520/profile?rbxp=48103520");
			});
		}).buttonClick(function () {
			note.close();
			window.open("https://www.roblox.com/messages/compose?recipientId=48103520");
		});
		setTimeout(note.close, 15 * 1000);
	});
});



// WebGL3D
