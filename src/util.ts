import merge = require('lodash.merge');

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
  if (typeof value === 'object') {
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
