/**
 * @copyright 2021 Aaron Zhao <yujianzhao2013@gmail.com>
 * @license MIT
 * Linked hash map data structure
 * @class LinkedHashMap
 */
class LinkedHashMap {
    /**
    * Creates a linked hash map instance
    * @public
    */
    constructor() {
        this._data = new Map();
        this._link = new Map();
        this._head = undefined;
        this._tail = undefined;
    }

    /**
    * Add or update an item to the list
    * @public
    * @param {any} key
    * @param {any} item
    * @param {boolean} head add to the head if true; tail otherwise
    */
    put(key, item, head = false) {
        if (this.has(key)) {
            this._data.set(key, item);
            return;
        }
        this._data.set(key, item);
        this._link.set(key, {
            previous: undefined,
            next: undefined
        });
        if (this._head == null) {
            this._head = key;
            this._tail = key;
        } else if (head) {
            this._link.get(this._head).previous = key;
            this._link.get(key).next = this._head;
            this._head = key;
        } else {
            this._link.get(this._tail).next = key;
            this._link.get(key).previous = this._tail;
            this._tail = key;
        }
    }

    /**
     * Returns the head key and item
     * @public
     * @returns {any} key, item, next(), previous()
     */
    head() {
        return ({
            key: this._head, value: this.get(this._head), next: () => this.next(this._head), previous: () => null
        });
    }

    /**
     * Returns the tail key and item
     * @public
     * @returns {any} key, item, next(), previous()
     */
    tail() {
        return ({
            key: this._tail, value: this.get(this._tail), next: () => null, previous: () => this.previous(this._tail)
        });
    }

    /**
     * Returns an item from the map by key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    get(key) {
        return this._data.get(key);
    }

    /**
     * Returns previous key item of the key
     * @public
     * @param {any} key
     * @returns {any} key
     */
    previousKey(key) {
        const link = this._link.get(key);
        return link != null ? link.previous : undefined;
    }

    /**
     * Returns previous item of the key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    previousValue(key) {
        return this.get(this.previousKey(key));
    }

    /**
     * Returns previous key, item of the key
     * @public
     * @param {any} key
     * @returns {any} key, item, next(), previous()
     */
    previous(key) {
        const prevKey = this.previousKey(key);
        return ({
            key: prevKey,
            value: this.get(prevKey),
            next: () => this.next(prevKey),
            previous: () => this.previous(prevKey)
        });
    }

    /**
     * Returns next key of the key
     * @public
     * @param {any} key
     * @returns {any} key
     */
    nextKey(key) {
        const link = this._link.get(key);
        return link != null ? link.next : undefined;
    }

    /**
     * Returns next item of the key
     * @public
     * @param {any} key
     * @returns {any} item
     */
    nextValue(key) {
        return this.get(this.nextKey(key));
    }

    /**
     * Returns next key, item of the key
     * @public
     * @param {any} key
     * @returns {any} key, item, next(), previous()
     */
    next(key) {
        const nextKey = this.nextKey(key);
        return ({
            key: nextKey,
            value: this.get(nextKey),
            next: () => this.next(nextKey),
            previous: () => this.previous(nextKey)
        });
    }

    /**
     * Removes and returns an item from the map
     * @public
     * @param {any} key
     * @returns {any} item
     */
    remove(key) {
        const item = this._data.get(key);
        if (item != null) {
            if (this.size() === 1) {
                this.reset();
            } else {
                if (key === this._head) {
                    const headLink = this._link.get(this._head);
                    this._link.get(headLink.next).previous = null;
                    this._head = headLink.next;
                } else if (key === this._tail) {
                    const tailLink = this._link.get(this._tail);
                    this._link.get(tailLink.previous).next = null;
                    this._tail = tailLink.previous;
                } else {
                    const cur = this._link.get(key);
                    const prev = this._link.get(cur.previous);
                    const nex = this._link.get(cur.next);
                    prev.next = cur.next;
                    nex.previous = cur.previous;
                }
                this._link.delete(key);
                this._data.delete(key);
            }
        }
        return item;
    }

    /**
     * Return if the key exists in the map
     * @public
     * @param {any} key;
     * @returns {boolean}
     */
    has(key) {
        return this._data.has(key);
    }

    /**
     * Returns the size of the map
     * @public
     * @returns {number}
     */
    size() {
        return this._data.size;
    }

    /**
     * Empties the map
     * @public
     */
    reset() {
        this._data.clear();
        this._link.clear();
        this._head = undefined;
        this._tail = undefined;
    }

    /**
     * Returns an iterator of keys
     * @public
     * @returns {Iterator[key]}
     */
    keys() {
        return this._data.keys();
    }

    /**
     * Returns an iterator of values
     * @public
     * @returns {Iterator[value]}
     */
    values() {
        return this._data.values();
    }

    /**
     * Returns an iterator of keys and values
     * @public
     * @returns {Iterator[key, value]}
     */
    entries() {
        return this._data.entries();
    }

    /**
     * Returns array representation of the map values
     * @public
     * @param {'orderByInsert' | 'orderByLink'} order return by inserting order (default) or link order
     * @returns {Array<{key: any, value: any}>}
     */
    toArray(order = 'orderByInsert') {
        if (order !== 'orderByInsert') {
            const linkOrderArr = [];
            let next = this._head;
            while (next != null) {
                linkOrderArr.push({ key: next, value: this.get(next) });
                next = this.nextKey(next);
            }
            return linkOrderArr;
        }
        return Array.from(this.keys()).map((k) => ({ key: k, value: this.get(k) }));
    }
}

export { LinkedHashMap };
