import Newable from './Newable';
import TypeError from './TypeError';

/**
 * Resolve a raw value into a string.
 *
 * @param value Raw value.
 * @returns String or undefined if value is undefined.
 */
export function resolveString(value: any): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value !== 'undefined') {
    return JSON.stringify(value);
  }
}

/**
 * Resolve a raw value into a number.
 *
 * @param value Raw value.
 * @returns Number or undefined if value is undefined.
 * @throws TypeError if the value is defined but cannot be parsed as a number.
 */
export function resolveNumber(value: any): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      return parsedValue;
    }
  }
  if (typeof value !== 'undefined') {
    throw new TypeError(`not a number: ${value}`);
  }
}

/**
 * Resolve a raw value into an object.
 *
 * @param value Raw value.
 * @returns Object or undefined if value is undefined.
 * @throws TypeError if the value is defined but cannot be parsed as an object.
 */
export function resolveObject(value: any): object | undefined {
  if (typeof value === 'object') {
    return value;
  }
  if (typeof value === 'string' && value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new TypeError(`invalid JSON: ${value}`, e);
    }
  }
  if (typeof value !== 'undefined') {
    throw new TypeError(`not an object: ${value}`);
  }
}

/**
 * Create a resolver for an instantiable type.
 *
 * @param newable Constructor of the type to instantiate.
 * @returns Resolver for type Newable<T>.
 */
export function resolveType<T>(newable: Newable<T>) {
  /**
   * Resolve a raw value into an instantiable type.
   *
   * @param value Raw value.
   * @returns Instance of Newable<T> or undefined if value is undefined.
   * @throws TypeError if the constructor of newable throws an error.
   */
  return (value: any) => {
    if (typeof value === 'undefined') {
      return;
    }
    try {
      return new newable(value);
    } catch (e) {
      throw new TypeError(`failed to create ${newable.name}`, e);
    }
  };
}
