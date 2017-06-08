/// <reference types="jest" />

import path = require('path');
import TypeConf from '../src';

describe('TypeConf', () => {
  let conf: TypeConf;

  beforeEach(() => (conf = new TypeConf()));

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
    expect(conf.withFile(empty) instanceof TypeConf).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('reject empty file paths gracefully', () => {
    expect(conf.withFile('') instanceof TypeConf).toBe(true);
  });

  test('reject unsupported files gracefully', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(conf.withFile(__filename) instanceof TypeConf).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('reject unreadable files gracefully', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(conf.withFile('unreadable.json') instanceof TypeConf).toBe(true);
    expect(mockError).toBeCalled();
  });

  test('use a fallback string value', () => {
    expect(conf.getString('example', 'fallback')).toBe('fallback');
  });

  test('use a fallback number value', () => {
    expect(conf.getNumber('number', 1)).toBe(1);
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

  test('throw a TypeError for an illegal number', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(() => conf.getNumber('example')).toThrowErrorMatchingSnapshot();
  });

  test('throw a TypeError for an illegal object', () => {
    conf.withFile(path.resolve(__dirname, 'conf.json'));
    expect(() => conf.getObject('example')).toThrowErrorMatchingSnapshot();
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
    conf.withStore({ other: 'someValue' }, 'first');
    conf.withStore({ example: 'firstValue' });
    conf.withStore({ example: 'secondValue' }, 'third');
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
});