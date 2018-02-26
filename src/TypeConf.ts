import Newable from './Newable';

/**
 * A hierarchical configuration manager that supports multiple sources.
 */
export interface TypeConf {
  /**
   * Use an object as a source.
   * @param storage Object store to use.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  withStore(storage: { [key: string]: any }, name?: string): TypeConf;

  /**
   * Use a function as a source.
   * @param provider Function that returns a value for a given key.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  withSupplier(supplier: (key: string) => any, name?: string): TypeConf;

  /**
   * Use command line arguments as a source.
   *
   * When looking up argument names, all names will be transformed
   * into camelCase. This means that arguments names must be
   * declared in camelCase.
   *
   * Node.js only.
   *
   * @return This TypeConf instance.
   */
  withArgv(): TypeConf;

  /**
   * Use environment variables as a source. If a prefix is configured,
   * it will be prepended to configuration value names during lookup.
   *
   * When looking up environment variables, all names will be transformed
   * into CONSTANT_CASE. This means that environment variables must be
   * declared in CONSTANT_CASE.
   *
   * Node.js only.
   *
   * @param prefix Prefix of environment variables.
   * @param separator Separator string for nested properties.
   * @return This TypeConf instance.
   */
  withEnv(prefix?: string, separator?: string): TypeConf;

  /**
   * Use a configuration file as a source. JSON and YAML are supported.
   *
   * Node.js only.
   *
   * @param file The absolute or relative file path.
   * @return This TypeConf instance.
   */
  withFile(file: string): TypeConf;

  /**
   * Use a DOM element with a `value` attribute as a source.
   * The value must be a Base64-encoded JSON string.
   *
   * Browser only.
   *
   * @param id ID attribute of the DOM element.
   * @return This TypeConf instance.
   */
  withDOMNode(id: string): TypeConf;

  /**
   * Set an override value.
   *
   * @param key Name of the value.
   * @param value Actual value.
   * @return This TypeConf instance.
   */
  set(key: string, value: any): TypeConf;

  /**
   * Delete an override value.
   *
   * @param key Name of the value.
   * @return This TypeConf instance.
   */
  unset(key: string): TypeConf;

  /**
   * Return a stored value.
   *
   * @param name Name of the value.
   * @param transform Optional transformation function.
   * @return The stored value.
   */
  get<T>(name: string, transform: (x: any) => T): T;
  get<T>(name: string, transform?: undefined): any;
  get<T>(name: string, transform?: ((x: any) => T)): T | any;

  /**
   * Return a stored value as a string.
   *
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as a string.
   */
  getString(name: string, fallback: string): string;
  getString(name: string, fallback?: string): string | undefined;
  getString(name: string, fallback?: string): string | undefined;

  /**
   * Return a stored value as a number.
   *
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as a number.
   * @throws TypeError
   */
  getNumber(name: string, fallback: number): number;
  getNumber(name: string, fallback?: number): number | undefined;
  getNumber(name: string, fallback?: number): number | undefined;

  /**
   * Return a stored value as a boolean.
   * @param name Name of the value.
   * @return The stored value as a boolean.
   */
  getBoolean(name: string): boolean;

  /**
   * Return a stored value as an object.
   *
   * @param name Name of the value.
   * @param fallback Optional fallback value.
   * @return The stored value as an object.
   * @throws TypeError
   */
  getObject(name: string, fallback: object): object;
  getObject(name: string, fallback?: object): object | undefined;
  getObject(name: string, fallback?: object): object | undefined;

  /**
   * Return a stored value as an instantiable type.
   * @param name Name of the value.
   * @param Newable Constructor of the type to instantiate.
   * @param fallback Optional fallback value.
   * @throws TypeError
   */
  getType<T>(name: string, newable: Newable<T>, fallback: T): T;
  getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined;
  getType<T>(name: string, newable: Newable<T>, fallback?: T): T | undefined;

  toJSON(): object;

  toBase64(): string;
}

export default TypeConf;
