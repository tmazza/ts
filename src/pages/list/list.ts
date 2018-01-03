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

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public user: UserProvider, public api: ApiProvider) {
    this.user.getAll()
      .then((data) => {
        this.series = data;

        this.series.sort((a, b)=>{
          return b['in_production'] - a['in_production'];          
        });

        // for(let i in this.series) {
        //   this.series[i]['to_watch'] = this.hasEpisodesNotWatched(this.series[i]);
        // }

      })
      .catch(()=>{
        this.navCtrl.setRoot("SearchPage");
      });

  }

  public getPosterPath(serie) {
    return serie.poster_path ? AppConfig.URL_IMAGE  + '/w342/' + serie.poster_path : AppConfig.DEFAULT_POSTER;
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
    // // TODO: verificar último episodio exibido
    // if(s.id === 44217) {
    //   console.log('last_season', last_season);
    //   this.api.getTVSeason(s.id, last_season.season_number).subscribe(
    //     (res) => { console.log('***res', res);},
    //     (err) => { console.log('***err', err);},
    //     () => {},
    //   )
    // }
    return false;
  }

  public goToSearch() {
    this.navCtrl.push("SearchPage");
  }

}
