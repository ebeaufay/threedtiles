
import { LinkedHashMap } from 'js-utils-z';

class Cache {
    constructor(loader, counter, dispose, max) {
        this.loader = loader;
        this.counter = counter;
        this.dispose = dispose;
        this.max = max;
        this.currentSize = 0;
        this.objects = new LinkedHashMap();
    }

    get(name){
        if(this.objects.has(name)){
            const item = this.objects.remove(name);
            item.users++;
            this.objects.put(name, item, false);
            return new Promise.resolve({dispose:()=>item.users--,content:item.content});
        }else{
            return this.loader(name).then(content=>{
                const item = { users: 1, content: content };
                this.objects.put(name, item, false);
                currentSize+=this.counter(item);
                checkSize();
                return {dispose:()=>item.users--,content:item.content};
            });
        }
    }

    checkSize(){
        let object = this.objects.head();
        while(this.currentSize > this.max && !!object){
            if(object.value.users <=0){
                const item = this.objects.remove(object.key);
                this.currentSize -= this.counter(item.content);
                this.dispose(item.content);
            }
            object = object.next();
        }
    }
}

export{Cache};