document.addEventListener("DOMContentLoaded", function(e) {
	document.getElementById("close").addEventListener("click", function(e) {
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id);
		});
		return false;
	});

	var hash = window.location.hash.substring(1);
	try {
		var message = JSON.parse(decodeURI(hash));

		var link = document.createElement("link");
		link.type="image/x-icon";
		link.rel="icon";
		link.href = message.favicon;
		document.head.appendChild(link);

		var spans = document.getElementsByClassName("sitename");
		for(var i = 0; i < spans.length; ++i) {
			spans[i].textContent = message.site;
		}
		spans = document.getElementsByClassName("sitetitle");
		for(var i = 0; i < spans.length; ++i) {
			spans[i].textContent = message.title;
		}
		spans = document.getElementsByClassName("sitematch");
		var match;
		for(var i = 0; i < spans.length; ++i) {
			if(!match) match = message.match.replace(/\\([.+?^${}()|[\]\\]{1})/g, "$1").replace(/[.]{1}[*]{1}/g, "*");
			spans[i].textContent = match;
		}

		document.title = document.title + " " + message.title;

		chrome.storage.sync.get({"input_block_lenient": false, "access_seconds": (5 * 60)}, function(items) {
			if(items.input_block_lenient) {
				document.getElementById("access").style.display = "inline-block";
			}
			document.getElementById("access").addEventListener("click", function(e) {
				chrome.runtime.sendMessage({"access": message.match, "access_seconds": items.access_seconds}, function(response) {
					chrome.tabs.getCurrent(function(tab) {
						chrome.tabs.update(tab.id, {"url": message.site }, function(newtab) {
						});
					});
				});
			});
		});
	}
	catch(e) {
		
	}
});
