import camelCase = require('camel-case');
import constantCase = require('constant-case');
import fs = require('fs');
import merge = require('lodash.merge');
import path = require('path');
import TypeConf from './TypeConf';
import { createStore, Store } from './util';

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

export default class TypeConfNode extends TypeConf {
  /**
   * Use command line arguments as a source.
   *
   * When looking up argument names, all names will be transformed
   * into camelCase. This means that arguments names must be
   * declared in camelCase.
   * @return This TypeConf instance.
   */
  public withArgv(): TypeConf {
    const argv = require('minimist')(process.argv.slice(2));
    const store = createStore(argv, camelCase);

    this.addStore(store, '__argv__');
    return this;
  }

  /**
   * Use environment variables as a source. If a prefix is configured,
   * it will be prepended to configuration value names during lookup.
   *
   * When looking up environment variables, all names will be transformed
   * into CONSTANT_CASE. This means that environment variables must be
   * declared in CONSTANT_CASE.
   * @param prefix Prefix of environment variables.
   * @param separator Separator string for nested properties.
   * @return This TypeConf instance.
   */
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
      const partial = {};
      for (const key of getPartialKeys(envName)) {
        assignNestedProperty(partial, getNestedKeys(key), process.env[key]);
      }
      return partial;
    };

    const store: Store = {
      get: (name, next) => {
        const envName = getEnvName(name);
        const result = process.env[envName];
        if (result !== undefined) return result;

        const partial = getPartial(envName);
        if (Object.keys(partial).length > 0) return merge({}, next(name), partial);
        else return next(name);
      },
      has: (name, next) => {
        const envName = getEnvName(name);
        const result = envName in process.env || getPartialKeys(envName).length > 0;
        return result || next(name, true);
      }
    };

    const storeName = prefixValue ? `ENV_${prefixValue}` : 'ENV';
    this.addStore(store, storeName);
    return this;
  }

  /**
   * Use a configuration file as a source. JSON and YAML are supported.
   * @param file The absolute or relative file path.
   * @return This TypeConf instance.
   */
  public withFile(file: string): TypeConf {
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