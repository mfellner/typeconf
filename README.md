# TypeConf

[![Travis](https://img.shields.io/travis/mfellner/typeconf.svg)](travis-ci.org/mfellner/typeconf) [![Codecov](https://img.shields.io/codecov/c/github/mfellner/typeconf.svg)](https://codecov.io/gh/mfellner/janus) [![npm](https://img.shields.io/npm/v/typeconf.svg)](https://www.npmjs.com/package/typeconf) [![license](https://img.shields.io/github/license/mfellner/typeconf.svg)](https://choosealicense.com/licenses/mit)

A typesafe hierarchical configuration manager for Node.js.

## Usage

With TypeConf it's easy to retrieve typed configuration values from different sources:

```typescript
import TypeConf = require('typeconf');

const conf = new TypeConf()
  .withEnv()
  .withFile('./conf.json');

const port = conf.getNumber('port');
const secret = conf.getString('secret');
```

## Hierarchical configuration

TypeConf supports different storage backends for configuration values:

* **withArgv()** Command line arguments
* **withEnv(prefix?: string)** Environment variables
* **withFile(file: string)** JSON or YAML files
* **withStore(store: object, name?: string)** JavaScript object
* **withSupplier(supplier: (key: string) => any, name?: string)** Supplier function
* **set(key: string, value: any)** Override a value
