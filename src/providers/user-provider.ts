import { Injectable, } from '@angular/core';
import { AppConfig } from '../app-config';
import { AppStorage } from './app-storage';

@Injectable()
export class UserProvider {

    public constructor(public storage: AppStorage) {}

    public getSeries() {
      return this.storage.get(AppConfig.STORAGE_USER_DATA)
        .then((data:any) => {
          data = data || {};
          let ids = [];
          for(let d of data) {
            ids.push(d.id);
          }
          return ids;
        })
    }


}
