import camelCase = require('camel-case');
import TypeError from '../src/TypeError';
import * as util from '../src/util';

const baseAccessor: util.Accessor = <T>(name: string, arg1: true | util.Resolver<T> = _ => _) =>
  arg1 === true ? false : undefined;

test('getValueOrNext with object storage and existing key', () => {
  const accessor = jest.fn(baseAccessor);
  const value = util.getValueOrNext('test', new util.ObjectSupplier({ test: 42 }), accessor);
  expect(value).toBe(42);
  expect(accessor).not.toHaveBeenCalled();
});

test('getValueOrNext with object storage and non-existing key', () => {
  const accessor = jest.fn(baseAccessor);
  const value = util.getValueOrNext('test', new util.ObjectSupplier({}), accessor);
  expect(value).toBeUndefined();
  expect(accessor).toHaveBeenCalledWith('test', expect.any(Function));
});

test('getValueOrNext with resolver', () => {
  const accessor = jest.fn(baseAccessor);
  const value = util.getValueOrNext(
    'test',
    new util.ObjectSupplier({ test: '42' }),
    accessor,
    parseInt
  );
  expect(value).toBe(42);
});

test('getValueOrNext should merge objects', () => {
  const accessor: util.Accessor = (name: string, _: any) => ({ object: { y: null, z: 'z' } }[name]);
  const value = util.getValueOrNext(
    'object',
    new util.ObjectSupplier({ object: { x: 'x', y: 'y' } }),
    accessor
  );
  expect(value).toEqual({ x: 'x', y: 'y', z: 'z' });
});

test('getValueOrNext should not merge non-objects', () => {
  const accessor: util.Accessor = (name: string, _: any) => ({ object: [1, 2, 3] }[name]);
  const value = util.getValueOrNext(
    'object',
    new util.ObjectSupplier({ object: { x: 'x' } }),
    accessor
  );
  expect(value).toEqual({ x: 'x' });
});

test('peekValueOrNext with object storage and existing key', () => {
  const accessor = jest.fn(baseAccessor);
  const value = util.peekValueOrNext('test', new util.ObjectSupplier({ test: 0 }), accessor);
  expect(value).toBe(true);
  expect(accessor).not.toHaveBeenCalled();
});

test('peekValueOrNext with object storage and non-existing key', () => {
  const accessor = jest.fn(baseAccessor);
  const value = util.peekValueOrNext('test', new util.ObjectSupplier({}), accessor);
  expect(value).toBe(false);
  expect(accessor).toHaveBeenCalledWith('test', true);
});

test('createStore without modifier', () => {
  const store = util.createStore(new util.ObjectSupplier({ test: 42 }));
  expect(store.get('test', baseAccessor)).toBe(42);
  expect(store.get('none', baseAccessor)).toBeUndefined();
  expect(store.has('test', baseAccessor)).toBe(true);
  expect(store.has('none', baseAccessor)).toBe(false);
});

test('createStore with modifier', () => {
  const modifier = jest.fn((name: string) => name.toUpperCase());
  const store = util.createStore(new util.ObjectSupplier({ TEST: 42 }), modifier);

  expect(store.get('test', baseAccessor)).toBe(42);
  expect(modifier).toHaveBeenCalledWith('test');
  modifier.mockClear();

  expect(store.get('none', baseAccessor)).toBeUndefined();
  expect(modifier).toHaveBeenCalledWith('none');
  modifier.mockClear();

  expect(store.has('test', baseAccessor)).toBe(true);
  expect(modifier).toHaveBeenCalledWith('test');
  modifier.mockClear();

  expect(store.has('none', baseAccessor)).toBe(false);
  expect(modifier).toHaveBeenCalledWith('none');
});

test('createAccessor', () => {
  const nextAccessor = jest.fn(baseAccessor);
  const store = util.createStore(new util.ObjectSupplier({ test: 42 }));
  const accessor = util.createAccessor(store, nextAccessor);
  expect(accessor('test')).toBe(42);
  expect(accessor('test', true)).toBe(true);
  expect(accessor('none')).toBeUndefined();
  expect(accessor('none', true)).toBe(false);
});

test('baseAccessor', () => {
  expect(util.baseAccessor('test')).toBeUndefined();
  expect(util.baseAccessor('test', _ => _)).toBeUndefined();
  expect(util.baseAccessor('test', true)).toBe(false);
});

test('aggregateContainerValues', () => {
  const container = {
    TYPE_CONF_A: 'a',
    TYPE_CONF_B: 'b',
    TYPE_CONF_C__AA: 'aa',
    TYPE_CONF_C__BB: 'bb',
    D: 'd',
    TYPE_CONF_E: 'e'
  };

  expect(util.aggregateContainerValues(container, 'TYPE_CONF', '__', camelCase)).toEqual({
    a: 'a',
    b: 'b',
    c: { aa: 'aa', bb: 'bb' },
    e: 'e'
  });
});

test('randomString', () => {
  expect(typeof util.randomString() === 'string').toBe(true);
  expect(util.randomString()).toHaveLength(8);
});

test('assertString', () => {
  expect(util.assertString('test')).toEqual('test');
  expect(util.assertString(undefined)).toBeUndefined();
  expect(() => util.assertString(null)).toThrowError(TypeError);
});

test('assertNumber', () => {
  expect(util.assertNumber(42)).toEqual(42);
  expect(util.assertNumber(undefined)).toBeUndefined();
  expect(() => util.assertNumber(null)).toThrowError(TypeError);
});

test('assertObject', () => {
  expect(util.assertObject({})).toEqual({});
  expect(util.assertObject(undefined)).toBeUndefined();
  expect(() => util.assertObject(0)).toThrowError(TypeError);
});

test('assertType', () => {
  expect(util.assertType([], Array)).toEqual([]);
  expect(util.assertType(undefined, Array)).toBeUndefined();
  expect(() => util.assertType(0, Array)).toThrowError(TypeError);
});

test('ObjectSuppler', () => {
  const supplier = new util.ObjectSupplier({ test: 'test' });
  expect(supplier.get('test')).toEqual('test');
  expect(supplier.aggregate()).toEqual({ test: 'test' });
});

test('isSupplier', () => {
  expect(
    util.isSupplier({
      get() {
        return null;
      },
      aggregate() {
        return null;
      }
    })
  ).toBe(true);
});
