export interface TypedEventTarget<
  Events extends { [x: string]: Event },
> extends EventTarget {
  addEventListener<K extends keyof Events>(
    type: K,
    listener: (this: this, ev: Events[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends keyof Events>(
    type: K,
    callback: (this: this, ev: Events[K]) => unknown,
    options?: EventListenerOptions | boolean
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void;
}

export const TypedEventTarget = EventTarget as {
  new <Events extends { [x: string]: Event }>(): TypedEventTarget<Events>;
  prototype: TypedEventTarget<{ [x: string]: Event }>;
};

export function range(start: number, end?: number, step = 1) {
  let output = [];
  if (typeof end === "undefined") {
    end = start;
    start = 0;
  }
  for (let i = start; i < end; i += step) {
    output.push(i);
  }
  return output;
}
