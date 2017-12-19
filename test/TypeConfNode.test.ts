import path = require('path');
import TypeConfNode from '../src/TypeConfNode';

describe('TypeConfNode', () => {
  let conf: TypeConfNode;

  beforeEach(() => (conf = new TypeConfNode()));

  test('load a JSON file', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.get('example')).toBe('value');
  });

  test('load a YAML file', () => {
    conf.withFile(path.resolve(__dirname, 'conf.yaml'));
    expect(conf.get('example')).toBe('value');
  });

  test('load a YML file', () => {
    conf.withFile(path.resolve(__dirname, 'conf.yml'));
    expect(conf.get('ymlSupported')).toBe(true);
  });

  test('reject an empty YAML file gracefully', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    const empty = path.resolve(__dirname, 'empty.yaml');
    expect(conf.withFile(empty) instanceof TypeConfNode).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('reject empty file paths gracefully', () => {
    expect(conf.withFile('') instanceof TypeConfNode).toBe(true);
  });

  test('reject unsupported files gracefully', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(conf.withFile(__filename) instanceof TypeConfNode).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('reject unreadable files gracefully', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(conf.withFile('unreadable.json') instanceof TypeConfNode).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('use a fallback string value', () => {
    expect(conf.getString('example', 'fallback')).toBe('fallback');
  });

  test('return undefined without a fallback string', () => {
    expect(conf.getString('example')).toBeUndefined();
  });

  test('use a fallback number value', () => {
    expect(conf.getNumber('number', 1)).toBe(1);
  });

  test('return undefined without a fallback number', () => {
    expect(conf.getNumber('number')).toBeUndefined();
  });

  test('override a string value', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    conf.set('example', 'other');
    expect(conf.get('example')).toBe('other');
  });

  test('unset an override value', () => {
    conf.set('example', 'value');
    expect(conf.get('example')).toBe('value');
    conf.unset('example');
    expect(conf.get('example')).toBeUndefined();
  });

  test('get an object', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getObject('object')).toEqual({
      whatIsCode: 42,
      tautology: true
    });
  });

  test('get an object from a string', () => {
    conf.withEnv();
    process.env['TEST_OBJECT'] = `{ "foo": "bar" }`;
    expect(conf.getObject('testObject')).toEqual({
      foo: 'bar'
    });
  });

  test('get a fallback object', () => {
    expect(conf.getObject('test', { bar: 'foo' })).toEqual({
      bar: 'foo'
    });
  });

  test('return undefined without a fallback object', () => {
    expect(conf.getObject('test')).toBeUndefined();
  });

  test('get an array', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getObject('array')).toEqual(['one', 'two']);
  });

  test('get a string', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.get('example')).toBe('value');
    expect(conf.getString('example')).toBe('value');
  });

  test('get number as string', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getString('number')).toBe('42');
  });

  test('get a number', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.get('number')).toBe(42);
    expect(conf.getNumber('number')).toBe(42);
  });

  test('get a boolean', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.get('boolean')).toBe(true);
    expect(conf.getBoolean('boolean')).toBe(true);
  });

  test('get string as boolean', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getBoolean('example')).toBe(true);
  });

  test('get an unset value as boolean', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getBoolean('nothing')).toBe(false);
  });

  test('override a boolean with a string value', () => {
    conf.set('example', 'truthy');
    expect(conf.getBoolean('example')).toBe(true);
  });

  class MyType {
    public x: string;
    public y: number;
    constructor(args: { x: string; y: number }) {
      if (!args || !args.x || !args.y) {
        throw new Error('Illegal arguments.');
      }
      this.x = args.x;
      this.y = args.y;
    }
  }

  test('get a converted type', () => {
    conf.set('example', '42');
    expect(conf.get('example', n => parseFloat(n))).toBe(42);
  });

  test('get an instantiable type', () => {
    conf.set('example', { x: 'x', y: 42 });
    const value = conf.getType('example', MyType);
    expect(value).toBeInstanceOf(MyType);
    expect(value.x).toBe('x');
    expect(value.y).toBe(42);
  });

  test('use a fallback instantiable type value', () => {
    const value = conf.getType('example', MyType, new MyType({ x: 'z', y: 41 }));
    expect(value).toBeInstanceOf(MyType);
    expect(value.x).toBe('z');
    expect(value.y).toBe(41);
  });

  test('return undefined if a custom type value is undefined', () => {
    expect(conf.getType('undefined', MyType)).toBeUndefined();
  });

  test('throw a TypeError if a custom type cannot be instantiated', () => {
    conf.set('example', 42);
    expect(() => conf.getType('example', MyType)).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an unparsable number', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(() => conf.getNumber('example')).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an non-number', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(() => conf.getNumber('boolean')).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an illegal fallback number', () => {
    expect(() => conf.getNumber('number', null)).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an illegal fallback string', () => {
    expect(() => conf.getString('example', null)).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an illegal object', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(() => conf.getObject('example')).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an illegal fallback object', () => {
    expect(() => conf.getObject('example', 0 as any)).toThrowErrorMatchingSnapshot();
  });

  test('get values from a store', () => {
    conf.withStore({ someDefault: 'default' });
    expect(conf.get('someDefault')).toEqual('default');
  });

  test('reset a named store', () => {
    conf.withStore({ example: 'value' }, 'test');
    conf.withStore({ example: 'other' }, 'test');
    expect(conf.get('example')).toEqual('other');
  });

  test('respect store order', () => {
    conf.withStore({ example: 'secondValue' }, 'third');
    conf.withStore({ example: 'firstValue' });
    conf.withStore({ other: 'someValue' }, 'first');
    expect(conf.get('example')).toEqual('firstValue');
  });

  test('get values from a supplier', () => {
    conf.withSupplier(key => ({ example: 42 }[key]));
    expect(conf.get('example')).toBe(42);
  });

  test('get values from command line arguments', () => {
    process.argv.push('--someValue', '42');
    process.argv.push('--otherValue=43');
    conf.withArgv();
    expect(conf.getNumber('some-value')).toBe(42);
    expect(conf.getNumber('other_value')).toBe(43);
  });

  test('get environment variable as string', () => {
    process.env['EXAMPLE'] = 'value';
    conf.withEnv();
    expect(conf.get('EXAMPLE')).toEqual('value');
  });

  test('get environment variable as number', () => {
    process.env['NUMBER'] = '42';
    conf.withEnv();
    expect(conf.getNumber('NUMBER')).toEqual(42);
  });

  test('transform environment variable names to CONSTANT_CASE', () => {
    process.env['SOME_EXAMPLE'] = 'value';
    conf.withEnv();
    expect(conf.get('someExample')).toEqual('value');
  });

  test('use environment variable prefixes', () => {
    process.env['TEST_EXAMPLE'] = 'value';
    conf.withEnv('test');
    expect(conf.get('example')).toEqual('value');
  });

  test('nested properties with environment variables', () => {
    delete process.env['EXAMPLE'];
    process.env['EXAMPLE__A'] = 'a';
    process.env['EXAMPLE__C__C1'] = 'c1';
    process.env['EXAMPLE__D__D0'] = 'd0';
    process.env['EXAMPLE__E'] = 'e';
    conf.withStore({
      example: {
        a: 1,
        b: 2,
        c: { c0: 'c0' }
      }
    });
    conf.withEnv();
    expect(conf.get('example')).toEqual({
      a: 'a',
      b: 2,
      c: {
        c0: 'c0',
        c1: 'c1'
      },
      d: { d0: 'd0' },
      e: 'e'
    });
  });

  test('environment variable with only nested properties exists', () => {
    process.env['PARTIAL_EXAMPLE__A'] = 'a';
    conf.withEnv('partial');
    expect(conf.getBoolean('example')).toBe(true);
    expect(conf.get('example')).toEqual({ a: 'a' });
  });

  test('nested properties in evironment variables are camelCased', () => {
    process.env['CAMEL_EXAMPLE__THIS_IS_A_CAMEL'] = 'camel';
    conf.withEnv('camel');
    expect(conf.get('example')).toEqual({ thisIsACamel: 'camel' });
  });

  test('other values behind env storage are unaffected', () => {
    process.env['COMBINATION_SOME'] = 'some';
    conf
      .withStore({
        other: 'other'
      })
      .withEnv('COMBINATION');

    expect(conf.getString('some')).toBe('some');
    expect(conf.getString('other')).toBe('other');
  });
});
