import { Injectable, } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable()
export class AppStorage {

    public constructor(public storage: Storage) {}

    public set(key, data) {
      this.storage.set(key, JSON.stringify(data));
    }

    public get(key) {
      return new Promise((resolve, reject) => {
        this.storage.get(key).then(
          data => {
            if(data == null) {
              resolve(null)
            } else {
              resolve(JSON.parse(data));
            }
          },
          err =>  {
            resolve(null);
          });
      });
    }

    public pushTo(key, item) {
      return this.get(key)
        .then((data:any) => {
          data = data || [];
          data.push(item);
          this.set(key, data);
          return true;
        })
    }

    public indexOf(key, id) {
      return this.get(key)
        .then((data:any) => {
          data = data || [];
          let index = null;
          for(let i=0;i<data.length;i++) {
            // TODO: ao invés de comparar o id usar uma função que recebe o item iterado...
            if(data[i].id == id) {
              index = i;
              break;
            }
          }
          return index;
        })
    }

    // A indice no array onde os dados se encontração e os dados que serão colocados nessa posição
    public replaceAt(key, index, item) {
      return this.get(key)
        .then((data:any) => {
          data = data || [];
          data[index] = item;
          this.set(key, data);
          return true;
        })
    }

    public removeAt(key, index) {
       return this.get(key)
          .then((data:any) => {
            data = data || [];
            data.splice(index, 1);
            this.set(key, data);
            return true;
          })     
    }

}
