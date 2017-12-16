import { Accessor, baseAccessor, createAccessor, createStore, Store } from './util';

function randomString(): string {
  return Math.random()
    .toString(36)
    .substring(2, 10);
}

export class TypeError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
}

export interface Newable<T> {
  new (...args: any[]): T;
}

/**
 * A hierarchical configuration manager that supports multiple sources.
 */
export default class TypeConf {
  private readonly override: { [key: string]: any };
  private readonly stores: { [name: string]: Store };
  private rootAccessor: Accessor;

  constructor() {
    this.override = {};
    this.stores = {};
    this.rootAccessor = baseAccessor;
  }

  private resolve(name: string): any {
    if (name in this.override) {
      return this.override[name];
    }
    return this.rootAccessor(name, false);
  }

  private exists(name: string): boolean {
    if (name in this.override) {
      return true;
    }
    return this.rootAccessor(name, true);
  }

  protected addStore(store: Store, name: string): void {
    this.stores[name] = store;
    this.rootAccessor = createAccessor(store, this.rootAccessor);
  }

  /**
   * Use an object as a source.
   * @param storage Object store to use.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  public withStore(storage: { [key: string]: any }, name: string = randomString()): TypeConf {
    const store = createStore(Object.assign({}, storage));
    this.addStore(store, name);
    return this;
  }

  /**
   * Use a function as a source.
   * @param provider Function that returns a value for a given key.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  public withSupplier(supplier: (key: string) => any, name: string = randomString()): TypeConf {
    const store = createStore(supplier);
    this.addStore(store, name);
    return this;
  }

  /**
   * Set an override value.
   * @param key Name of the value.
   * @param value Actual value.
   * @return This TypeConf instance.
   */
  public set(key: string, value: any): TypeConf {
    this.override[key] = value;
    return this;
  }

  /**
   * Delete an override value.
   * @param key Name of the value.
   * @return This TypeConf instance.
   */
  public unset(key: string): TypeConf {
    delete this.override[key];
    return this;
  }

  /**
   * Return a stored value.
   * @param name Name of the value.
   * @param transform Optional transformation function.
   * @return The stored value.
   */
  public get<T>(name: string, transform: (x: any) => T): T;
  public get<T>(name: string, transform?: undefined): any;
  public get<T>(name: string, transform?: ((x: any) => T)): T | any {
    if (typeof transform === 'function') {
      return transform(this.resolve(name));
    } else {
      return this.resolve(name);
    }
  }

  /**
   * Return a stored value as a string.
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as a string.
   */
  public getString(name: string, fallback: string): string;
  public getString(name: string, fallback?: string): string | undefined;
  public getString(name: string, fallback?: string): string | undefined {
    const value = this.resolve(name);
    if (typeof value === 'string') {
      return value;
    }
    if (value !== undefined) {
      return JSON.stringify(value);
    }
    if (typeof fallback === 'string') {
      return fallback;
    }
    if (fallback === undefined) {
      return;
    }
    throw new TypeError(`Not a string: ${fallback}`);
  }

  /**
   * Return a stored value as a number.
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as a number.
   */
  public getNumber(name: string, fallback: number): number;
  public getNumber(name: string, fallback?: number): number | undefined;
  public getNumber(name: string, fallback?: number): number | undefined {
    const value = this.resolve(name);
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        return parsedValue;
      }
      throw new TypeError(`Not a number: ${value}`);
    }
    if (value !== undefined && fallback === undefined) {
      throw new TypeError(`Not a number: ${value}`);
    }
    if (typeof fallback === 'number' && !isNaN(fallback)) {
      return fallback;
    }
    if (fallback === undefined) {
      return;
    }
    throw new TypeError(`Not a number: ${fallback}`);
  }

  /**
   * Return a stored value as a boolean.
   * @param name Name of the value.
   * @return The stored value as a boolean.
   */
  public getBoolean(name: string): boolean {
    const value = this.resolve(name);
    return value !== false && value !== 'false' && this.exists(name);
  }

  /**
   * Return a stored value as an object.
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as an object.
   */
  public getObject(name: string, fallback: object): object;
  public getObject(name: string, fallback?: object): object | undefined;
  public getObject(name: string, fallback?: object): object | undefined {
    const value = this.resolve(name);
    if (typeof value === 'object' && value) {
      return value;
    }
    if (typeof value === 'string' && value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new TypeError(`Not an object: ${value}`);
      }
    }
    if (fallback === undefined) {
      return;
    }
    if (typeof fallback === 'object') {
      return fallback;
    }
    throw new TypeError(`Not an object: ${fallback}`);
  }

  /**
   * Return a stored value as an instantiable type.
   * @param name Name of the value.
   * @param Newable Constructor of the type to instantiate.
   * @param fallback Optional fallback value.
   */
  public getType<T>(name: string, newable: Newable<T>, fallback: T): T;
  public getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined;
  public getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined {
    const value = this.resolve(name);
    if (value === undefined) {
      return fallback;
    }
    try {
      return new newable(value);
    } catch (e) {
      throw new TypeError(`Cannot instantiate ${newable.name} from ${value}.`, e);
    }
  }
}
