import { Injectable } from '@angular/core';
import { Http, RequestOptions } from '@angular/http';
import { AppConfig } from '../app-config';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounce';
// import 'rxjs/add/operator/catch';

@Injectable()
export class ApiProvider {

  public constructor(public http: Http) {}

  public searchTVShows(query) {

    if(query) {
      let options = {
        "params": {
          query: query,
        }
      };
      return this.request('/search/tv', options)
        .map((data) => {
          return data.json();
        })
    } else {
      return Observable.create((ob)=>{
        ob.next(false);
        ob.complete();
      });
    }     
  }

  public mostPopularTVShows(page = 1) {

    let options = {
      "params": {
        sort_by: "popularity.desc",
        page: page,
      }
    };
    return this.request('/discover/tv', options)
      .map((data) => {
        return data.json();
      })
  }

  public getTVbyId(id) {
    if(id) {
      return this.request('/tv/'+id)
        .map((data) => {
          return data.json();
        })
    } else {
      return Observable.create((ob)=>{
        ob.next(false);
        ob.complete();
      });
    }
  }

  public getTVSeason(tv_id, season_number) {
    if(tv_id) {
      return this.request('/tv/'+tv_id+'/season/'+season_number)
        .map((data) => {
          return data.json();
        })
    } else {
      return Observable.create((ob)=>{
        ob.next(false);
        ob.complete();
      });
    }
  }

  private request(endpoint, options = {}) {
    console.log('--- REQUEST!!')
    options["params"] = options["params"] || {};
    options["params"]["api_key"] = AppConfig.API_KEY;

    let requestOptions = new RequestOptions(options);

    return this.http.request(AppConfig.API_ENDPOINT + endpoint, requestOptions);
  }

}