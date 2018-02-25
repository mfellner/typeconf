import path = require('path');
import TypeConf from '../src/TypeConf';
import TypeConfNode from '../src/TypeConfNode';
import TypeError from '../src/TypeError';

describe('TypeConfNode', () => {
  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('TYPE_CONF')) {
        delete process.env[key];
      }
    }
  });

  test('withArgv', () => {
    process.argv.push('--number', '42');
    process.argv.push('--string=test');
    const conf = new TypeConfNode().withArgv();

    expect(conf.getNumber('number')).toEqual(42);
    expect(conf.getString('string')).toEqual('test');
  });

  test('withEnv', () => {
    const conf = new TypeConfNode().withEnv();
    process.env['TYPE_CONF_TEST_NUMBER'] = '42';
    process.env['TYPE_CONF_TEST_STRING'] = 'test';

    expect(conf.getNumber('typeConfTestNumber')).toEqual(42);
    expect(conf.get('TYPE_CONF_TEST_STRING')).toEqual('test');
  });

  test('withEnv and prefix', () => {
    const conf = new TypeConfNode().withEnv('TYPE_CONF_PREFIX');
    process.env['TYPE_CONF_PREFIX_NUMBER'] = '42';
    process.env['TYPE_CONF_PREFIX_STRING'] = 'test';

    expect(conf.getNumber('number')).toEqual(42);
    expect(conf.get('string')).toEqual('test');
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

  test('conf with empty YAML file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.yaml'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('conf with empty JSON file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.json'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('conf with empty YAML file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'empty.yaml'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('conf with unsupported file', () => {
    const mockError = jest.fn();
    global.console.error = mockError;
    expect(new TypeConfNode().withFile(path.resolve(__dirname, 'conf.txt'))).toBeInstanceOf(
      TypeConfNode
    );
    expect(mockError).toBeCalled();
  });

  test('conf with empty file name', () => {
    expect(new TypeConfNode().withFile('')).toBeInstanceOf(TypeConfNode);
  });
});
