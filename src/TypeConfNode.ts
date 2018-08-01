import camelCase = require('camel-case');
import constantCase = require('constant-case');
import fs = require('fs');
import * as Minimist from 'minimist';
import path = require('path');
import TypeConf from './TypeConf';
import TypeConfBase from './TypeConfBase';
import { aggregateContainerValues, createStore, ObjectSupplier } from './util';

function readFile(file: string, parser: (s: string) => unknown): object {
  try {
    const result = parser(fs.readFileSync(file, 'utf8'));
    if (result instanceof Object) return result;
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

function defaultArgvParser(args: string[]): { [key: string]: unknown } {
  const minimist = require('minimist') as typeof Minimist;
  const { _, ...rest } = minimist(args);
  return rest;
}

export default class TypeConfNode extends TypeConfBase {
  public withArgv(parser = defaultArgvParser): TypeConf {
    const argv = parser(process.argv.slice(2));
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

    const store = createStore({
      get(name: string) {
        const envName = getEnvName(name);
        const result = process.env[envName];
        if (typeof result !== 'undefined') return result;
        const aggregate = aggregateContainerValues(process.env, envName, separator, camelCase);
        if (Object.keys(aggregate).length > 0) {
          return aggregate;
        }
      },
      aggregate() {
        // We can only find relevant environment variables if a prefix is specified.
        if (!prefixValue) {
          return {};
        }
        return aggregateContainerValues(process.env, prefixValue, separator, camelCase);
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

  public toBase64(): string {
    return new Buffer(JSON.stringify(this.toJSON())).toString('base64');
  }
}
