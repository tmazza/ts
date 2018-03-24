import { Component, OnInit, ViewChild } from '@angular/core';
import {  IonicPage, 
          NavController, 
          ModalController, 
          ToastController, 
          AlertController, 
          Content,
          Events } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/mergeMap';

@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html'
})
export class SearchPage implements OnInit {

  @ViewChild(Content) content: Content;

  public searchTerm:any = null;
  public searchResults:any = [];
  public popular:any;
  public userSeries:any = [];

  public count:any = 0;

  ngOnInit() {
    this.popular = {
      list: false,
      currentPage: 0,
      showLoadMore: false
    };
  }

  constructor(public navCtrl: NavController, public api: ApiProvider,
              public modalCtrl: ModalController, public user: UserProvider, 
              private toastCtrl: ToastController, public alertCtrl: AlertController,
              public events: Events) {

    console.log(this.navCtrl.canGoBack())

    this.loadUserSeries()
      .then(()=>{ this.loadPopular(); });

    this.events.subscribe('serie:change', (serie_id, status) => {
      // Atualiza série que são adicionas e removidas
      console.log(serie_id, status);
      this.setIsAdded(serie_id, status);
    });
  }

  private loadUserSeries() {
    return this.user.getSeries()
            .then((user_series_ids) => { 
              this.userSeries = user_series_ids; 
            });
  }

  private loadPopular() {
    this.api.mostPopularTVShows()
      .subscribe(
        (res) => { 
          let results = res['results'] || [];
          this.popular.list = results.map(r => this.isAdded(r));
          this.popular.currentPage = res['page'] || 0;
          this.popular.showLoadMore = this.popular.currentPage !== res['total_pages'];
        },
        (err) => { console.log('err', err); },
        () => {},
      )
  }

  public searchChange(ev) {
    this.api.searchTVShows(this.searchTerm)
      .subscribe(res => {
        let results = res['results'] || [];
        try {
          this.content.scrollToTop(1000);
        } catch(e) {
          console.log(e);
        }
        this.searchResults = results;
        this.searchResults = this.searchResults.map(r => this.isAdded(r));
      })
  }

  public getPosterPath(result) {
    return result.poster_path ? AppConfig.URL_IMAGE  + '/w342' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public getBackdropPath(result) {
    return result.backdrop_path ? AppConfig.URL_IMAGE  + '/w342' + result.backdrop_path : AppConfig.DEFAULT_BACKDROP;
  }

  public popularNextPage(infiniteScroll) {
    this.api.mostPopularTVShows(this.popular.currentPage+1)
      .subscribe(
        (res) => { 
          let results = res['results'] || [];
          Array.prototype.push.apply(this.popular.list, results.map(r => this.isAdded(r)));
          this.popular.currentPage = res['page'] || 0;
          this.popular.showLoadMore = this.popular.currentPage !== res['total_pages'];
        },
        (err) => { console.log('err', err); },
        () => {
          infiniteScroll.complete();
        },
      )
  }

  public addToggle(r) {
    if(r.isAdded) {
      this.navCtrl.push("DetailPage", {
        id: r.id,
      });
      // let modal = this.modalCtrl.create("DetailPage", {
      //   id: r.id,
      // })
      // modal.onDidDismiss((data) => {
      //   if(data && data.remove === true) {
      //     console.log('remove...');
      //     this.setIsAdded(r.id, false);
      //   }
      // })
      // modal.present();
    } else {
      let id = r.id
      let addModal = this.modalCtrl.create("AddPage", { id: id, });
      addModal.onDidDismiss((data)=>{
        this.setIsAdded(id, data && data.add === true);
      });
      addModal.present();
    }
  }

  // Check if tv show id already in the user list
  public isAdded(r) {
    r['isAdded'] = this.userSeries.indexOf(r.id) !== -1;
    return r;
  }

  private setIsAdded(id, flag:boolean) {
    let search_index = this.searchResults.findIndex((e) => {
      return e && e.id === id;
    });
    let popular_index = this.popular.list.findIndex((e) => {
      return e && e.id === id;
    });
    if(!isNaN(search_index) && search_index >= 0) {
      this.searchResults[search_index]['isAdded'] = flag;
    }
    if(!isNaN(popular_index) && popular_index >= 0) {
      this.popular.list[popular_index]['isAdded'] = flag;
    }
  }

  public goToList() {
    this.navCtrl.setRoot("ListPage");
  }

}
