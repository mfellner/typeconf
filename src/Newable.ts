/**
 * Generic instantiable type.
 */
export interface Newable<T> {
  new (...args: any[]): T;
}

export default Newable;
