import camelCase = require('camel-case');
import constantCase = require('constant-case');
import fs = require('fs');
import merge = require('lodash.merge');
import path = require('path');
import TypeConf from './TypeConf';
import TypeConfBase from './TypeConfBase';
import { createStore } from './util';

function readFile(file: string, parser: (s: string) => any): object {
  try {
    const result = parser(fs.readFileSync(file, 'utf8'));
    if (typeof result === 'object' && result !== null) return result;
    console.error(`Invalid configuration file: ${file}`);
  } catch (e) {
    console.error(`Unable to read ${file}`);
  }
  return {};
}

function readConfigFile(filePath: string): object {
  const extname = path.extname(filePath);

  switch (extname) {
    case '.yml':
    case '.yaml':
      return readFile(filePath, require('js-yaml').safeLoad);
    case '.json':
      return readFile(filePath, JSON.parse);
    default:
      console.error(`Unsupported file: ${filePath}\n`);
      return {};
  }
}

export default class TypeConfNode extends TypeConfBase {
  public withArgv(): TypeConf {
    const argv = require('minimist')(process.argv.slice(2));
    const store = createStore(argv, camelCase);

    this.addStore(store, '__argv__');
    return this;
  }

  public withEnv(prefix: string = '', separator: string = '__'): TypeConf {
    const prefixValue = constantCase(prefix);

    const getEnvName = (name: string) => {
      const keyValue = constantCase(name);
      return prefixValue ? `${prefixValue}_${keyValue}` : keyValue;
    };

    const getPartialKeys = (envName: string) => {
      return Object.keys(process.env).filter(
        key => key.startsWith(envName) && key.includes(separator)
      );
    };

    const assignNestedProperty = (
      object: { [key: string]: any },
      nestedKeys: string[],
      value: any
    ) => {
      if (nestedKeys.length === 1) {
        const [key] = nestedKeys;
        object[key] = value;
      } else {
        const [key, ...rest] = nestedKeys;
        object[key] = merge({}, object[key]);
        assignNestedProperty(object[key], rest, value);
      }
    };

    const getNestedKeys = (key: string) =>
      key
        .split(separator)
        .slice(1)
        .map(s => camelCase(s));

    const getPartial = (envName: string) => {
      const keys = getPartialKeys(envName);
      if (keys.length === 0) {
        return;
      }
      const partial = {};
      for (const key of keys) {
        assignNestedProperty(partial, getNestedKeys(key), process.env[key]);
      }
      return partial;
    };

    const store = createStore(name => {
      const envName = getEnvName(name);
      const result = process.env[envName];
      if (result !== undefined) return result;
      return getPartial(envName);
    });

    const storeName = prefixValue ? `ENV_${prefixValue}` : 'ENV';
    this.addStore(store, storeName);
    return this;
  }

  public withFile(file: string): TypeConfNode {
    if (!file) {
      return this;
    }
    const filePath = path.resolve(process.cwd(), file);
    const storage = readConfigFile(filePath);
    const store = createStore(storage);
    super.addStore(store, filePath);
    return this;
  }
}
