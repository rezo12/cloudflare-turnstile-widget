/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BridgeInfo, WidgetEventDetail, TurnstileSize } from './TurnstileWidget.js';

export class TurnstileWidgetFrame extends HTMLElement {

    private static _currentIdentifier?: string;

    /**
     * The identifier passed down from the `turnstile-widget` which is hosting the frame.
    */
    public static get currentIdentifier(): string | undefined {
        return TurnstileWidgetFrame._currentIdentifier;
    }

    private static set currentIdentifier(identifier: string | undefined) {
        TurnstileWidgetFrame._currentIdentifier = identifier;
    }

    /**
     * The sitekey that is passed down from the widget.
     * @attr
    */
    public get sitekey(): string | null {
        return this.getAttribute('sitekey');
    }

    public set sitekey(value: string | null) {
        if (this.getAttribute('sitekey') !== value && value) {
            this.setAttribute('sitekey', value);
        }
    }

    /**
     * The theme that is passed down from the widget.
     * @attr
    */
    public get theme(): Turnstile.Theme | null {
        return this.getAttribute('theme') as Turnstile.Theme;
    }

    public set theme(value: string | null) {
        if (this.getAttribute('theme') !== value && value) {
            this.setAttribute('theme', value);
        }
    }

    /**
     * The theme that is passed down from the widget.
     * @attr
    */
    public get size(): TurnstileSize | null {
        return this.getAttribute('size') as TurnstileSize;
    }

    public set size(value: string | null) {
        if (this.getAttribute('size') !== value && value) {
            this.setAttribute('size', value);
        }
    }

    /**
     * Initialises the component.
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                turnstile.render(div, {
                    sitekey: this.sitekey!,
                    callback: (token: string) => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'success', token);
                    },
                    'error-callback': () => {
                        TurnstileWidgetFrame.messageApplication(TurnstileWidgetFrame.currentIdentifier!, 'error');
                    },
                    theme: this.theme ? this.theme : 'auto',
                    size: this.size ? this.size : 'normal'
                } as any)
            });
        }

        TurnstileWidgetFrame.initialise(widgetLoad);
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
    public static messageApplication<T, U = any>(
        identifier: string,
        eventName: string,
        detail?: T,
        callback?: (detail: U) => void,
        timeout?: number,
        timeoutCallback?: () => void,
        callbackIdentifierPrefix = 'widget-callback'
    ): void {
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
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
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
    public static messageApplicationAsync<T, U = any>(
        identifier: string,
        eventName: string,
        detail: T,
        timeout = 3000,
        callbackIdentifierPrefix = 'widget-callback'
    ): Promise<U> {
        return new Promise<U>((resolve, reject) => {
            try {
                TurnstileWidgetFrame.messageApplication(
                    identifier,
                    eventName,
                    detail,
                    resolve,
                    timeout,
                    () => reject(new Error(`No response received for '${eventName}' in the given timeout: ${timeout}ms`)),
                    callbackIdentifierPrefix
                );
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
    public static initialise(frameLoaded: (identifier: string) => void): void {
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
            if (
                typeof event.data === `object` &&
                event.data.bridgeEvent &&
                event.data.fromApplication === true &&
                event.data.bridgeEvent === eventName
            ) {
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
    interface HTMLElementTagNameMap {
        'turnstile-widget-frame': TurnstileWidgetFrame;
    }
}