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
          // TODO: verificar se id já incluido... ou passar uma funcao de verificação de duplicados
          data.push(item);
          this.set(key, data);
          console.log('data', data)
          return true;
        })
    }

}
