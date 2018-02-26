import merge = require('lodash.merge');
import Newable from './Newable';
import TypeError from './TypeError';

export interface Accessor {
  (name: string, peek: true): boolean;
  <T>(name: string, resolve?: Resolver<T>): T | undefined;
  <T>(name: string, arg1?: true | Resolver<T>): boolean | T | undefined;
}

export interface Store {
  get<T>(name: string, next: Accessor, resolve?: Resolver<T>): T | undefined;
  has(name: string, next: Accessor): boolean;
}

export type Storage = { [name: string]: any } | ((name: string) => any);

export type Resolver<T> = (value?: any) => T | undefined;

export function getValueOrNext<T>(
  name: string,
  storage: Storage,
  next: Accessor,
  resolve: Resolver<T> = (_: any) => _
): T | undefined {
  const value = resolve(typeof storage === 'function' ? storage(name) : storage[name]);
  if (value === undefined) {
    return next(name, resolve);
  }
  // Merge multiple object-values with the same name in hierarchically nested stores.
  if (typeof value === 'object' && !Array.isArray(value)) {
    const nextValue = next(name, resolve);
    if (typeof nextValue === 'object' && !Array.isArray(nextValue)) {
      return merge({}, nextValue, value);
    }
  }
  return value;
}

export function peekValueOrNext(name: string, storage: Storage, next: Accessor): boolean {
  const exists = typeof storage === 'function' ? storage(name) !== undefined : name in storage;
  return exists || next(name, true);
}

export function createStore(
  storage: Storage,
  nameModifier: (name: string) => string = _ => _
): Store {
  return {
    get: <T>(name: string, next: Accessor, resolve?: Resolver<T>) =>
      getValueOrNext(nameModifier(name), storage, next, resolve),
    has: (name: string, next: Accessor) => peekValueOrNext(nameModifier(name), storage, next)
  };
}

export function createAccessor(store: Store, next: Accessor): Accessor {
  return <T>(name: string, arg1: true | Resolver<T> = (_: any) => _) => {
    if (arg1 === true) {
      return store.has(name, next);
    } else {
      return store.get(name, next, arg1);
    }
  };
}

export const baseAccessor: Accessor = <T>(_: string, arg1?: boolean | Resolver<T>) => {
  if (arg1 === true) return false;
  else if (arg1) return arg1(undefined);
  else return undefined;
};

export function randomString(): string {
  return Math.random()
    .toString(36)
    .substring(2, 10);
}

export function assertString(value: any): string | undefined {
  if (typeof value === 'string' || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be string but was ${typeof value}`);
}

export function assertNumber(value: any): number | undefined {
  if ((typeof value === 'number' && !isNaN(value)) || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be number but was ${typeof value}`);
}

export function assertObject(value: any): object | undefined {
  if (typeof value === 'object' || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be object but was ${typeof value}`);
}

export function assertType<T>(value: any, newable: Newable<T>): T | undefined {
  if (value instanceof newable || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be ${newable.name} but was ${typeof value}`);
}
