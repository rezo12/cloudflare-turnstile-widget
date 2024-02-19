# cloudflare-turnstile-widget
Framework agnostic widget for Cloudflare's open source CAPTCHA, Cloudflare Turnstile

---

<p align="center">
	[<a href="#introduction">Introduction</a>]
	[<a href="#usage">Usage</a>]
	[<a href="#contributors">Contributors</a>]
	[<a href="#license">License</a>]
</p>

---

## Introduction

-   The `<turnstile-widget>` is a custom iframe that makes the use of cloudflare's CAPTCHA easier in your application.

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

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rezo12"><img src="https://avatars.githubusercontent.com/u/33411469?v=4?s=100" width="100px;" alt="Benjamin Fourie"/><br /><sub><b>Benjamin Fourie</b></sub></a><br /><a href="https://github.com/Benjamin Fourie/cloudflare-turnstile-widget/commits?author=rezo12" title="Code">💻</a> <a href="#tool-rezo12" title="Tools">🔧</a> <a href="https://github.com/Benjamin Fourie/cloudflare-turnstile-widget/commits?author=rezo12" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BOTLANNER"><img src="https://avatars.githubusercontent.com/u/16349308?v=4?s=100" width="100px;" alt="BOTLANNER"/><br /><sub><b>BOTLANNER</b></sub></a><br /><a href="https://github.com/Benjamin Fourie/cloudflare-turnstile-widget/commits?author=BOTLANNER" title="Code">💻</a> <a href="#tool-BOTLANNER" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<br>

## License
Licensed under [MIT](LICENSE)

Based on [`omni-widget`](https://github.com/capitec/omni-widget) licensed under [MIT](THIRDPARTY.md)
<br>