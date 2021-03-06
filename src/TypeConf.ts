import Newable from './Newable';

/**
 * A hierarchical configuration manager that supports multiple sources.
 */
export interface TypeConf {
  /**
   * Use an object as a source.
   *
   * @param storage Object storage to use.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  withStore(storage: { [key: string]: unknown }, name?: string): TypeConf;

  /**
   * Use a supplier function as a source.
   *
   * @param provider Function that returns a value for a given key.
   * @param name Optional name of the store.
   * @return This TypeConf instance.
   */
  withSupplier(supplier: (key: string) => unknown, name?: string): TypeConf;

  /**
   * Use command line arguments as a source.
   *
   * When looking up argument names, all names will be transformed
   * into camelCase. This means that arguments names must be
   * declared in camelCase.
   *
   * Node.js only.
   *
   * @param parser Command-line argument parser. Uses minimist by default.
   * @return This TypeConf instance.
   */
  withArgv(parser?: (args: string[]) => { [key: string]: unknown }): TypeConf;

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
   * @param id ID attribute value of the DOM element.
   * @param attribute Content attribute name of the DOM element (default: 'content').
   * @return This TypeConf instance.
   */
  withDOMNode(id: string, attribute?: string): TypeConf;

  /**
   * Set an override value.
   *
   * @param key Name of the value.
   * @param value Actual value.
   * @return This TypeConf instance.
   */
  set(key: string, value: unknown): TypeConf;

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
  get<T>(name: string, transform: (x: unknown) => T): T;
  get<T>(name: string, transform?: undefined): unknown;
  get<T>(name: string, transform?: ((x: unknown) => T)): T | unknown;

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

  /**
   * Aggregate all values from all stores (if possible).
   *
   * @returns A JavaScript object aggregate of all supported stores.
   */
  toJSON(): object;

  /**
   * Aggregate all values from all supported stores and encode them as a Base64 JSON string.
   *
   * @returns Base64-encoded JSON string.
   */
  toBase64(): string;
}

export default TypeConf;
