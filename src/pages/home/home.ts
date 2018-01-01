import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, ModalController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';

import { FormControl, FormGroup, FormBuilder } from '@angular/forms';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/mergeMap';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

  public searchField: FormControl;
  public searchForm: FormGroup;
  public searchResults:any = [];
  public popular:any;
  public userSeries:any = [];

  ngOnInit() {
    this.popular = {
      list: false,
      currentPage: 0,
      showLoadMore: false
    };
  }

  constructor(public navCtrl: NavController, public api: ApiProvider, 
              private fb:FormBuilder, public modalCtrl: ModalController,
              public user: UserProvider) {

    this.searchField = new FormControl();
    this.searchForm = this.fb.group({search: this.searchField});
    this.loadUserSeries();
    this.loadPopular();
    this.initSearch();
  }

  private loadUserSeries() {
    this.user.getSeries()
      .then((data)=>{ this.userSeries = data; })
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

  public openAddModal(id) {
    let addModal = this.modalCtrl.create("AddPage", { id: id, });
    addModal.onDidDismiss(()=>{
      this.loadUserSeries();
    });
    addModal.present();
  }

  public isAdded(id) {
    return this.userSeries.indexOf(id) !== -1;
  }

}
