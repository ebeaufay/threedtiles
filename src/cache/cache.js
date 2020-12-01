import sizeof from 'object-sizeof'
import loader from './../loader/loader'
function Cache(maxSize){
    var self = this;
    this.map = new Map();
    this.maxSize = !!maxSize? maxSize : 8e+8;

    function get(key){
        let value = self.map[key];
        if(!!value){
            return Promise.resolve(value.object);
        }
        else{
            return loader(key);
        }
    }
}

export {Cache};