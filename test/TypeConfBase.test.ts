import TypeConf from '../src/TypeConf';
import TypeConfBase from '../src/TypeConfBase';
import TypeError from '../src/TypeError';

class TypeConfBaseImpl extends TypeConfBase {}

type TestArgs = { name: string; conf: TypeConf; storage: { [key: string]: any } };

const { stringify } = JSON;

describe('TypeConfBase', () => {
  test('withArgv should throw', () => {
    expect(() => new TypeConfBaseImpl().withArgv()).toThrowError(/not implemented/);
  });

  test('withEnv should throw', () => {
    expect(() => new TypeConfBaseImpl().withEnv()).toThrowError(/not implemented/);
  });

  test('withFile should throw', () => {
    expect(() => new TypeConfBaseImpl().withFile('')).toThrowError(/not implemented/);
  });

  test('withDOMNode should throw', () => {
    expect(() => new TypeConfBaseImpl().withDOMNode('')).toThrowError(/not implemented/);
  });

  function getTestArgs(): TestArgs[] {
    const storage = Object.freeze({
      string: 'test',
      number: 42,
      stringifiedNumber: '43',
      bool: true,
      stringifiedBool: 'false',
      object: { test: 'test' },
      stringifiedObject: JSON.stringify({ test: 'test' })
    });

    return [
      {
        name: 'withStore',
        conf: new TypeConfBaseImpl().withStore(storage),
        storage
      },
      {
        name: 'withSupplier',
        conf: new TypeConfBaseImpl().withSupplier(name => storage[name]),
        storage
      },
      {
        name: 'with multiple stores',
        conf: new TypeConfBaseImpl()
          .withStore({ string: storage.string, number: storage.number })
          .withSupplier(
            name =>
              ({
                stringifiedNumber: storage.stringifiedNumber,
                bool: storage.bool,
                stringifiedBool: storage.stringifiedBool,
                object: storage.object,
                stringifiedObject: storage.stringifiedObject
              }[name])
          )
          .set('string', 'override'),
        storage: { ...storage, string: 'override' }
      }
    ];
  }

  for (const { name, conf, storage } of getTestArgs()) {
    test(`TypeConfBase.get (${name})`, () => {
      expect(conf.get('string')).toEqual(storage['string']);
      expect(conf.get('number')).toEqual(storage['number']);
      expect(conf.get('bool')).toEqual(storage['bool']);
      expect(conf.get('object')).toEqual(storage['object']);
      expect(conf.get('none')).toBeUndefined();
    });

    test(`TypeConfBase.get with resolver (${name})`, () => {
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

    test(`TypeConfBase.set (${name})`, () => {
      expect(conf.set('number', 'override').get('number')).toEqual('override');
    });

    test(`TypeConfBase.unset (${name})`, () => {
      expect(
        conf
          .set('number', 'override')
          .unset('number')
          .get('string')
      ).toEqual(storage['string']);
    });

    test(`TypeConfBase.getString of string (${name})`, () => {
      expect(conf.getString('string')).toEqual(storage['string']);
      expect(conf.getString('none')).toBeUndefined();
    });

    test(`TypeConfBase.getString of number (${name})`, () => {
      expect(conf.getString('number')).toEqual(stringify(storage['number']));
    });

    test(`TypeConfBase.getString with fallback (${name})`, () => {
      expect(conf.getString('none', 'fallback')).toEqual('fallback');
    });

    test(`TypeConfBase.getString should throw (${name})`, () => {
      expect(() => conf.getString('none', 42 as any)).toThrowError(TypeError);
    });

    test(`TypeConfBase.getNumber of number (${name})`, () => {
      expect(conf.getNumber('number')).toEqual(storage['number']);
      expect(conf.getNumber('none')).toBeUndefined();
    });

    test(`TypeConfBase.getNumber of string (${name})`, () => {
      expect(conf.getNumber('stringifiedNumber')).toEqual(
        parseInt(storage['stringifiedNumber'], 10)
      );
    });

    test(`TypeConfBase.getNumber with fallback (${name})`, () => {
      expect(conf.getNumber('none', 44)).toEqual(44);
    });

    test(`TypeConfBase.getNumber with fallback should throw (${name})`, () => {
      expect(() => conf.getNumber('none', null as any)).toThrowError(TypeError);
    });

    test(`TypeConfBase.getNumber of string should throw (${name})`, () => {
      expect(() => conf.getNumber('string')).toThrowError(TypeError);
    });

    test(`TypeConfBase.getNumber of object should throw (${name})`, () => {
      expect(() => conf.getNumber('object')).toThrowError(TypeError);
    });

    test(`TypeConfBase.getBoolean (${name})`, () => {
      expect(conf.getBoolean('bool')).toEqual(storage['bool']);
      expect(conf.getBoolean('none')).toEqual(false);
    });

    test(`TypeConfBase.getBoolean from string (${name})`, () => {
      expect(conf.getBoolean('stringifiedBool')).toEqual(storage['stringifiedBool'] !== 'false');
      expect(conf.getBoolean('string')).toEqual(storage['string'] !== 'false');
    });

    test(`TypeConfBase.getBoolean from object (${name})`, () => {
      expect(conf.getBoolean('object')).toEqual(true);
    });

    test(`TypeConfBase.getObject from object (${name})`, () => {
      expect(conf.getObject('object')).toEqual(storage['object']);
      expect(conf.getObject('none')).toBeUndefined();
    });

    test(`TypeConfBase.getObject from string (${name})`, () => {
      expect(conf.getObject('stringifiedObject')).toEqual(JSON.parse(storage['stringifiedObject']));
    });

    test(`TypeConfBase.getObject with fallback (${name})`, () => {
      expect(conf.getObject('none', { fallback: 42 })).toEqual({ fallback: 42 });
    });

    test(`TypeConfBase.getObject should merge objects (${name})`, () => {
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

    test(`TypeConfBase.getObject with fallback should throw (${name})`, () => {
      expect(() => conf.getObject('none', 0 as any)).toThrowError(TypeError);
    });

    test(`TypeConfBase.getObject from string should throw (${name})`, () => {
      expect(() => conf.getObject('string')).toThrowError(TypeError);
    });

    const StringNewable = class {
      public readonly value: string;
      constructor(value: string) {
        if (typeof value !== 'string') throw new Error();
        this.value = value;
      }
    };

    test(`TypeConfBase.getType from string (${name})`, () => {
      expect(conf.getType('string', StringNewable)).toEqual(new StringNewable(storage['string']));
      expect(conf.getType('none', StringNewable)).toBeUndefined();
    });

    test(`TypeConfBase.getType from string with fallback (${name})`, () => {
      expect(conf.getType('none', StringNewable, new StringNewable('fallback'))).toEqual(
        new StringNewable('fallback')
      );
    });

    test(`TypeConfBase.getType from string should trhow (${name})`, () => {
      expect(() => conf.getType('bool', StringNewable)).toThrowError(TypeError);
    });
  }
});
