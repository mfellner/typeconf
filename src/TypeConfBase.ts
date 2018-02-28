import merge = require('lodash.merge');
import Newable from './Newable';
import * as resolvers from './resolvers';
import TypeConf from './TypeConf';
import {
  Accessor,
  assertNumber,
  assertObject,
  assertString,
  assertType,
  baseAccessor,
  createAccessor,
  createStore,
  ObjectSupplier,
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

  private resolve<T>(name: string, resolve: Resolver<T> = _ => _): T | undefined {
    if (name in this.override) {
      return resolve(this.override[name]);
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
    const store = createStore(new ObjectSupplier(storage));
    this.addStore(store, name);
    return this;
  }

  public withSupplier(supplier: (key: string) => any, name: string = randomString()): TypeConf {
    const store = createStore({
      get: supplier,
      aggregate() {
        return {}; // FIXME
      }
    });
    this.addStore(store, name);
    return this;
  }

  public withArgv(_?: (args: string[]) => { [key: string]: any }): TypeConf {
    return this;
  }

  public withEnv(_?: string, __?: string): TypeConf {
    return this;
  }

  public withFile(_: string): TypeConf {
    return this;
  }

  public withDOMNode(_: string): TypeConf {
    return this;
  }

  public set(key: string, value: any): TypeConf {
    if (typeof value === 'undefined') {
      return this;
    }
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
    const value = this.resolve(name, resolvers.resolveString);
    if (value !== undefined) return value;
    return assertString(fallback);
  }

  public getNumber(name: string, fallback: number): number;
  public getNumber(name: string, fallback?: number): number | undefined;
  public getNumber(name: string, fallback?: number): number | undefined {
    const value = this.resolve(name, resolvers.resolveNumber);
    if (value !== undefined) return value;
    return assertNumber(fallback);
  }

  public getBoolean(name: string): boolean {
    const value = this.resolve(name);
    return value !== false && value !== 'false' && this.exists(name);
  }

  public getObject(name: string, fallback: object): object;
  public getObject(name: string, fallback?: object): object | undefined;
  public getObject(name: string, fallback?: object): object | undefined {
    const value = this.resolve(name, resolvers.resolveObject);
    if (value !== undefined) return value;
    return assertObject(fallback);
  }

  public getType<T>(name: string, newable: Newable<T>, fallback: T): T;
  public getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined;
  public getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined {
    const value = this.resolve(name, resolvers.resolveType(newable));
    if (value !== undefined) return value;
    return assertType(fallback, newable);
  }

  public toJSON(): object {
    const aggregate: object = {};
    for (const store of Object.values(this.stores)) {
      merge(aggregate, store.aggregate());
    }
    return merge(aggregate, this.override);
  }

  public toBase64(): string {
    throw new Error('not implemented: toBase64');
  }
}
