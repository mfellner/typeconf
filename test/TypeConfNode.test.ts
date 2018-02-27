import * as path from 'path';
import TypeConfNode from '../src/TypeConfNode';

describe('TypeConfNode', () => {
  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('TYPE_CONF')) {
        delete process.env[key];
      }
    }
  });

  test('conf.getNumber withArgv', () => {
    process.argv.push('--number', '42');
    const conf = new TypeConfNode().withArgv();
    expect(conf.getNumber('number')).toEqual(42);
  });

  test('conf.getString withArgv', () => {
    process.argv.push('--string=test');
    const conf = new TypeConfNode().withArgv();
    expect(conf.getString('string')).toEqual('test');
  });

  test('withArgv should transform keys to camelCase', () => {
    process.argv.push('--camelCaseString=test');
    const conf = new TypeConfNode().withArgv();
    expect(conf.getString('CAMEL_CASE_STRING')).toEqual('test');
  });

  test('conf.getNumber withEnv', () => {
    const conf = new TypeConfNode().withEnv();
    process.env['TYPE_CONF_TEST_NUMBER'] = '42';
    expect(conf.getNumber('typeConfTestNumber')).toEqual(42);
  });

  test('conf.getString withEnv', () => {
    const conf = new TypeConfNode().withEnv();
    process.env['TYPE_CONF_TEST_STRING'] = 'test';
    expect(conf.get('TYPE_CONF_TEST_STRING')).toEqual('test');
  });

  test('conf.getNumber withEnv and prefix', () => {
    const conf = new TypeConfNode().withEnv('TYPE_CONF_PREFIX');
    process.env['TYPE_CONF_PREFIX_NUMBER'] = '42';
    expect(conf.getNumber('number')).toEqual(42);
  });

  test('conf.getObject withEnv and nested keys', () => {
    const conf = new TypeConfNode().withEnv();
    process.env['TYPE_CONF_TEST_OBJECT__A'] = 'a';
    process.env['TYPE_CONF_TEST_OBJECT__B'] = '42';
    process.env['TYPE_CONF_TEST_OBJECT__C__AA'] = 'aa';
    process.env['TYPE_CONF_TEST_OBJECT__C__BB'] = 'bb';
    process.env['TYPE_CONF_TEST_OBJECT__D'] = 'd';

    expect(conf.getObject('typeConfTestObject')).toEqual({
      a: 'a',
      b: '42',
      c: { aa: 'aa', bb: 'bb' },
      d: 'd'
    });
  });

  test('conf.getObject withEnv and existing object', () => {
    const conf = new TypeConfNode()
      .withStore({ typeConfTestObject: { y: 'y' }, object: {} })
      .withEnv();
    process.env['TYPE_CONF_TEST_OBJECT__X'] = 'x';

    expect(conf.getObject('typeConfTestObject')).toEqual({
      x: 'x',
      y: 'y'
    });
    expect(conf.getObject('object')).toEqual({});
  });

  test('conf.getBoolean withEnv and nested keys', () => {
    const conf = new TypeConfNode().withStore({ object: {} }).withEnv();
    process.env['TYPE_CONF_TEST_OBJECT__Z'] = 'Z';

    expect(conf.getBoolean('typeConfTestObject')).toEqual(true);
    expect(conf.getBoolean('object')).toEqual(true);
  });

  test('conf.getObject withFile and YAML file', () => {
    const conf = new TypeConfNode().withFile(path.resolve(__dirname, 'conf.yaml'));
    expect(conf.getObject('object')).toEqual({ string: 'string' });
  });

  test('conf.getObject withFile and YML file', () => {
    const conf = new TypeConfNode().withFile(path.resolve(__dirname, 'conf.yml'));
    expect(conf.getObject('object')).toEqual({ string: 'string' });
  });

  test('conf.getObject withFile and JSON file', () => {
    const conf = new TypeConfNode().withFile(path.resolve(__dirname, 'conf.json'));
    expect(conf.getObject('object')).toEqual({ string: 'string' });
  });

  test('conf.getString withFile and YAML file', () => {
    const conf = new TypeConfNode().withFile(path.resolve(__dirname, 'conf.yaml'));
    expect(conf.getString('string')).toEqual('string');
  });

  test('conf.getNumber withFile and YAML file', () => {
    const conf = new TypeConfNode().withFile(path.resolve(__dirname, 'conf.yaml'));
    expect(conf.getNumber('number')).toEqual(42);
  });

  test('with empty YAML file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.yaml'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('with empty JSON file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.json'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('with empty YAML file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.yaml'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('with unsupported file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'conf.txt'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('with empty file name', () => {
    expect(new TypeConfNode().withFile('')).toBeInstanceOf(TypeConfNode);
  });

  test('conf.toJSON withEnv and prefix', () => {
    const conf = new TypeConfNode().withEnv('typeConf');
    process.env['TYPE_CONF_A'] = 'a';
    process.env['TYPE_CONF_B'] = '42';
    process.env['TYPE_CONF_C__AA'] = 'aa';
    process.env['TYPE_CONF_C__BB'] = 'bb';
    process.env['TYPE_CONF_D'] = 'd';

    expect(conf.toJSON()).toEqual({ a: 'a', b: '42', c: { aa: 'aa', bb: 'bb' }, d: 'd' });
  });

  test('conf.toJSON withEnv and without prefix', () => {
    const conf = new TypeConfNode().withEnv();
    process.env['TYPE_CONF_A'] = 'a';
    process.env['TYPE_CONF_B'] = 'b';
    expect(conf.toJSON()).toEqual({});
  });

  test('conf.toBase64', () => {
    const conf = new TypeConfNode().withStore({ a: 'a', b: 42 });
    expect(JSON.parse(new Buffer(conf.toBase64(), 'base64').toString('utf-8'))).toEqual({
      a: 'a',
      b: 42
    });
  });
});
