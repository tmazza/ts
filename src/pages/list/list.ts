import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { UserProvider } from '../../providers/user-provider';
import { ApiProvider } from '../../providers/api-provider';
import { SerieProvider } from '../../providers/serie';

@IonicPage()
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {

  public paraAssistir:any = [];
  public taPraSair:any = [];
  public outras:any = [];
  
  ionViewWillEnter() {

    this.user.getAll()
      .then(series => {

        let promises = [];
        let date_now = (new Date()).getTime();

        for(let i = 0; i < series.length; i++) {

          let serie = series[i];
          console.log(new Date(date_now), new Date(serie.date_to_update), serie.name)

          if(!serie.date_to_update || date_now > serie.date_to_update) {

            let promiseSerie = this.serie.get_next_episode_to_watch(serie)
              .then(res => {
                serie['all_episodes_watched'] = res['all_episodes_watched'];
                serie['next_episode_to_watch'] = res['next_episode_to_watch'];
                serie['cur_episode'] = res['cur_episode'];
      
                // Define status            
                serie['status'] = '';
                if(serie['next_episode_to_watch']) {
                  serie['status'] = 'PARA_ASSISTIR';
                } else if(serie['all_episodes_watched']) {
                  serie['status'] = 'OUTRAS';
                } else {
                  serie['status'] = 'TA_PRA_SAIR';
                  this.serie.get_next_episode_on_air(serie)
                  .then(next_episode_on_air => {
                    serie['next_episode_on_air'] = next_episode_on_air;
                  })
                }
              })

              let periodo = this.randomPeriode(60, 600); // Entre 1h e 10h pará próxima atulização
              let date_to_update = (new Date()).getTime() + (1000 * 60 * 1) * periodo;
              console.log(periodo, new Date(), new Date(date_to_update))
              serie['date_to_update'] = date_to_update;
            promises.push(promiseSerie);
          }
        }

        if(promises.length > 0) {
          return Promise.all(promises)
            .then(() => {
              console.log('series', series)
              this.user.setAll(series);
              return series;
            })
        } else {
          return series;
        }
      })
      .then(series => { 
        series.map(s => this.getPosterPath(s));
        this.paraAssistir = series.filter(s => s.status == 'PARA_ASSISTIR');
        this.taPraSair = series.filter(s => s.status == 'TA_PRA_SAIR');
        this.outras = series.filter(s => s.status == 'OUTRAS');

        this.paraAssistir.map(s => {
          let backgroundImage = 'url('+this.serie.getStillPath(s.next_episode_to_watch, s.backdrop_path)+')';
          s.next_episode_to_watch['image'] = backgroundImage;
        })

      })
      .catch(() => {
        this.navCtrl.setRoot("SearchPage");
      });
  }

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public user: UserProvider, public api: ApiProvider,
              public serie: SerieProvider) {}

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


  private randomPeriode(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}