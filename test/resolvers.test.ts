import * as resolvers from '../src/resolvers';
import TypeError from '../src/TypeError';

test('resolveString', () => {
  expect(resolvers.resolveString('test')).toEqual('test');
  expect(resolvers.resolveString(42)).toEqual('42');
  expect(resolvers.resolveString(undefined)).toBeUndefined();
});

test('resolveNumber', () => {
  expect(resolvers.resolveNumber(42)).toEqual(42);
  expect(resolvers.resolveNumber('42')).toEqual(42);
  expect(resolvers.resolveNumber(undefined)).toBeUndefined();
  expect(() => resolvers.resolveNumber('test')).toThrowError(TypeError);
});

test('resolveObject', () => {
  expect(resolvers.resolveObject({})).toEqual({});
  expect(resolvers.resolveObject(null)).toEqual(null);
  expect(resolvers.resolveObject('{}')).toEqual({});
  expect(resolvers.resolveObject(undefined)).toBeUndefined();
  expect(() => resolvers.resolveObject(42)).toThrowError(TypeError);
  expect(() => resolvers.resolveObject('test')).toThrowError(TypeError);
});

test('resolveType', () => {
  class MyType {
    public readonly x: string;
    constructor(x: string) {
      if (!x) throw new Error();
      this.x = x;
    }
  }
  expect(resolvers.resolveType(MyType)('test')).toEqual(new MyType('test'));
  expect(resolvers.resolveType(MyType)(undefined)).toBeUndefined();
  expect(() => resolvers.resolveType(MyType)('')).toThrowError(TypeError);
});
