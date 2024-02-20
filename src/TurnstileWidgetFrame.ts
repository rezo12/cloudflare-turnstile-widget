/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BridgeInfo, WidgetEventDetail } from './TurnstileWidget.js';

export class TurnstileWidgetFrame extends HTMLElement {
    private static _currentIdentifier?: string;

    public static get currentIdentifier(): string | undefined {
        return TurnstileWidgetFrame._currentIdentifier;
    }

    private static set currentIdentifier(identifier: string | undefined) {
        TurnstileWidgetFrame._currentIdentifier = identifier;
    }

    public get sitekey(): string | null {
        return this.getAttribute('sitekey');
    }

    public set sitekey(value: string | null) {
        if (this.getAttribute('sitekey') !== value && value) {
            this.setAttribute('sitekey', value);
        }
    }

    public get theme(): TurnstileTheme | null {
        return this.getAttribute('theme') as TurnstileTheme;
    }

    public set theme(value: TurnstileTheme | null) {
        if (this.getAttribute('theme') !== value && value) {
            this.setAttribute('theme', value);
        }
    }

    public get size(): TurnstileSize | null {
        return this.getAttribute('size') as TurnstileSize;
    }

    public set size(value: TurnstileSize | null) {
        if (this.getAttribute('size') !== value && value) {
            this.setAttribute('size', value);
        }
    }

    /**
     * Initializes the component.
     *
     * @hideconstructor
     */
    constructor() {
        super();
    }

    /**
     * Setup the component once added to the DOM.
     */
    connectedCallback(): void {
        const div = document.createElement('div');
        div.style.height = '100%';
        this.appendChild(div);

        const widgetLoad = (identifier: string): void => {
            div.id = identifier;
            turnstile.ready(() => {
                turnstile.render(div, {
                    sitekey: this.sitekey!,
                    callback: (token: string) => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'success', token);
                    },
                    'error-callback': (errorCode: unknown) => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'error', errorCode);
                    },
                    'expired-callback': () => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'expired');
                    },
                    'unsupported-callback': () => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'unsupported');
                    },
                    theme: this.theme ? this.theme : 'auto',
                    size: this.size ? this.size : 'normal'
                });
            });
        };

        TurnstileWidgetFrame.initialize(widgetLoad);
    }

    /**
     * Send a bridged message to the hosting application frame as a widget.
     *
     * @param identifier Identifier to represent widget.
     * @param eventName Name of event to send to application.
     * @param detail Custom detail to attach as event detail.
     * @param callback (Optional) Callback function to invoke on widget response.
     * @param timeout (Optional) Duration to wait for callback.
     * @param timeoutCallback (Optional) Callback function to invoke if response timeout is exceeded
     * @param callbackIdentifierPrefix (Optional) Prefix to apply on generated widget callback id
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static messageApplication<T, U = any>(identifier: string, eventName: string, detail?: T, callback?: (detail: U) => void, timeout?: number, timeoutCallback?: () => void, callbackIdentifierPrefix = 'widget-callback'): void {
        if (window === window.parent) {
            throw new Error('No parent application to message!');
        }

        // Build up bridge event with provided detail
        const bridgeEvent: BridgeInfo = {
            bridgeEvent: eventName,
            detail: detail,
            fromApplication: false,
            identifier: identifier,
            callbackId: undefined as string | undefined
        };

        if (callback) {
            let resolved: boolean | null = null;

            // If callback function is specified, setup temporary event for callback response
            const callbackId = `${callbackIdentifierPrefix}|${TurnstileWidgetFrame.uuidv4()}`;
            bridgeEvent.callbackId = callbackId;

            const callbackHandler = (e: WidgetEventDetail): void => {
                if (resolved === null) {
                    resolved = true;
                    TurnstileWidgetFrame.removeEventListener(callbackListener);
                    // eslint-disable-next-line callback-return, @typescript-eslint/no-unsafe-argument
                    callback(e.content);
                }
            };
            if (timeout) {
                setTimeout(() => {
                    if (resolved === null) {
                        resolved = false;
                        TurnstileWidgetFrame.removeEventListener(callbackListener);
                        if (timeoutCallback) {
                            timeoutCallback();
                        }
                    }
                }, timeout);
            }
            const callbackListener = TurnstileWidgetFrame.addEventListener(callbackId, callbackHandler);
        }
        window.parent.postMessage(JSON.parse(JSON.stringify(bridgeEvent)), `*`);
    }

    /**
     * Generate a unique identifier string
     */
    static uuidv4(): string {
        if (crypto && crypto.randomUUID) {
            try {
                const uuid = crypto.randomUUID();
                if (uuid) {
                    return uuid;
                }
            } catch (error) {
                console.warn(error);
            }
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
    }

    /**
     * Asynchronously sends a bridged message to the hosting application frame as a widget, then awaits and returns its response.
     * @param identifier Identifier to represent widget.
     * @param eventName The event this message correlates to.
     * @param detail Custom detail to attach as event detail.
     * @param timeout (Optional) Duration to wait for before rejecting the promise. If not specified, will wait indefinitely.
     * @param callbackIdentifierPrefix (Optional) Prefix to apply on generated widget callback id
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static messageApplicationAsync<T, U = any>(identifier: string, eventName: string, detail: T, timeout = 3000, callbackIdentifierPrefix = 'widget-callback'): Promise<U> {
        return new Promise<U>((resolve, reject) => {
            try {
                TurnstileWidgetFrame.messageApplication(identifier, eventName, detail, resolve, timeout, () => reject(new Error(`No response received for '${eventName}' in the given timeout: ${timeout}ms`)), callbackIdentifierPrefix);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Set up a callback for the `frame-load` event from the widget component in a hosting application.
     * Can be used by a widget application to retrieve its identifier from the widget component.
     * @param frameLoaded The callback to invoke when the `frame-load` event occurs.
     */
    public static initialize(frameLoaded: (identifier: string) => void): void {
        // Listen for messages on the widget window. Used for communication with the parent application
        const listener = TurnstileWidgetFrame.addEventListener(`frame-load`, (event: WidgetEventDetail<string>) => {
            TurnstileWidgetFrame.currentIdentifier = event.content;
            TurnstileWidgetFrame.removeEventListener(listener);
            frameLoaded(event.content);
        });
    }

    /**
     * Set up a callback for the specified event from the widget component in a hosting application.
     * @param eventName The event name to listen for when receiving bridged messages.
     * @param listener The callback to invoke when the specified event occurs.
     * @returns Event listener instance that can be used to remove the listener via `Widget.removeEventListener`
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static addEventListener<T = any, U = any>(eventName: string, listener: (event: WidgetEventDetail<T, U>) => void): (event: MessageEvent<BridgeInfo<T>>) => void {
        // Listen for messages on the widget window. Used for communication with the parent application
        const messageListener = (event: MessageEvent<BridgeInfo<T>>): void => {
            // Check if received message is a parent application message
            if (typeof event.data === `object` && event.data.bridgeEvent && event.data.fromApplication === true && event.data.bridgeEvent === eventName) {
                TurnstileWidgetFrame.currentIdentifier = event.data.identifier;
                listener({
                    content: event.data.detail as T,
                    callback: event.data.callbackId
                        ? (detail: U): void => {
                              TurnstileWidgetFrame.messageApplication(event.data.identifier, event.data.callbackId as string, detail);
                          }
                        : undefined
                });
            }
        };
        window.addEventListener(`message`, messageListener);
        return messageListener;
    }

    /**
     * Remove the listener from the widget component in a hosting application.
     * @param messageListener The listener instance created by `Widget.addEventListener` to remove
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static removeEventListener<T = any>(messageListener: (event: MessageEvent<BridgeInfo<T>>) => void): void {
        window.removeEventListener(`message`, messageListener);
    }
}

customElements.define('turnstile-widget-frame', TurnstileWidgetFrame);

declare global {
    const turnstile: Turnstile;

    interface HTMLElementTagNameMap {
        'turnstile-widget-frame': TurnstileWidgetFrame;
    }

    interface Window {
        turnstile?: Turnstile;
    }

    interface Turnstile {
        /**
         * The ready function will be invoked once the DOM is ready, at this point the turnstile can be rendered.
         * @param callback
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#explicitly-render-the-turnstile-widget
         */
        ready(callback: () => void): void;

        /**
         * The render function takes an argument to a HTML widget.
         * If the invocation is successful, the function returns a widgetId (string).
         * If the invocation is unsuccessful, the function returns undefined.
         * @param container
         * @param params
         * @returns
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#explicitly-render-the-turnstile-widget
         */
        render: (container?: string | HTMLElement, params?: RenderOptions) => string | undefined;
    }

    interface RenderOptions {
        /**
         * Every widget has a sitekey. This sitekey is associated with the corresponding widget configuration and is created upon the widget creation.
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         */
        sitekey: string;

        /**
         * A callback invoked upon success of the turnstile challenge. The callback is passed a token that can be validated.
         * @param token
         * @returns
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         */
        callback?: (token: string) => void;

        /**
         * A callback invoked when there is an error (e.g. network error or the challenge failed). Refer to {@link https://developers.cloudflare.com/turnstile/reference/client-side-errors client-side errors}.
         * @param errorCode
         * @returns
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         */
        'error-callback'?: (errorCode: unknown) => void;

        /**
         * A callback invoked when the token expires and does not reset the widget.
         * @returns
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         */
        'expired-callback'?: () => void;

        /**
         * A callback invoked when a given client/browser is not supported by Turnstile.
         * @returns
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         */
        'unsupported-callback'?: () => void;

        /**
         * The widget theme. Can take the following values: light, dark, auto.
         * The default is auto, which respects the user preference. This can be forced to light or dark by setting the theme accordingly.
         * @default 'auto'
         */
        theme?: TurnstileTheme;

        /**
         * The widget size. Can take the following values: normal, compact.
         * Normal is 300px by 65px, and compact is 130px by 120px.
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#widget-size
         * @default 'normal'
         */
        size?: TurnstileSize;

        /**
         * Controls whether the widget should automatically retry to obtain a token if it did not succeed.
         * The default is auto, which will retry automatically. This can be set to never to disable retry upon failure.
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         * @default 'auto'
         */
        retry?: TurnstileRetry;

        /**
         * When retry is set to auto, retry-interval controls the time between retry attempts in milliseconds.
         * Value must be a positive integer less than 900000, defaults to 8000.
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         * @default 8000
         */
        'retry-interval'?: number;

        /**
         * Automatically refreshes the token when it expires. Can take auto, manual or never, defaults to auto.
         * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations
         * @default 'auto'
         */
        'refresh-expired'?: RefreshExpired;
    }

    type TurnstileTheme = 'auto' | 'light' | 'dark';

    type TurnstileSize = 'normal' | 'compact';

    type TurnstileRetry = 'auto' | 'never';

    type RefreshExpired = 'auto' | 'manual' | 'never';
}
