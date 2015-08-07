// This is ulgy as hell, but we need to decode some MS stuff to inject it correctly.
function SetHistoryCount() {
	var hTab = document.querySelector('.header[rawtitle="History"]');
	if(hTab) {
		hTab.innerHTML = 'History (' + document.querySelectorAll('.message-list .message-row').length + ')';
	}
}

setInterval(SetHistoryCount, 2500);