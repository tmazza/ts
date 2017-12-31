import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';

import { FormControl, FormGroup, FormBuilder } from '@angular/forms';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/mergeMap';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public searchField: FormControl;
  public searchForm: FormGroup;
  public searchResults:any = [];

  constructor(public navCtrl: NavController, public api: ApiProvider, private fb:FormBuilder) {
    this.searchField = new FormControl();
    this.searchForm = this.fb.group({search: this.searchField});

    this.searchField.valueChanges
          .debounceTime(400)
          .flatMap(term => this.api.searchTVShows(term) )
          .subscribe(res => {
            this.searchResults = res.results;
            console.log(this.searchResults);
          })
  }

  getPosterPath(result) {
    return result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  getBackdropPath(result) {
    return result.backdrop_path ? AppConfig.URL_IMAGE  + '/w342/' + result.backdrop_path : AppConfig.DEFAULT_BACKDROP;
  }

}
