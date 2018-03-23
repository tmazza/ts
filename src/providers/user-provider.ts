import { Injectable, } from '@angular/core';
import { AppConfig } from '../app-config';
import { AppStorage } from './app-storage';

@Injectable()
export class UserProvider {

    public static DATA_ID = AppConfig.STORAGE_USER_DATA;
    public constructor(public storage: AppStorage) {}

    public getAll() {
      return this.storage.get(UserProvider.DATA_ID)
        .then((data:any) => {
          data = data || {};
          return data;
        })
    }

    public setAll(data) {
      this.storage.set(UserProvider.DATA_ID, data);
    }

    public getItem(item_id) {
      return this.getAll().then((data)=>{
        for(let i=0;i<data.length;i++) {
          // TODO: ao invés de comparar o id usar uma função que recebe o item iterado...
          if(data[i].id == item_id) {
            return data[i];
          }
        }
        return null;
      })
    }

    public getSeries() { // getSeriesID
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

    public updateSerieInfo(id, key, data) {
      return this.getItem(id).then(serie => {
        if(serie) {
          serie[key] = data;
          console.log('update', serie.name, id, key, data);
          this.updateSerie(id, serie);
          return true;          
        } else {
          return false;
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

    public getRelevantInfo(serie_info) {
      let relevant = [
        "id",
        "name",
        "current_season",
        "current_episode",
        "number_of_episodes",
        "number_of_seasons",
        "seasons",
        "poster_path",
        "backdrop_path",
        "in_production",
        "date_to_update",
        "all_episodes_watched",
        "next_episode_to_watch",
        "cur_episode",
        "status",
        "next_episode_on_air",
      ];
      let data = {};
      for(let i in serie_info) {
        if(serie_info.hasOwnProperty(i)){
          if(relevant.indexOf(i) !== -1) {
            data[i] = serie_info[i];
          }
        }
      }
      return data;
    }

}
