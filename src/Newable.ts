/**
 * Generic instantiable type.
 */
export interface Newable<T> {
  new (...args: unknown[]): T;
}

export default Newable;
