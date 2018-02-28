/**
 * Runtime error caused by unexpected types.
 */
export default class TypeError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
}
