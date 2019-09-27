function normalizeUrl(ourl) {
	var url = ourl.trim();
	if(url.length == 0) 
		return "";
	url = url.toLowerCase();
	// remove protocol part
	var slashes = url.indexOf("://");
	if(slashes != -1 && slashes < url.indexOf(".")) {
		var splits = url.split("://");
		if(splits.shift().match(/^[a-z0-9\-_]+$/)) {
			url = splits.join("://");
		}
	}
	// trim / at the end
	if(url.length != 0 && url.charAt(url.length-1) == "/") {
		url = url.substr(0, url.length - 1);
	}
	return url;
}
function siteValid(url) {
	var input = normalizeUrl(url);
	if(input.length == 0) {
		return false;
	}
	var list = document.getElementById("blocklist").getElementsByTagName("li");
	for (var i = 0; i < list.length; ++i) {
		if (input == list[i].firstChild.textContent) {
			return false;
		}
	};
	return true;
}
function addSite(url) {
	if(!siteValid(url)) {
		return false;
	}
	var li = document.createElement("li");
	var span1 = document.createElement("span");
	var text1 = document.createTextNode(normalizeUrl(url));
	var span2 = document.createElement("span");
	var text2 = document.createTextNode("X");
	span1.appendChild(text1);
	span2.appendChild(text2);
	li.appendChild(span1);
	li.appendChild(span2);
	span2.addEventListener("click", function() {
		document.getElementById("blocklist").removeChild(li);
	});
	document.getElementById("blocklist").appendChild(li);
	return true;
}

function onBlockButton(e) {
	if(document.getElementById("blockbutton").disabled == true) {
		return false;
	}
	if(addSite(document.getElementById("blockinput").value)) {
		document.getElementById("blockinput").value = "";
		document.getElementById("blockbutton").disabled = true;
		return true;
	}
	return false;
}
document.getElementById("blockbutton").addEventListener("click", onBlockButton);
function onBlockInput(e) {
	document.getElementById("blockbutton").disabled = !siteValid(document.getElementById("blockinput").value);
	return true;
}
document.getElementById("blockinput").addEventListener("input", onBlockInput);
function onBlockInputKeyDown(e) {
	if(e.keyCode == 13) {
		return onBlockButton();
	}
	return true;
}
document.getElementById("blockinput").addEventListener("keydown", onBlockInputKeyDown);

function save(e) {
	document.getElementById("save").disabled = true;
	document.getElementById("cancel").disabled = true;
	var lenient = document.getElementById("input_block_lenient").checked;
	var sites = [];
	var list = document.getElementById("blocklist").getElementsByTagName("li");
	for (var i = 0; i < list.length; ++i) {
		var site = list[i].firstChild.textContent;
		// create regular expression from readable string
		site = site.replace(/[.+?^${}()|[\]\\]{1}/g, "\\$&");
		site = site.replace(/[*]{1}/g, ".*");
		sites.push(site);
	};
	chrome.storage.sync.set({"input_block_lenient": lenient, "input_block_list": sites}, function() {
		cancel();
	});	
}
function load(e) {
	chrome.storage.sync.get({"input_block_lenient": false, "input_block_list": []}, function(items) {
		if(items.input_block_lenient)
			document.getElementById("input_block_lenient").checked = true;
		var list = document.getElementById("blocklist");
		while(list.firstChild) {
			list.removeChild(list.firstChild);
		}
		var sites = items.input_block_list;
		for(var i = 0; i < sites.length; ++i) {
			var site = sites[i];
			// create readable string from regular expression
			site = site.replace(/\\([.+?^${}()|[\]\\]{1})/g, "$1");
			site = site.replace(/[.]{1}[*]{1}/g, "*");
			addSite(site);
		}	
	});
}
function cancel() {
	window.setTimeout(window.close, 1);
}
document.addEventListener("DOMContentLoaded", load);
document.getElementById("save").addEventListener("click", save);
document.getElementById("cancel").addEventListener("click", cancel);
