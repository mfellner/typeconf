import changeCase = require('change-case');
import fs = require('fs');
import merge = require('lodash.merge');
import path = require('path');

function readFile(file: string, parser: (s: string) => any): object {
  try {
    const result = parser(fs.readFileSync(file, 'utf8'));
    if (typeof result === 'object' && result !== null) return result;
    console.error(`Invalid configuration file: ${file}`);
  } catch (e) {
    console.error(`Unable to read ${file}`);
  }
  return {};
}

function readConfigFile(filePath: string): object {
  const extname = path.extname(filePath);

  switch (extname) {
    case '.yml':
    case '.yaml':
      return readFile(filePath, require('js-yaml').safeLoad);
    case '.json':
      return readFile(filePath, JSON.parse);
    default:
      console.error(`Unsupported file: ${filePath}\n`);
      return {};
  }
}

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

interface Accessor {
  (name: string, peek: true): boolean;
  (name: string, peek: false): any;
  (name: string, peek?: boolean): any;
}

interface Store {
  get(name: string, next: Accessor): any;
  has(name: string, next: Accessor): boolean;
}

type Storage = { [name: string]: any } | ((name: string) => any);

function getValueOrNext(name: string, storage: Storage, next: Accessor): any {
  const value = typeof storage === 'function' ? storage(name) : storage[name];
  return value !== undefined ? value : next(name);
}

function peekValueOrNext(name: string, storage: Storage, next: Accessor): boolean {
  const exists = typeof storage === 'function' ? storage(name) !== undefined : name in storage;
  return exists || next(name, true);
}

function createStore(storage: Storage, nameModifier: (name: string) => string = _ => _) {
  return {
    get: (name: string, next: Accessor) => getValueOrNext(nameModifier(name), storage, next),
    has: (name: string, next: Accessor) => peekValueOrNext(nameModifier(name), storage, next)
  };
}

function createAccessor(store: Store, next: Accessor): Accessor {
  return (name: string, peek?: boolean) => {
    if (peek === true) {
      return store.has(name, next);
    } else {
      return store.get(name, next);
    }
  };
}

const baseAccessor = (_: string, peek?: boolean) => {
  if (peek === true) return false;
  else return undefined as any;
};

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

  private addStore(store: Store, name: string): void {
    this.stores[name] = store;
    this.rootAccessor = createAccessor(store, this.rootAccessor);
  }

  /**
   * Use command line arguments as a source.
   *
   * When looking up argument names, all names will be transformed
   * into camelCase. This means that arguments names must be
   * declared in camelCase.
   * @return This TypeConf instance.
   */
  public withArgv(): TypeConf {
    const argv = require('minimist')(process.argv.slice(2));
    const store = createStore(argv, changeCase.camel);

    this.addStore(store, '__argv__');
    return this;
  }

  /**
   * Use environment variables as a source. If a prefix is configured,
   * it will be prepended to configuration value names during lookup.
   *
   * When looking up environment variables, all names will be transformed
   * into CONSTANT_CASE. This means that environment variables must be
   * declared in CONSTANT_CASE.
   * @param prefix Prefix of environment variables.
   * @param separator Separator string for nested properties.
   * @return This TypeConf instance.
   */
  public withEnv(prefix: string = '', separator: string = '__'): TypeConf {
    const prefixValue = changeCase.constant(prefix);

    const getEnvName = (name: string) => {
      const keyValue = changeCase.constant(name);
      return prefixValue ? `${prefixValue}_${keyValue}` : keyValue;
    };

    const getPartialKeys = (envName: string) => {
      return Object.keys(process.env).filter(
        key => key.startsWith(envName) && key.includes(separator)
      );
    };

    const assignNestedProperty = (
      object: { [key: string]: any },
      nestedKeys: string[],
      value: any
    ) => {
      if (nestedKeys.length === 1) {
        const [key] = nestedKeys;
        object[key] = value;
      } else {
        const [key, ...rest] = nestedKeys;
        object[key] = merge({}, object[key]);
        assignNestedProperty(object[key], rest, value);
      }
    };

    const getNestedKeys = (key: string) =>
      key
        .split(separator)
        .slice(1)
        .map(s => changeCase.camel(s));

    const getPartial = (envName: string) => {
      const partial = {};
      for (const key of getPartialKeys(envName)) {
        assignNestedProperty(partial, getNestedKeys(key), process.env[key]);
      }
      return partial;
    };

    const store: Store = {
      get: (name, next) => {
        const envName = getEnvName(name);
        const result = process.env[envName];
        if (result !== undefined) return result;

        const partial = getPartial(envName);
        if (Object.keys(partial).length > 0) return merge({}, next(name), partial);
        else return next(name);
      },
      has: (name, next) => {
        const envName = getEnvName(name);
        const result = envName in process.env || getPartialKeys(envName).length > 0;
        return result || next(name, true);
      }
    };

    const storeName = prefixValue ? `ENV_${prefixValue}` : 'ENV';
    this.addStore(store, storeName);
    return this;
  }

  /**
   * Use a configuration file as a source. JSON and YAML are supported.
   * @param file The absolute or relative file path.
   * @return This TypeConf instance.
   */
  public withFile(file: string): TypeConf {
    if (!file) {
      return this;
    }
    const filePath = path.resolve(process.cwd(), file);
    const storage = readConfigFile(filePath);
    const store = createStore(storage);
    this.addStore(store, filePath);
    return this;
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
