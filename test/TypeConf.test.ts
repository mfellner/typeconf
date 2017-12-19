import path = require('path');
import TypeConf from '../src/TypeConf';

describe('TypeConf', () => {
  let conf: TypeConf;

  beforeEach(() => (conf = new TypeConf()));

  test('withArgv is a stub', () => {
    expect(conf.withArgv()).toBe(conf);
  });

  test('withEnv is a stub', () => {
    expect(conf.withEnv()).toBe(conf);
  });

  test('withFile is a stub', () => {
    expect(conf.withFile('test')).toBe(conf);
  });
});
