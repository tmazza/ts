import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';

@IonicPage()
@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html'
})
export class DetailPage {

  public data: any = null;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public api: ApiProvider, public user: UserProvider) {
    let id = this.navParams.get('id');
    if(id) {
      this.loadSerie(id);
    } else {
      this.navCtrl.setRoot("ListPage");
    }
  }

  public loadSerie(id) {
    this.user.getItem(id)
      .then((data) => {
        console.log('loadSerie:', data);
        
        // Ordena DESC temporadas
        data['seasons'].sort(function(a, b){
          return b.season_number - a.season_number;
        })

        // Define imagens de background das tempordas
        data['seasons'].map(s => {
          s['background'] = 'url('+this.getPosterPath(s)+')';
        })
        
        return data;

      })
      .then(data => {
        this.data = data;

        // // TODO: decidir se -> Remove tempora 0, caso exista... Vídeos de abertura pré-temporada são colocados como zero
        // let last = data['seasons'].length-1;
        // if(data['seasons'][last] && data['seasons'][last].season_number == 0) {
        //   data['seasons'].pop();
        // }       

        let current_season = undefined;
        let date_today = (new Date).getTime();
        for(let s of data['seasons']) {
          let air_date = (new Date(s.air_date)).getTime();
          if(s.episode_count > 0 && air_date <= date_today) {
            current_season = s;
            break;            
          }
        }

        if(current_season !== undefined) {
          console.log('current_season', current_season);
          this.getSeasonEpisodes(current_season);
        }

      })

  }

  private getSeasonEpisodes(season) {
    this.api.getTVSeason(this.data.id, season.season_number).subscribe(
      (res) => { console.log('res', res); },
      (err) => { console.log('[getSeasonEpisodes.err]', err); },
    );
  }

  private getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  // public numSeasonChange(published, s, e) {
  //   if(published === false){
  //     return;
  //   }
  //   let data = this.user.getRelevantInfo(this.data);
  //   data['current_season'] = s;
  //   data['current_episode'] = e;

  //   this.user.updateSerie(this.data.id, data)
  //     .then((res)=>{
  //       if(res === true) {
  //         this.data.current_season = s;
  //         this.data.current_episode = e;
  //         // TODO: toaster
  //       } else {
  //         // TODO: toaster
  //         console.log('Ooops')
  //       }
  //     }) 
  //     .catch(err=>{console.log('erro ao atualziar: TODO: mostrar mensagem')})
  // }

  // Verifica se episódio já visto, baseado na temporada e episódio marcadas
  // public checkStatus(s, e) {
  //   let c_s = this.data.current_season;
  //   let c_e = this.data.current_episode;
  //   return s < c_s || (s === c_s && (c_e === null || e <= c_e));
  // }

}
