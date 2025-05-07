/**
 * @copyright 2021 Aaron Zhao <yujianzhao2013@gmail.com>
 * @license MIT
 * Linked hash map data structure
 * @class LinkedHashMap
 */
export class LinkedHashMap {
    _data: Map<any, any>;
    _link: Map<any, any>;
    _head: any;
    _tail: any;
    /**
    * Add or update an item to the list
    * @public
    * @param {any} key
    * @param {any} item
    * @param {boolean} head add to the head if true; tail otherwise
    */
    public put(key: any, item: any, head?: boolean): void;
    /**
     * Returns the head key and item
     * @public
     * @returns {any} key, item, next(), previous()
     */
    public head(): any;
    /**
     * Returns the tail key and item
     * @public
     * @returns {any} key, item, next(), previous()
     */
    public tail(): any;
    /**
     * Returns an item from the map by key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    public get(key: any): any;
    /**
     * Returns previous key item of the key
     * @public
     * @param {any} key
     * @returns {any} key
     */
    public previousKey(key: any): any;
    /**
     * Returns previous item of the key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    public previousValue(key: any): any;
    /**
     * Returns previous key, item of the key
     * @public
     * @param {any} key
     * @returns {any} key, item, next(), previous()
     */
    public previous(key: any): any;
    /**
     * Returns next key of the key
     * @public
     * @param {any} key
     * @returns {any} key
     */
    public nextKey(key: any): any;
    /**
     * Returns next item of the key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    public nextValue(key: any): any;
    /**
     * Returns next key, item of the key
     * @public
     * @param {any} key
     * @returns {any} key, item, next(), previous()
     */
    public next(key: any): any;
    /**
     * Removes and returns an item from the map
     * @public
     * @param {any} key
     * @returns {any} item
     */
    public remove(key: any): any;
    /**
     * Return if the key exists in the map
     * @public
     * @param {any} key;
     * @returns {boolean}
     */
    public has(key: any): boolean;
    /**
     * Returns the size of the map
     * @public
     * @returns {number}
     */
    public size(): number;
    /**
     * Empties the map
     * @public
     */
    public reset(): void;
    /**
     * Returns an iterator of keys
     * @public
     * @returns {Iterator[key]}
     */
    public keys(): key;
    /**
     * Returns an iterator of values
     * @public
     * @returns {Iterator[value]}
     */
    public values(): value;
    /**
     * Returns an iterator of keys and values
     * @public
     * @returns {Iterator[key, value]}
     */
    public entries(): key;
    /**
     * Returns array representation of the map values
     * @public
     * @param {'orderByInsert' | 'orderByLink'} order return by inserting order (default) or link order
     * @returns {Array<{key: any, value: any}>}
     */
    public toArray(order?: "orderByInsert" | "orderByLink"): Array<{
        key: any;
        value: any;
    }>;
}
