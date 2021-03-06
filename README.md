![typeconf](https://user-images.githubusercontent.com/1183636/26884982-7e63efd0-4ba1-11e7-845d-4ade4627039c.png) &nbsp;
[![Travis](https://img.shields.io/travis/mfellner/typeconf.svg)](travis-ci.org/mfellner/typeconf)
[![Codecov](https://img.shields.io/codecov/c/github/mfellner/typeconf.svg)](https://codecov.io/gh/mfellner/janus)
[![David](https://img.shields.io/david/mfellner/typeconf.svg)](https://david-dm.org/mfellner/typeconf)
[![codebeat badge](https://codebeat.co/badges/6df3709c-deed-4a8f-af7d-2e1ccda63591)](https://codebeat.co/projects/github-com-mfellner-typeconf-master)
[![npm](https://img.shields.io/npm/v/typeconf.svg)](https://www.npmjs.com/package/typeconf)
[![license](https://img.shields.io/github/license/mfellner/typeconf.svg)](https://choosealicense.com/licenses/mit)

**TypeConf** is a universal, typesafe, hierarchical configuration manager for Node.js and the browser.

## Usage

With TypeConf it's easy to retrieve typed configuration values from different sources:

```js
import TypeConf = require('typeconf');

const conf = new TypeConf()
  .withFile('./conf.json');
  .withEnv();

const port: number = conf.getNumber('port');
const secret: string = conf.getString('secret');
```

## Hierarchical configuration

TypeConf supports different storage backends for configuration values:

#### All versions:

* **withStore(store: object, name?: string)** JavaScript object
* **withSupplier(supplier: (key: string) => any, name?: string)** Supplier function
* **set(key: string, value: any)** Set or override a value

#### Node.js only:

* **withArgv()** Command line arguments (requires `minimist`)
* **withEnv(prefix?: string)** Environment variables
* **withFile(file: string)** JSON or YAML files (.yaml files require `js-yaml`)

#### Browser only:

* **withDOMNode(id: string, attribute?: string)** DOM element with encoded `content` attribute

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

TypeConf can merge and extract nested object properties from environment varibles:

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

By default, TypeConf uses two "underscore" characters (`__`) as a separator. We can even define completely new objects using this method:

```sh
export ANOTHER__A="property a"
export ANOTHER__B__C="property b.c"
```

```js
const another = conf.getObject('another');
another === { a: 'property a', b: { c: 'property b.c' } };
```

## API documentation

### withStore(store: object, name?: string): TypeConf

Use a JavaScript object as a source. Optionally provide a unique **name** for the store.

### withSupplier(supplier: (key: string) => any, name?: string): TypeConf

Use a supplier function as a source. Optionally provide a unique **name** for the store.

### withArgv(parser?: (args: string[]) => { [key: string]: any }): TypeConf

**Node.js only.** Use command line arguments as a source. Optionally provide a custom argument parser (uses [minimist](https://www.npmjs.com/package/minimist) by default).

### withEnv(prefix?: string, separator?: string): TypeConf

**Node.js only.** Use environment variables as a source. If a **prefix** is configured, it will be prepended to configuration value names during lookup. The default **separator** for nested object values is `__`. For example:

```sh
export PREFIX_OBJECT__A="a"
export PREFIX_OBJECT__B__BB="bb"
```

```js
conf.getObject('object') === { a: 'a', b: { bb: 'bb' } };
```

### withFile(file: string): TypeConf

**Node.js only.** Use a configuration file as a source. JSON and YAML (requires [js-yaml](https://www.npmjs.com/package/js-yaml)) are supported.

### withDOMNode(id: string, attribute?: string): TypeConf

**Browser only.** Use a DOM element as a source. The configuration must be a Base64-encoded JSON string in an attribute of the element (default: `content`). For example:

```html
<meta id="conf" content="eyJhIjoiYiJ9" />
```

### set(key: string, value: any): TypeConf

Set an override value.

### unset(key: string): TypeConf

Delete an override value.

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

### toJSON(): object

Aggregate all values from all supported stores as a plain JavaScript object. There are several limitations:

* Supplier-function stores cannot be aggregated.
* Environment-variable stores without a defined prefix cannot be aggregated.
* All command-line arguments are included if the default parser is used.

### toBase64(): string

Aggregate all values from all supported stores and encode them as a Base64 JSON string. The same limitations as for `toJSON()` apply.
