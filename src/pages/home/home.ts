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

  public popular:any = {
    list: false,
    currentPage: 0,
    showLoadMore: false
  };

  constructor(public navCtrl: NavController, public api: ApiProvider, private fb:FormBuilder) {
    this.searchField = new FormControl();
    this.searchForm = this.fb.group({search: this.searchField});
    this.loadPopular();
    this.initSearch();
  }

  private loadPopular() {
    this.api.mostPopularTVShows()
      .subscribe(
        (res) => { 
          this.popular.list = res['results'] || [];
          this.popular.currentPage = res['page'] || 0;
          this.popular.showLoadMore = this.popular.currentPage !== res['total_pages'];
        },
        (err) => { console.log('err', err); },
        () => {},
      )
  }

  private initSearch() {
    this.searchField.valueChanges
          .debounceTime(400)
          .flatMap(term => this.api.searchTVShows(term) )
          .subscribe(res => {
            let results = res['results'] || [];
            this.searchResults = results;
            console.log(this.searchResults);
          })
  }

  public getPosterPath(result) {
    return result.poster_path ? AppConfig.URL_IMAGE  + '/w342/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public getBackdropPath(result) {
    return result.backdrop_path ? AppConfig.URL_IMAGE  + '/w342/' + result.backdrop_path : AppConfig.DEFAULT_BACKDROP;
  }

  public popularNextPage() {
    this.api.mostPopularTVShows(this.popular.currentPage+1)
      .subscribe(
        (res) => { 
          let results = res['results'] || [];
          console.log(this.popular.list);
          Array.prototype.push.apply(this.popular.list, results);
          // this.popular.list.push(results);
          this.popular.currentPage = res['page'] || 0;
          this.popular.showLoadMore = this.popular.currentPage !== res['total_pages'];
        },
        (err) => { console.log('err', err); },
        () => {},
      )
  }

}
