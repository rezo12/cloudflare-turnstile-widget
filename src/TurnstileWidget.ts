import { TurnstileWidgetFrame } from "./TurnstileWidgetFrame.js";

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export class TurnstileWidget extends HTMLElement {
    /**
     * Internal instance of `HTMLIFrameElement`.
     */
    public readonly iframe: HTMLIFrameElement;

    /**
     * Unique identifier for widget with which to track widget specific events.
    */
    public readonly identifier: string = TurnstileWidgetFrame.uuidv4();

    public get size(): TurnstileSize | null {
        return this.getAttribute('size') as TurnstileSize;
    }

    public set size(value: string) {
        if (this.getAttribute('size') !== value) {
            this.setAttribute('size', value);
        }
    }

    public get theme(): Turnstile.Theme | null {
        return this.getAttribute('theme') as Turnstile.Theme;
    }

    public set theme(value: string) {
        if (this.getAttribute('theme') !== value) {
            this.setAttribute('theme', value);
        }
    }

    /**
     * Every widget has a sitekey. This sitekey is associated with the corresponding widget configuration and is created upon the widget creation.
     * @attr
    */
    public get sitekey(): string | null {
        return this.getAttribute('sitekey');
    }

    public set sitekey(value: string) {
        if (this.getAttribute('sitekey') !== value) {
            this.setAttribute('sitekey', value);
        }
    }

    private componentMessageListener = ((event: MessageEvent) => {
        const eventData = event.data as BridgeInfo<unknown>;
        // Check if received message is a widget message from this wrapper's hosted widget
        if (
            typeof event.data === `object` &&
            eventData.bridgeEvent &&
            eventData.identifier === this.identifier &&
            eventData.fromApplication !== true
        ) {
            this.frameMessageReceived(event as MessageEvent<BridgeInfo<unknown>>);
        }
    }).bind(this);

    /**
     * Initialises the component.
     *
     * @hideconstructor
    */
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');

        style.textContent = `
            .body {
                border: none;
                height: ${this.size === 'compact' ? '120px;' : '65px;'}
                width: ${this.size === 'compact' ? '130px;' : '300px;'}
                margin: 0;
                overflow: hidden;
            }

            :host {
                position: relative;
            }
        `;

        shadow.appendChild(style);

        this.iframe = document.createElement('iframe');
        this.iframe.classList.add('body');

        this.iframe.srcdoc = `
            <head>
                <script src="${SCRIPT_URL}?render=explicit"></script>
                <script type="module" src="${import.meta.url}"></script>
            </head>
            <body style="border: none; height: ${this.size === 'compact' ? '120px;' : '65px;'} width: ${this.size === 'compact' ? '130px;' : '300px;'} margin: 0; overflow: hidden;">
                <turnstile-widget-frame sitekey=${this.sitekey} size="${this.size}" theme=${this.theme}></turnstile-widget-frame>
            </body>
        `;

        this.iframe.addEventListener('load', () => this.frameLoaded());

        shadow.appendChild(this.iframe);
    }

    /**
     * Setup the component once added to the DOM.
    */
    connectedCallback(): void {
        // Listen for messages on the application window. Used for communication with the child widget.
        window.addEventListener(`message`, this.componentMessageListener);
    }

    /**
     * Clean up the component once removed from the DOM.
    */
    disconnectedCallback(): void {
        // Cleanup listeners
        window.removeEventListener(`message`, this.componentMessageListener);
    }

    /**
     * Dispatch a custom event to say the iframe is loaded, the TurnstileWidgetFrame component listens to this event.
    */
    // eslint-disable-next-line @typescript-eslint/require-await
    private async frameLoaded() {
        // Raise frame load event
        this.dispatchEvent(
            new CustomEvent('frame-load', {
                bubbles: true,
                composed: true,
                cancelable: false,
                detail: this.identifier
            })
        );
        this.messageFrame('frame-load', this.identifier);
    }

    private frameMessageReceived<T>(event: MessageEvent<BridgeInfo<T>>) {
        // Create and dispatch custom event based on bridge event info
        const evt: CustomEventInit<WidgetEventDetail<T>> = {
            detail: {
                content: event.data.detail,
                // Check whether a temporary callback event has been provided, and if so, setup function to return the callback response.
                callback: event.data.callbackId
                    ? (detail: unknown) => {
                        this.messageFrame(event.data.callbackId as string, detail);
                    }
                    : undefined
            } as WidgetEventDetail<T>,
            bubbles: true,
            composed: true,
            cancelable: true
        };
        this.dispatchEvent(
            new CustomEvent('bridge-message', {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: event.data
            })
        );
        this.dispatchEvent(new CustomEvent(event.data.bridgeEvent, evt));
    }

    /**
     * Send a bridged message to the hosted widget frame.
     * @param eventName The event this message correlates to.
     * @param detail Custom detail to attach as event detail.
     * @param callback (Optional) Callback function to invoke on widget response.
     * @param timeout (Optional) Duration to wait for callback.
     * @param timeoutCallback (Optional) Callback function to invoke if response timeout is exceeded
     * @param callbackIdentifierPrefix (Optional) Prefix to apply on generated widget callback id
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messageFrame<T = any, U = any>(
        eventName: string,
        detail?: T,
        callback?: (detail: U) => void,
        timeout?: number,
        timeoutCallback?: () => void,
        callbackIdentifierPrefix = 'widget-callback'
    ) {
        const frameWindow = this.iframe.contentWindow;
        let callbackId: string | undefined = undefined;

        if (callback) {
            let resolved: boolean | null = null;

            // If callback function is specified, setup temporary event for callback response
            callbackId = `${callbackIdentifierPrefix}|${TurnstileWidgetFrame.uuidv4()}`;

            let callbackHandler = (e: Event) => {
                if (resolved === null) {
                    resolved = true;
                    window.removeEventListener(callbackId as string, callbackHandler);
                    // eslint-disable-next-line callback-return
                    callback((e as CustomEvent).detail);
                }
            };

            callbackHandler = callbackHandler.bind(this);
            if (timeout) {
                setTimeout(() => {
                    if (resolved === null) {
                        resolved = false;
                        window.removeEventListener(callbackId as string, callbackHandler);
                        if (timeoutCallback) {
                            timeoutCallback();
                        }
                    }
                }, timeout);
            }
            window.addEventListener(callbackId, callbackHandler);
        }

        const bridgeEvent: BridgeInfo<T> = {
            bridgeEvent: eventName,
            detail: detail,
            identifier: this.identifier,
            fromApplication: true,
            callbackId: callbackId
        };
        frameWindow?.postMessage(bridgeEvent, `*`);
    }

    /**
     * Asynchronously sends a bridged message to the hosted widget frame, then awaits and returns its response.
     * @param eventName The event this message correlates to.
     * @param detail Custom detail to attach as event detail.
     * @param timeout (Optional) Duration to wait for before rejecting the promise. If not specified, will wait indefinitely
     * @param callbackIdentifierPrefix (Optional) Prefix to apply on generated widget callback id.
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messageFrameAsync<T = any, U = any>(eventName: string, detail?: T, timeout?: number, callbackIdentifierPrefix = 'widget-callback') {
        return new Promise<U>((resolve, reject) => {
            try {
                this.messageFrame(
                    eventName,
                    detail,
                    resolve,
                    timeout,
                    timeout ? () => reject(new Error(`No response received for '${eventName}' in the given timeout: ${timeout}ms`)) : undefined,
                    callbackIdentifierPrefix
                );
            } catch (error) {
                reject(error);
            }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BridgeInfo<T = any> = {
    callbackId?: string;
    detail?: T;
    bridgeEvent: string;
    identifier: string;
    fromApplication?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetEventDetail<T = any, U = any> = {
    content: T;
    callback?: (detail: U) => void;
};

export type TurnstileSize = 'normal' | 'compact';

customElements.define('turnstile-widget', TurnstileWidget);

declare global {
    interface HTMLElementTagNameMap {
        'turnstile-widget': TurnstileWidget;
    }
}