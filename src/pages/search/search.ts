import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, ModalController, ToastController } from 'ionic-angular';
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

  public searchTerm:any = null;
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
              public modalCtrl: ModalController, public user: UserProvider, 
              private toastCtrl: ToastController) {
    this.loadUserSeries();
    this.loadPopular();
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

  public searchChange(ev) {
    this.api.searchTVShows(this.searchTerm)
      .subscribe(res => {
        let results = res['results'] || [];
        this.searchResults = results;
        console.log(this.searchResults);
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
          Array.prototype.push.apply(this.popular.list, results);
          // this.popular.list.push(results);
          this.popular.currentPage = res['page'] || 0;
          this.popular.showLoadMore = this.popular.currentPage !== res['total_pages'];
        },
        (err) => { console.log('err', err); },
        () => {
          infiniteScroll.complete();
        },
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

  public removeShow(id) {
    this.user.removeSerie(id)
      .then((res)=>{
        this.loadUserSeries();        
        let toast = this.toastCtrl.create({
          message: 'Série removida.',
          duration: 1000,
          position: 'bottom',
          cssClass: 'customToastSuccess',
        });
        toast.present();
      })
      .catch((err) => {
        let toast = this.toastCtrl.create({
          message: 'Falha ao remover séries, tente novamente.',
          duration: 1000,
          position: 'bottom',
        });
        toast.present();
        console.log('[removeShow.err]', err);
      })
  }

}
