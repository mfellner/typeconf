/**
 * Runtime error caused inside a store.
 */
export default class StoreError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
}
