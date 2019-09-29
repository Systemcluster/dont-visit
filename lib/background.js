let input_block_list = [];
let input_block_lenient = false;
let input_block_frames = true;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.access && request.access_seconds) {
		let time = Date.now();
		let num = new Number(time + 1000 * request.access_seconds);
		localStorage.setItem(request.access, num.toString());
		chrome.tabs.query({ currentWindow: true, active: true }, function([tab, ...tabs]) {
			chrome.tabs.update(tab.id, { "url": request.site });
		});
	}
	if (request.input_block_list !== undefined) {
		input_block_list = request.input_block_list;
		input_block_lenient = request.input_block_lenient;
	}
	if (request.close_tab) {
		chrome.tabs.query({ currentWindow: true, active: true }, function([tab, ...tabs]) {
			chrome.tabs.remove(tab.id);
		});
	}
});

function startup() {
	localStorage.clear();
	try {
		chrome.storage.sync.get({
			"input_block_lenient": false,
			"input_block_frames": true,
			"input_block_list": []
		}, function (items) {
			if (items) {
				input_block_list = items.input_block_list;
				input_block_lenient = items.input_block_lenient;
				input_block_frames = items.input_block_frames;
			}
		});
	}
	catch (e) {
		console.trace(e);
	}
}

chrome.runtime.onStartup.addListener(startup);
chrome.runtime.onInstalled.addListener(startup);

chrome.browserAction.onClicked.addListener(function () {
	chrome.runtime.openOptionsPage();
})

function filter({
	frameId,
	url
}) {
	let currentUrl = url;
	if (!currentUrl || currentUrl.indexOf("chrome://") == 0 || currentUrl.indexOf(chrome.extension.getURL("/")) == 0) {
		return; // invalid url
	}
	if (!input_block_list) {
		return; // no block list
	}
	let sites = input_block_list;
	for (let i = 0; i < sites.length; ++i) {
		let site = sites[i];

		let appendix = "[/]?(?:index\.[a-z0-9]+)?[/]?$";
		let trail = site.substr(site.length - 3);
		if (trail == "/.*") {
			site = site.substr(0, site.length - 3);
			appendix = "(?:$|/.*$)";
		}

		site = "^(?:[a-z0-9\-_]+:\/\/)?(?:www\.)?" + site + appendix;
		let regex = new RegExp(site, "i");

		let match = currentUrl.match(regex);
		if (match && match.length > 0) {
			if (input_block_lenient) {
				let access = localStorage.getItem(sites[i]);
				if (access) {
					let num = parseFloat(access);
					let time = Date.now();
					if (num > time) {
						break;
					}
					else {
						localStorage.removeItem(sites[i]);
					}
				}
			}
			if (frameId !== 0) {
				if (input_block_frames) {
					return { cancel: true };
				}
				return;
			}
			let message = {
				site: currentUrl,
				match: sites[i],
				title: currentUrl,
				lenient: input_block_lenient,
				favicon: "https://www.google.com/s2/favicons?domain=" + currentUrl,
			};
			let url = chrome.extension.getURL("lib/stop.html") + "#" + JSON.stringify(message);
			return { redirectUrl: url };
		}
	}
}

chrome.webRequest.onBeforeRequest.addListener(filter, {
	urls: ["*://*/*"],
	types: ["main_frame", "sub_frame"]
}, ["blocking"]);
