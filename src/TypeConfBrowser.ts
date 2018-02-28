import StoreError from './StoreError';
import TypeConf from './TypeConf';
import TypeConfBase from './TypeConfBase';
import { createStore, ObjectSupplier } from './util';

export default class TypeConfBrowser extends TypeConfBase {
  public withDOMNode(id: string): TypeConf {
    const element = document.getElementById(id);
    if (!element || !element.hasAttribute('value')) {
      return this;
    }
    const encodedString = element.getAttribute('value');
    if (!encodedString) {
      return this;
    }
    let storage: { [key: string]: any };
    try {
      storage = JSON.parse(atob(encodedString));
    } catch (e) {
      throw new StoreError(`cannot read value of DOM node ${id}`, e);
    }
    const store = createStore(new ObjectSupplier(storage));
    this.addStore(store, `__DOM_${id}__`);
    return this;
  }

  public toBase64(): string {
    return btoa(JSON.stringify(this.toJSON()));
  }
}
