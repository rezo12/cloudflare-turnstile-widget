import 'cloudflare-turnstile-widget';

function success(e) {
	const message = e.detail.content;
	console.log(message);
}

function error(e) {
	const message = e.detail.content;
	console.log(message);
}

document.addEventListener("DOMContentLoaded", function () {
	document.querySelector('turnstile-widget').addEventListener('success', success);
	document.querySelector('turnstile-widget').addEventListener('error', error);
});