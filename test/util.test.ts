import * as util from '../src/util';

test('getValueOrNext with object storage and existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.getValueOrNext('test', { test: 42 }, accessor);
  expect(value).toBe(42);
  expect(accessor).not.toHaveBeenCalled();
});

test('getValueOrNext with function storage and existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.getValueOrNext('test', name => ({ test: 42 }[name]), accessor);
  expect(value).toBe(42);
  expect(accessor).not.toHaveBeenCalled();
});

test('getValueOrNext with object storage and non-existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.getValueOrNext('test', {}, accessor);
  expect(value).toBeUndefined();
  expect(accessor).toHaveBeenCalledWith('test');
});

test('getValueOrNext with function storage and non-existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.getValueOrNext('test', name => ({}[name]), accessor);
  expect(value).toBeUndefined();
  expect(accessor).toHaveBeenCalledWith('test');
});

test('peekValueOrNext with object storage and existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.peekValueOrNext('test', { test: 0 }, accessor);
  expect(value).toBe(true);
  expect(accessor).not.toHaveBeenCalled();
});

test('peekValueOrNext with function storage and existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.peekValueOrNext('test', name => ({ test: 0 }[name]), accessor);
  expect(value).toBe(true);
  expect(accessor).not.toHaveBeenCalled();
});

test('peekValueOrNext with object storage and non-existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.peekValueOrNext('test', {}, accessor);
  expect(value).toBe(false);
  expect(accessor).toHaveBeenCalledWith('test', true);
});

test('peekValueOrNext with function storage and non-existing key', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const value = util.peekValueOrNext('test', name => ({}[name]), accessor);
  expect(value).toBe(false);
  expect(accessor).toHaveBeenCalledWith('test', true);
});

test('createStore without modifier', () => {
  const accessor = jest.fn((name: string, peek: boolean) => (peek ? false : undefined));
  const store = util.createStore({ test: 42 });
  expect(store.get('test', accessor)).toBe(42);
  expect(store.get('none', accessor)).toBeUndefined();
  expect(store.has('test', accessor)).toBe(true);
  expect(store.has('none', accessor)).toBe(false);
});

test('createStore with modifier', () => {
  const accessor = (name: string, peek: boolean) => (peek ? false : undefined);
  const modifier = jest.fn((name: string) => name.toUpperCase());
  const store = util.createStore({ TEST: 42 }, modifier);

  expect(store.get('test', accessor)).toBe(42);
  expect(modifier).toHaveBeenCalledWith('test');
  modifier.mockClear();

  expect(store.get('none', accessor)).toBeUndefined();
  expect(modifier).toHaveBeenCalledWith('none');
  modifier.mockClear();

  expect(store.has('test', accessor)).toBe(true);
  expect(modifier).toHaveBeenCalledWith('test');
  modifier.mockClear();

  expect(store.has('none', accessor)).toBe(false);
  expect(modifier).toHaveBeenCalledWith('none');
});

test('createAccessor', () => {
  const nextAccessor = (name: string, peek: boolean) => (peek ? false : undefined);
  const store = util.createStore({ test: 42 });
  const accessor = util.createAccessor(store, nextAccessor);
  expect(accessor('test')).toBe(42);
  expect(accessor('test', true)).toBe(true);
  expect(accessor('none')).toBeUndefined();
  expect(accessor('none', true)).toBe(false);
});

test('baseAccessor', () => {
  expect(util.baseAccessor('test')).toBeUndefined();
  expect(util.baseAccessor('test', true)).toBe(false);
});
