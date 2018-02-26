import camelCase = require('camel-case');
import constantCase = require('constant-case');
import fs = require('fs');
import merge = require('lodash.merge');
import path = require('path');
import TypeConf from './TypeConf';
import TypeConfBase from './TypeConfBase';
import { createStore, ObjectSupplier } from './util';

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
    const store = createStore(new ObjectSupplier(argv), camelCase);

    this.addStore(store, '__argv__');
    return this;
  }

  public withEnv(prefix: string = '', separator: string = '__'): TypeConf {
    const prefixValue = constantCase(prefix);

    // Transform a configuration value name into an environment variable name.
    const getEnvName = (name: string) => {
      const keyValue = constantCase(name);
      return prefixValue ? `${prefixValue}_${keyValue}` : keyValue;
    };

    // Transform an environment variable name into a configuration value name.
    const getConfName = (name: string) => {
      const camelName = camelCase(name);
      if (prefix) {
        return camelCase(camelName.replace(camelCase(prefix), ''));
      } else {
        return camelName;
      }
    };

    // Collect all environment variable names that belong to the same object.
    const getPartialKeys = (envName: string) => {
      return Object.keys(process.env).filter(
        key => key.startsWith(envName) && key.includes(separator)
      );
    };

    // Recursively construct an object from nested properties.
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

    const store = createStore({
      get(name: string) {
        const envName = getEnvName(name);
        const result = process.env[envName];
        if (result !== undefined) return result;
        return getPartial(envName);
      },
      aggregate() {
        // We can only find relevant environment variables if a prefix is specified.
        if (!prefixValue) {
          return {};
        }
        // Collect relevant environment variable names that start with the specified prefix.
        const keys = Object.keys(process.env).filter(key => key.startsWith(prefixValue));
        // Aggregate environment variables into an object.
        return keys.reduce(
          // FIXME: construct partial objects
          (aggregated, key) => ({ ...aggregated, [getConfName(key)]: process.env[key] }),
          {}
        );
      }
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
    const store = createStore(new ObjectSupplier(storage));
    super.addStore(store, filePath);
    return this;
  }
}
