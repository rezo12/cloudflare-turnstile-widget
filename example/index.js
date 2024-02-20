import 'cloudflare-turnstile-widget';

document.addEventListener("DOMContentLoaded", function () {
    const sizes = ['compact', 'normal'];
    const results = ['success', 'fail', 'interactive'];
    const themes = ['light', 'dark'];

    for (let s = 0; s < sizes.length; s++) {
        const size = sizes[s];
        for (let r = 0; r < results.length; r++) {
            const result = results[r];
            for (let t = 0; t < themes.length; t++) {
                const theme = themes[t];

                const component = document.querySelector(`#${size}-${theme}-${result}`);
                const componentResult = document.querySelector(`#${size}-${theme}-${result}-result`);

                component.addEventListener('success', (e) => {
                    const message = e.detail.content;
                    componentResult.textContent = message;
                });
                component.addEventListener('error', (e) => {
                    const message = e.detail.content;
                    componentResult.textContent = message;
                });
                component.addEventListener('expired', (e) => {
                    componentResult.textContent = 'Expired';
                });
                component.addEventListener('unsupported', (e) => {
                    componentResult.textContent = 'Unsupported';
                });
            }
        }
    }
});