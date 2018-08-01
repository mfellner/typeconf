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
  aggregate(): ObjectStorage;
}

export type ObjectStorage = { [name: string]: unknown };

export interface Supplier {
  get(name: string): unknown;
  aggregate(): ObjectStorage;
}

export function isSupplier(value: any): value is Supplier {
  return (
    typeof value === 'object' &&
    'get' in value &&
    typeof value.get === 'function' &&
    'aggregate' in value &&
    typeof value.aggregate === 'function'
  );
}

export class ObjectSupplier implements Supplier {
  private readonly storage: ObjectStorage;

  constructor(storage: ObjectStorage) {
    this.storage = { ...storage };
  }

  public get(name: string): unknown {
    return this.storage[name];
  }

  public aggregate(): ObjectStorage {
    return { ...this.storage };
  }
}

export type Resolver<T> = (value?: any) => T | undefined;

export function getValueOrNext<T>(
  name: string,
  supplier: Supplier,
  next: Accessor,
  resolve: Resolver<T> = (_: any) => _
): T | undefined {
  const value = resolve(supplier.get(name));
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

export function peekValueOrNext(name: string, supplier: Supplier, next: Accessor): boolean {
  return typeof supplier.get(name) !== 'undefined' || next(name, true);
}

export function createStore(
  supplier: Supplier,
  nameModifier: (name: string) => string = _ => _
): Store {
  return {
    get<T>(name: string, next: Accessor, resolve?: Resolver<T>) {
      return getValueOrNext(nameModifier(name), supplier, next, resolve);
    },
    has(name: string, next: Accessor) {
      return peekValueOrNext(nameModifier(name), supplier, next);
    },
    aggregate() {
      return supplier.aggregate();
    }
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

export type Aggregate = { [key: string]: string | Aggregate };

export function aggregateContainerValues(
  container: { [key: string]: string | undefined },
  prefix: string,
  separator: string,
  keyTransform: (key: string) => string
) {
  const aggregate: Aggregate = {};
  for (const key of Object.keys(container).filter(
    k => k.startsWith(prefix) && typeof container[k] !== 'undefined'
  )) {
    const subKeys = key
      .replace(prefix, '')
      .split(separator)
      .filter(k => k);
    if (subKeys.length > 1) {
      let currentAggregate = aggregate;
      for (let i = 0; i < subKeys.length; i += 1) {
        const k = keyTransform(subKeys[i]);
        if (i < subKeys.length - 1) {
          currentAggregate[k] = aggregate[k] || {};
          currentAggregate = currentAggregate[k] as Aggregate;
        } else {
          currentAggregate[k] = container[key]!;
        }
      }
    } else {
      const k = keyTransform(key.replace(prefix, ''));
      aggregate[k] = container[key]!;
    }
  }
  return aggregate;
}

export function randomString(): string {
  return Math.random()
    .toString(36)
    .substring(2, 10);
}

export function assertString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be string but was ${typeof value}`);
}

export function assertNumber(value: unknown): number | undefined {
  if ((typeof value === 'number' && !isNaN(value)) || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be number but was ${typeof value}`);
}

export function assertObject(value: unknown): object | undefined {
  if (value instanceof Object || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be object but was ${typeof value}`);
}

function isNewable<T>(value: unknown, newable: Newable<T>): value is T {
  return value instanceof newable;
}

export function assertType<T>(value: unknown, newable: Newable<T>): T | undefined {
  if (isNewable(value, newable) || typeof value === 'undefined') {
    return value;
  }
  throw new TypeError(`expected value to be ${newable.name} but was ${typeof value}`);
}
