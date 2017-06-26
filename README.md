![typeconf](https://user-images.githubusercontent.com/1183636/26884982-7e63efd0-4ba1-11e7-845d-4ade4627039c.png) &nbsp; [![Travis](https://img.shields.io/travis/mfellner/typeconf.svg)](travis-ci.org/mfellner/typeconf) [![Codecov](https://img.shields.io/codecov/c/github/mfellner/typeconf.svg)](https://codecov.io/gh/mfellner/janus) [![codebeat badge](https://codebeat.co/badges/6df3709c-deed-4a8f-af7d-2e1ccda63591)](https://codebeat.co/projects/github-com-mfellner-typeconf-master) [![npm](https://img.shields.io/npm/v/typeconf.svg)](https://www.npmjs.com/package/typeconf) [![license](https://img.shields.io/github/license/mfellner/typeconf.svg)](https://choosealicense.com/licenses/mit)

**TypeConf** is a typesafe hierarchical configuration manager for Node.js.

## Usage

With TypeConf it's easy to retrieve typed configuration values from different sources:

```js
import TypeConf = require('typeconf');

const conf = new TypeConf()
  .withFile('./conf.json');
  .withEnv();

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

Backends are queried for existing values in the reverse order that they were added. For example:

```js
const conf = new TypeConf()
  .withFile('./conf.json');
  .withEnv()
  .withArgv();

const example = conf.get('example');
```

In this case TypeConf will check for existing values in the following order:

1. A command line argument `--example`
2. An evironment variable `EXAMPLE`
3. An configuration file entry `"example": ...`

## Nested object properties

TypeConf can extract nested object properties from environment varibles:

```js
const conf = new TypeConf()
  .withStore({
    example: {
      test: 'test'
    }
  })
  .withEnv();
```

This example configuration uses a static object store and environment variables. In order to add or override properties on the `example` object we can do the following:

```sh
export EXAMPLE__TEST="override"
export EXAMPLE__OTHER="another property"
```

By default, TypeConf uses two "underline" characters (`__`) as a separator. We can even define completely new objects using this method:

```sh
export ANOTHER__A="property A"
export ANOTHER__B__C="property b.c"
```

```js
const another = conf.getObject('another');
another === {
  a: 'property A',
  b: { c: 'property b.c' }
}
```

## API documentation

### get(name: string): any

Get a raw value.

### get&lt;T&gt;(name: string, transform: (x: any) => T): T

Get a value that is transformed by the supplied function.

### getString(name: string, fallback?: string): string | undefined

Get an existing value as a string (using `JSON.stringify` if necessary) or return an optional fallback string. **Throws TypeError** if `fallback` is defined but not a string.

### getNumber(name: string, fallback?: number): number | undefined

Get an existing value as a number (using `parseFloat` if necessary) or return an optional fallback number. **Throws TypeError** if an existing value cannot be interpreted as a number or if `fallback` is defined but not a number.

### getBoolean(name: string): boolean

Get a value as a boolean. An existing value is always interpreted as `true` unless it is `false` or `"false"`. A non-existing value is always interpreted as `false`.

### getObject(name: string, fallback?: object): object | undefined

Get an existing value as an object (using `JSON.parse` if necessary) or return an optional fallback object. **Throws TypeError** if an existing value cannot be interpreted as an object or if `fallback` is defined but not an object.

### getType&lt;T&gt;(name: string, Newable: Newable&lt;T&gt;, fallback?: T): T | undefined

Get an existing value as an instance of type `T` (by passing the raw value as the only argument to the constructor) or return an optional fallback value of the same type. **Throws TypeError** if an error occurs during the instantiation of type `T` (constructors should validate the raw configuration value).
