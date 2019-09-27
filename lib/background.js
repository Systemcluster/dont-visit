chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.access && request.access_seconds) {
		var time = Date.now();
		var num = new Number(time + 1000 * request.access_seconds);
		localStorage.setItem(request.access, num.toString());
		sendResponse();
	}
});

chrome.runtime.onStartup.addListener(function() {
	localStorage.clear();
});

// TODO: change from chrome.tabs to chrome.webNavigation ?
// TODO: make use of web workers ?

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	var currentUrl = changeInfo.url ? changeInfo.url : tab.url;
	if(!currentUrl || changeInfo.status != "loading" || currentUrl.indexOf("chrome://") == 0 || currentUrl.indexOf(chrome.extension.getURL("/")) == 0)
		return;
	chrome.storage.sync.get({"input_block_lenient": false, "input_block_list": []}, function(items) {
		var sites = items.input_block_list;
		for(var i = 0; i < sites.length; ++i) {
			var site = sites[i];
			if(items.input_block_lenient) {
				var access = localStorage.getItem(site);
				if(access) {
					var num = parseFloat(access);
					var time = Date.now();
					if(num > time) {
						break;
					}
					else {
						localStorage.removeItem(site);
					}
				}
			}

			var appendix =  "[/]?(?:index\.[a-z0-9]+)?[/]?$";
			var trail = site.substr(site.length - 3);
			if(trail == "/.*") {
				site = site.substr(0, site.length - 3);
				appendix = "(?:$|/.*$)";
			}

			site = "^(?:[a-z0-9\-_]+:\/\/)?(?:www\.)?"+site+appendix;
			var regex = new RegExp(site, "i");

			var match = currentUrl.match(regex);
			if(match && match.length > 0) {
				var message = {
					site: currentUrl,
					match: sites[i],
					title: currentUrl,
					favicon: changeInfo.favIconUrl ? changeInfo.favIconUrl : "https://www.google.com/s2/favicons?domain="+currentUrl
				};
				var url = chrome.extension.getURL("lib/stop.html") + "#" + JSON.stringify(message);
				chrome.tabs.update(tab.id, {"url": url }, function(newtab) {
				});

			}
		}
	});

});
