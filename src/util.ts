export interface Accessor {
  (name: string, peek: true): boolean;
  (name: string, peek: false): any;
  (name: string, peek?: boolean): any;
}

export interface Store {
  get(name: string, next: Accessor): any;
  has(name: string, next: Accessor): boolean;
}

export type Storage = { [name: string]: any } | ((name: string) => any);

export function getValueOrNext(name: string, storage: Storage, next: Accessor): any {
  const value = typeof storage === 'function' ? storage(name) : storage[name];
  return value !== undefined ? value : next(name);
}

export function peekValueOrNext(name: string, storage: Storage, next: Accessor): boolean {
  const exists = typeof storage === 'function' ? storage(name) !== undefined : name in storage;
  return exists || next(name, true);
}

export function createStore(storage: Storage, nameModifier: (name: string) => string = _ => _) {
  return {
    get: (name: string, next: Accessor) => getValueOrNext(nameModifier(name), storage, next),
    has: (name: string, next: Accessor) => peekValueOrNext(nameModifier(name), storage, next)
  };
}

export function createAccessor(store: Store, next: Accessor): Accessor {
  return (name: string, peek?: boolean) => {
    if (peek === true) {
      return store.has(name, next);
    } else {
      return store.get(name, next);
    }
  };
}

export const baseAccessor = (_: string, peek?: boolean) => {
  if (peek === true) return false;
  else return undefined as any;
};
