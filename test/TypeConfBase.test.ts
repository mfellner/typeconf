import TypeConf from '../src/TypeConf';
import TypeConfBase from '../src/TypeConfBase';
import TypeError from '../src/TypeError';

class TypeConfBaseImpl extends TypeConfBase {}

type TestArgs = { name: string; conf: TypeConf; storage: { [key: string]: any } };

const { stringify } = JSON;

describe('TypeConfBase', () => {
  test('withArgv should do nothing', () => {
    expect(new TypeConfBaseImpl().withArgv()).toBeInstanceOf(TypeConfBaseImpl);
  });

  test('withEnv should do nothing', () => {
    expect(new TypeConfBaseImpl().withEnv()).toBeInstanceOf(TypeConfBaseImpl);
  });

  test('withFile should do nothing', () => {
    expect(new TypeConfBaseImpl().withFile('')).toBeInstanceOf(TypeConfBaseImpl);
  });

  test('withDOMNode should do nothing', () => {
    expect(new TypeConfBaseImpl().withDOMNode('')).toBeInstanceOf(TypeConfBaseImpl);
  });

  test('toBase64 should throw', () => {
    expect(() => new TypeConfBaseImpl().toBase64()).toThrowError(/not implemented/);
  });

  const storage = Object.freeze({
    string: 'test',
    number: 42,
    stringifiedNumber: '43',
    bool: true,
    stringifiedBool: 'false',
    object: { test: 'test' },
    stringifiedObject: JSON.stringify({ test: 'test' })
  });

  let conf: TypeConf;

  beforeEach(() => (conf = new TypeConfBaseImpl().withStore(storage)));

  test('TypeConfBase.get with store', () => {
    conf = new TypeConfBaseImpl().withStore(storage);
    expect(conf.get('string')).toEqual(storage['string']);
    expect(conf.get('number')).toEqual(storage['number']);
    expect(conf.get('bool')).toEqual(storage['bool']);
    expect(conf.get('object')).toEqual(storage['object']);
    expect(conf.get('none')).toBeUndefined();
  });

  test('TypeConfBase.get with supplier', () => {
    new TypeConfBaseImpl().withSupplier(name => storage[name]);
    expect(conf.get('string')).toEqual(storage['string']);
    expect(conf.get('number')).toEqual(storage['number']);
    expect(conf.get('bool')).toEqual(storage['bool']);
    expect(conf.get('object')).toEqual(storage['object']);
    expect(conf.get('none')).toBeUndefined();
  });

  test('TypeConfBase.get should merge multiple storages', () => {
    conf = new TypeConfBaseImpl()
      .withStore({ x: 'x' })
      .withSupplier(name => ({ y: 'y' }[name]))
      .withStore({ x: null, z: 'z' });
    expect(conf.get('x')).toEqual(null);
    expect(conf.get('y')).toEqual('y');
    expect(conf.get('z')).toEqual('z');
  });

  test('TypeConfBase.get should merge object values in multiple storages', () => {
    conf = new TypeConfBaseImpl()
      .withStore({ object: { w: 'w', x: 'x' } })
      .withSupplier(name => ({ object: { y: 'y' } }[name]))
      .withStore({ object: '{ "x": null, "z": "z" }' });
    expect(conf.getObject('object')).toEqual({ w: 'w', x: null, y: 'y', z: 'z' });
  });

  test('TypeConfBase.get with resolver', () => {
    const resolve = jest.fn((value: any) => stringify(value));
    expect(conf.get('string', resolve)).toEqual(stringify(storage['string']));
    expect(resolve).toBeCalled();
    resolve.mockClear();

    expect(conf.get('number', resolve)).toEqual(stringify(storage['number']));
    expect(resolve).toBeCalled();
    resolve.mockClear();

    expect(conf.get('bool', resolve)).toEqual(stringify(storage['bool']));
    expect(resolve).toBeCalled();
    resolve.mockClear();

    expect(conf.get('object', resolve)).toEqual(stringify(storage['object']));
    expect(resolve).toBeCalled();
    resolve.mockClear();

    expect(conf.get('none', resolve)).toBeUndefined();
    expect(resolve).toBeCalled();
  });

  test('TypeConfBase.set override', () => {
    expect(conf.set('number', 'override').get('number')).toEqual('override');
  });

  test('TypeConfBase.set new', () => {
    expect(conf.getBoolean('new')).toEqual(false);
    expect(conf.set('new', true).getBoolean('new')).toEqual(true);
  });

  test('TypeConfBase.set undefined', () => {
    expect(conf.set('number', undefined).get('number')).toEqual(storage['number']);
  });

  test('TypeConfBase.unset', () => {
    expect(
      conf
        .set('number', 'override')
        .unset('number')
        .get('number')
    ).toEqual(storage['number']);
  });

  test('TypeConfBase.getString of string', () => {
    expect(conf.getString('string')).toEqual(storage['string']);
    expect(conf.getString('none')).toBeUndefined();
  });

  test('TypeConfBase.getString of number', () => {
    expect(conf.getString('number')).toEqual(stringify(storage['number']));
  });

  test('TypeConfBase.getString with fallback', () => {
    expect(conf.getString('none', 'fallback')).toEqual('fallback');
  });

  test('TypeConfBase.getString should throw', () => {
    expect(() => conf.getString('none', 42 as any)).toThrowError(TypeError);
  });

  test('TypeConfBase.getNumber of number', () => {
    expect(conf.getNumber('number')).toEqual(storage['number']);
    expect(conf.getNumber('none')).toBeUndefined();
  });

  test('TypeConfBase.getNumber of string', () => {
    expect(conf.getNumber('stringifiedNumber')).toEqual(parseInt(storage['stringifiedNumber'], 10));
  });

  test('TypeConfBase.getNumber with fallback', () => {
    expect(conf.getNumber('none', 44)).toEqual(44);
  });

  test('TypeConfBase.getNumber with fallback should throw', () => {
    expect(() => conf.getNumber('none', null as any)).toThrowError(TypeError);
  });

  test('TypeConfBase.getNumber of string should throw', () => {
    expect(() => conf.getNumber('string')).toThrowError(TypeError);
  });

  test('TypeConfBase.getNumber of object should throw', () => {
    expect(() => conf.getNumber('object')).toThrowError(TypeError);
  });

  test('TypeConfBase.getBoolean', () => {
    expect(conf.getBoolean('bool')).toEqual(storage['bool']);
    expect(conf.getBoolean('none')).toEqual(false);
  });

  test('TypeConfBase.getBoolean from string', () => {
    expect(conf.getBoolean('stringifiedBool')).toEqual(storage['stringifiedBool'] !== 'false');
    expect(conf.getBoolean('string')).toEqual(storage['string'] !== 'false');
  });

  test('TypeConfBase.getBoolean from object', () => {
    expect(conf.getBoolean('object')).toEqual(true);
  });

  test('TypeConfBase.getObject from object', () => {
    expect(conf.getObject('object')).toEqual(storage['object']);
    expect(conf.getObject('none')).toBeUndefined();
  });

  test('TypeConfBase.getObject from string', () => {
    expect(conf.getObject('stringifiedObject')).toEqual(JSON.parse(storage['stringifiedObject']));
  });

  test('TypeConfBase.getObject with fallback', () => {
    expect(conf.getObject('none', { fallback: 42 })).toEqual({ fallback: 42 });
  });

  test('TypeConfBase.getObject should merge objects', () => {
    expect(
      conf
        .withStore({ object: { test: null, other: null, another: null } })
        .withStore({ object: { test: 'test 42' } })
        .withStore({ object: { other: 'other' } }) // highest precedence
        .getObject('object')
    ).toEqual({
      test: 'test 42',
      other: 'other',
      another: null
    });
  });

  test('TypeConfBase.getObject with fallback should throw', () => {
    expect(() => conf.getObject('none', 0 as any)).toThrowError(TypeError);
  });

  test('TypeConfBase.getObject from string should throw', () => {
    expect(() => conf.getObject('string')).toThrowError(TypeError);
  });

  const StringNewable = class {
    public readonly value: string;
    constructor(value: string) {
      if (typeof value !== 'string') throw new Error();
      this.value = value;
    }
  };

  test('TypeConfBase.getType from string', () => {
    expect(conf.getType('string', StringNewable)).toEqual(new StringNewable(storage['string']));
    expect(conf.getType('none', StringNewable)).toBeUndefined();
  });

  test('TypeConfBase.getType from string with fallback', () => {
    expect(conf.getType('none', StringNewable, new StringNewable('fallback'))).toEqual(
      new StringNewable('fallback')
    );
  });

  test('TypeConfBase.getType from string should throw', () => {
    expect(() => conf.getType('bool', StringNewable)).toThrowError(TypeError);
  });

  test('TypeConfBase.toJSON withStore', () => {
    conf = new TypeConfBaseImpl()
      .withStore({ w: 'w', x: 'x' })
      .withStore({ y: 'y', z: { a: 1 } })
      .withStore({ x: null });
    expect(conf.toJSON()).toEqual({ w: 'w', x: null, y: 'y', z: { a: 1 } });
  });

  test('TypeConfBase.toJSON withSupplier', () => {
    conf = new TypeConfBaseImpl().withSupplier((name: string) => ({ a: 'a', b: 'b' }[name]));
    // Suppliers cannot be aggregated.
    expect(conf.toJSON()).toEqual({});
  });
});
