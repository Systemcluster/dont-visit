let input_block_list = [];
let input_block_lenient = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.access && request.access_seconds) {
		let time = Date.now();
		let num = new Number(time + 1000 * request.access_seconds);
		localStorage.setItem(request.access, num.toString());
		sendResponse();
	}
	if (request.input_block_list !== undefined) {
		input_block_list = request.input_block_list;
		input_block_lenient = request.input_block_lenient;
	}
});

chrome.runtime.onStartup.addListener(function() {
	localStorage.clear();
	try {
		chrome.storage.sync.get({ "input_block_lenient": false, "input_block_list": [] }, function (items) {
			if (items) {
				input_block_list = items.input_block_list;
				input_block_lenient = items.input_block_lenient;
			}
		});
	}
	catch (e) {
		console.trace(e);
	}
});

chrome.webNavigation.onBeforeNavigate.addListener(function ({
	tabId,
	url
}) {
	let currentUrl = url;
	if (!currentUrl || currentUrl.indexOf("chrome://") == 0 || currentUrl.indexOf(chrome.extension.getURL("/")) == 0)
		return;
	if (!input_block_list)
		return;
	let sites = input_block_list;
	for (let i = 0; i < sites.length; ++i) {
		let site = sites[i];
		if (input_block_lenient) {
			let access = localStorage.getItem(site);
			if (access) {
				let num = parseFloat(access);
				let time = Date.now();
				if (num > time) {
					break;
				}
				else {
					localStorage.removeItem(site);
				}
			}
		}

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
			let message = {
				site: currentUrl,
				match: sites[i],
				title: currentUrl,
				favicon: "https://www.google.com/s2/favicons?domain=" + currentUrl
			};
			let url = chrome.extension.getURL("lib/stop.html") + "#" + JSON.stringify(message);
			chrome.tabs.update(tabId, { "url": url });

		}
	}
});
