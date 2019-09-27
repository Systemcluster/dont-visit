function normalizeUrl(ourl) {
	let url = ourl.trim();
	if(url.length == 0) 
		return "";
	url = url.toLowerCase();
	// remove protocol part
	let slashes = url.indexOf("://");
	if(slashes != -1 && slashes < url.indexOf(".")) {
		let splits = url.split("://");
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
	let input = normalizeUrl(url);
	if(input.length == 0) {
		return false;
	}
	let list = document.getElementById("blocklist").getElementsByTagName("li");
	for (let i = 0; i < list.length; ++i) {
		if (input == list[i].firstChild.textContent) {
			return false;
		}
	}
	return true;
}
function addSite(url) {
	if(!siteValid(url)) {
		return false;
	}
	let li = document.createElement("li");
	let span1 = document.createElement("span");
	let text1 = document.createTextNode(normalizeUrl(url));
	let span2 = document.createElement("span");
	let text2 = document.createTextNode("X");
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

function getSitesFromList() {
	let sites = [];
	let list = document.getElementById("blocklist").getElementsByTagName("li");
	for (let i = 0; i < list.length; ++i) {
		let site = list[i].firstChild.textContent;
		// create regular expression from readable string
		site = site.replace(/[.+?^${}()|[\]\\]{1}/g, "\\$&");
		site = site.replace(/[*]{1}/g, ".*");
		sites.push(site);
	}
	return sites;
}

function save(e) {
	document.getElementById("save").disabled = true;
	document.getElementById("cancel").disabled = true;
	document.getElementById("textedit_toggle").disabled = true;
	let lenient = document.getElementById("input_block_lenient").checked;
	let sites = getSitesFromList();
	chrome.storage.sync.set({"input_block_lenient": lenient, "input_block_list": sites}, function() {
		cancel();
	});
}
function loadItems(items) {
	if (!items) {
		console.error(`can't load items: items is ${items}`);
		return;
	}
	if(items.input_block_lenient)
		document.getElementById("input_block_lenient").checked = true;
	let list = document.getElementById("blocklist");
	while(list.firstChild) {
		list.removeChild(list.firstChild);
	}
	let sites = items.input_block_list;
	for(let i = 0; i < sites.length; ++i) {
		let site = sites[i];
		// create readable string from regular expression
		site = site.replace(/\\([.+?^${}()|[\]\\]{1})/g, "$1");
		site = site.replace(/[.]{1}[*]{1}/g, "*");
		addSite(site);
	}	
}
function load(e) {
	chrome.storage.sync.get({"input_block_lenient": false, "input_block_list": []}, loadItems);
}
function cancel() {
	window.setTimeout(window.close, 1);
}
document.addEventListener("DOMContentLoaded", load);
document.getElementById("save").addEventListener("click", save);
document.getElementById("cancel").addEventListener("click", cancel);

function openTextEdit() {
	document.getElementById("textedit_toggle").disabled = true;
	document.getElementById("textinput").value = getSitesFromList().join("\n");
	document.getElementById("blocklist_wrap").classList.add("hidden");
	document.getElementById("textedit_wrap").classList.remove("hidden");
	document.getElementById("textedit_toggle").value = "Show as list";
	document.getElementById("textedit_toggle").disabled = false;
}
function closeTextEdit() {
	document.getElementById("textedit_toggle").disabled = true;
	loadItems({ input_block_list: document.getElementById("textinput").value.trim().split(/\s*[\r\n]+\s*/g) });
	document.getElementById("textedit_wrap").classList.add("hidden");
	document.getElementById("blocklist_wrap").classList.remove("hidden");
	document.getElementById("textedit_toggle").value = "Edit as text";
	document.getElementById("textedit_toggle").disabled = false;
}
function toggleTextEdit() {
	let mode_t = document.getElementById("textedit_wrap").classList.contains("hidden");
	if (mode_t) {
		openTextEdit();
	}
	else {
		closeTextEdit();
	}
}
document.getElementById("textedit_toggle").addEventListener("click", toggleTextEdit);
