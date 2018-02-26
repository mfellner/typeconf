import merge = require('lodash.merge');
import Newable from './Newable';
import TypeConf from './TypeConf';
import TypeError from './TypeError';
import {
  Accessor,
  baseAccessor,
  createAccessor,
  createStore,
  randomString,
  Resolver,
  Store
} from './util';

export default abstract class TypeConfBase implements TypeConf {
  private readonly override: { [key: string]: any };
  private readonly stores: { [name: string]: Store };
  private rootAccessor: Accessor;

  constructor() {
    this.override = {};
    this.stores = {};
    this.rootAccessor = baseAccessor;
  }

  private resolve<T>(name: string, resolve?: Resolver<T>): T | undefined {
    if (name in this.override) {
      return this.override[name];
    }
    return this.rootAccessor(name, resolve);
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

  public withStore(storage: { [key: string]: any }, name: string = randomString()): TypeConf {
    const store = createStore(Object.assign({}, storage));
    this.addStore(store, name);
    return this;
  }

  public withSupplier(supplier: (key: string) => any, name: string = randomString()): TypeConf {
    const store = createStore(supplier);
    this.addStore(store, name);
    return this;
  }

  public withArgv(): TypeConf {
    throw new Error('not implemented: withArgv');
  }

  public withEnv(_?: string, __?: string): TypeConf {
    throw new Error('not implemented: withEnv');
  }

  public withFile(_: string): TypeConf {
    throw new Error('not implemented: withEnv');
  }

  public withDOMNode(_: string): TypeConf {
    throw new Error('not implemented: withDOMNode');
  }

  public set(key: string, value: any): TypeConf {
    this.override[key] = value;
    return this;
  }

  public unset(key: string): TypeConf {
    delete this.override[key];
    return this;
  }

  public get<T>(name: string, transform: (x: any) => T): T;
  public get<T>(name: string, transform?: undefined): any;
  public get<T>(name: string, transform?: ((x: any) => T)): T | any {
    if (typeof transform === 'function') {
      return transform(this.resolve(name));
    } else {
      return this.resolve(name);
    }
  }

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

  public getBoolean(name: string): boolean {
    const value = this.resolve(name);
    return value !== false && value !== 'false' && this.exists(name);
  }

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

  public toJSON(): object {
    const aggregate: object = {};
    for (const store of Object.values(this.stores)) {
      merge(aggregate, store);
    }
    return aggregate;
  }

  public toBase64(): string {
    throw new Error('not implemented: toBase64');
  }
}
