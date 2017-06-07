![typeconf](https://user-images.githubusercontent.com/1183636/26884982-7e63efd0-4ba1-11e7-845d-4ade4627039c.png) &nbsp; [![Travis](https://img.shields.io/travis/mfellner/typeconf.svg)](travis-ci.org/mfellner/typeconf) [![Codecov](https://img.shields.io/codecov/c/github/mfellner/typeconf.svg)](https://codecov.io/gh/mfellner/janus) [![codebeat badge](https://codebeat.co/badges/6df3709c-deed-4a8f-af7d-2e1ccda63591)](https://codebeat.co/projects/github-com-mfellner-typeconf-master) [![npm](https://img.shields.io/npm/v/typeconf.svg)](https://www.npmjs.com/package/typeconf) [![license](https://img.shields.io/github/license/mfellner/typeconf.svg)](https://choosealicense.com/licenses/mit)

**TypeConf** is a typesafe hierarchical configuration manager for Node.js.

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
