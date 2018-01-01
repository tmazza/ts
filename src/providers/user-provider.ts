import { Injectable, } from '@angular/core';
import { AppConfig } from '../app-config';
import { AppStorage } from './app-storage';

@Injectable()
export class UserProvider {

    public static DATA_ID = AppConfig.STORAGE_USER_DATA;
    public constructor(public storage: AppStorage) {}

    public getSeries() {
      return this.storage.get(UserProvider.DATA_ID)
        .then((data:any) => {
          data = data || {};
          let ids = [];
          for(let d of data) {
            ids.push(d.id);
          }
          return ids;
        })
    }

    public updateSerie(id, data) {
      return this.storage.indexOf(UserProvider.DATA_ID, id)
        .then((index) => {
          if(isNaN(index)) {
            return false;
          } else {
            return this.storage.replaceAt(UserProvider.DATA_ID, index, data);
          }
        })
    }

    public removeSerie(id) {
      return this.storage.indexOf(UserProvider.DATA_ID, id)
        .then((index) => {
          if(isNaN(index)) {
            return true; // Considera como removido caso não encontre
          } else {
            return this.storage.removeAt(UserProvider.DATA_ID, index);
          }
        })
    }

}
