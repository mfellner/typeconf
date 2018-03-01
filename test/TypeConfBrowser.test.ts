/**
 * @jest-environment jsdom
 */

import StoreError from '../src/StoreError';
import TypeConf from '../src/TypeConf';
import TypeConfBrowser from '../src/TypeConfBrowser';

describe('TypeConfBrowser', () => {
  beforeEach(() => (document.head.innerHTML = ''));

  test('TypeConfBrowser.getString with DOM node', () => {
    const storage = { number: 42 };
    const element = document.createElement('meta');
    element.setAttribute('id', 'typeconf');
    element.setAttribute('content', btoa(JSON.stringify(storage)));
    document.head.appendChild(element);

    const conf = new TypeConfBrowser().withDOMNode('typeconf');
    expect(conf.getNumber('number')).toEqual(42);
  });

  test('TypeConfBrowser.getString with invalid DOM node', () => {
    const element = document.createElement('meta');
    element.setAttribute('id', 'typeconf');
    document.head.appendChild(element);

    expect(new TypeConfBrowser().withDOMNode('typeconf')).toBeInstanceOf(TypeConfBrowser);
  });

  test('TypeConfBrowser.getString with DOM node with empty value attribute', () => {
    const element = document.createElement('meta');
    element.setAttribute('id', 'typeconf');
    element.setAttribute('content', '');
    document.head.appendChild(element);

    expect(new TypeConfBrowser().withDOMNode('typeconf')).toBeInstanceOf(TypeConfBrowser);
  });

  test('TypeConfBrowser.getString with DOM node should throw', () => {
    const element = document.createElement('meta');
    element.setAttribute('id', 'typeconf');
    element.setAttribute('content', 'invalid');
    document.head.appendChild(element);

    expect(() => new TypeConfBrowser().withDOMNode('typeconf')).toThrowError(StoreError);
  });

  test('conf.toBase64', () => {
    const conf = new TypeConfBrowser().withStore({ a: 'a', b: 42 });
    expect(JSON.parse(atob(conf.toBase64()))).toEqual({
      a: 'a',
      b: 42
    });
  });
});
