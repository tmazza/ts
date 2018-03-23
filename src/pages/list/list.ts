import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { UserProvider } from '../../providers/user-provider';
import { ApiProvider } from '../../providers/api-provider';

@IonicPage()
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {

  public series:any = [];
  count = 0;
  ionViewWillEnter() {

    let serieListHandle = (data) => {
      this.series = data.map(s => this.getPosterPath(s));
      this.series.sort((a, b)=>{
        return b['in_production'] - a['in_production'];          
      });
      // for(let i in this.series) {
      //   this.series[i]['to_watch'] = this.hasEpisodesNotWatched(this.series[i]);
      // }
    };



    this.user.getAll()
      .then(serieListHandle)
      .catch(()=>{ this.navCtrl.setRoot("SearchPage"); });
  }

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public user: UserProvider, public api: ApiProvider) {}

  public getPosterPath(serie) {
    serie['poster_path'] = serie.poster_path ? (AppConfig.URL_IMAGE  + '/w342/' + serie.poster_path) : AppConfig.DEFAULT_POSTER;
    return serie;
  }

  public detailPage(serie) {
    this.navCtrl.push("DetailPage", {
      id: serie.id,
    });
  }

  public hasEpisodesNotWatched(s) {
    if(s.current_season < s.number_of_seasons) {
      return true;
    }
    let last_season = s['seasons'].shift();
    // TODO: analisar episodio atual...
    return false;
  }

  public goToSearch() {
    this.navCtrl.push("SearchPage");
  }

}