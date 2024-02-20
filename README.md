<h3 align="center">Cloudflare Turnstile Widget</h3>

<p align="center">
  Framework agnostic widget for Cloudflare's free-to-use CAPTCHA service, 
  <a href="https://developers.cloudflare.com/turnstile/">Cloudflare Turnstile</a>
</p>

<br />

<p align="center">
  <img src="https://developers.cloudflare.com/assets/light-success_hu368dc2c5e67cc74c2191fd29410c934a_12471_1113x348_resize_q75_box_3-80edb044.png" width="250"/>
</p>

<br />

<p align="center">
	<a href="https://npmcharts.com/compare/cloudflare-turnstile-widget?minimal=true">
    <img alt="Downloads Per Week" src="https://img.shields.io/npm/dw/cloudflare-turnstile-widget.svg" height="20"/>
  </a>
	<a href="https://www.npmjs.com/package/cloudflare-turnstile-widget">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/cloudflare-turnstile-widget" height="20"/>
  </a>
	<a href="https://github.com/cloudflare-turnstile-widget/actions/workflows/build.yml">
    <img alt="GitHub Build" src="https://github.com/rezo12/cloudflare-turnstile-widget/actions/workflows/build.yml/badge.svg" height="20"/>
  </a>
	<a href="https://github.com/rezo12/cloudflare-turnstile-widget/blob/develop/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/github/license/rezo12/cloudflare-turnstile-widget" height="20"/>
  </a>
</p>

<p align="center">
	[<a href="#introduction">Introduction</a>]
	[<a href="#usage">Usage</a>]
	[<a href="#contributors">Contributors</a>]
	[<a href="#license">License</a>]
</p>

---

## Introduction

-   When the requirement is to utilize the Cloudflare's CAPTCHA service in a web component or shadow DOM implementation,
    Cloudflare's script for their CAPTCHA service only queries the document in the DOM tree which presents a problem that this component solves.
-   The `<turnstile-widget>` is a custom iframe that makes the use of cloudflare's CAPTCHA easier in your application without the above mentioned issue.

<br />

## Usage

1️⃣ &nbsp; Install the library in your project.

```bash
npm install cloudflare-turnstile-widget
```

2️⃣ &nbsp; Import the package

```js
import 'cloudflare-turnstile-widget';
```

3️⃣ &nbsp; Use the widget in your application.

```html
<turnstile-widget sitekey="1x00000000000000000000AA" size="compact" theme="dark"></turnstile-widget>
```

4️⃣ &nbsp; Use event listeners to receive messages from the widget.

```js
document.querySelector('turnstile-widget').addEventListener('success', function (e) {
	console.log(e.detail.content);
});
```

<br>

## Contributors

Thanks goes to these wonderful people:

<!-- readme: contributors -start -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rezo12"><img src="https://avatars.githubusercontent.com/u/33411469?v=4?s=100" width="100px;" alt="rezo12"/><br /><sub><b>rezo12</b></sub></a><br /><a href="https://github.com/rezo12/cloudflare-turnstile-widget/commits?author=rezo12" title="Code">💻</a> <a href="#tool-rezo12" title="Tools">🔧</a> <a href="https://github.com/rezo12/cloudflare-turnstile-widget/commits?author=rezo12" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BOTLANNER"><img src="https://avatars.githubusercontent.com/u/16349308?v=4?s=100" width="100px;" alt="BOTLANNER"/><br /><sub><b>BOTLANNER</b></sub></a><br /><a href="https://github.com/rezo12/cloudflare-turnstile-widget/commits?author=BOTLANNER" title="Code">💻</a> <a href="#tool-BOTLANNER" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>
<!-- readme: contributors -end -->

<br>

## License

Licensed under [MIT](LICENSE)

Based on [`omni-widget`](https://github.com/capitec/omni-widget) licensed under [MIT](THIRDPARTY.md)
<br>
