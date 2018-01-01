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

  public season:number = -1;
  public episode:number = -1;
  public serie:any = {};
  public episodes:any = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public api: ApiProvider, public user: UserProvider) {
    let data = this.navParams.get('serie');
    console.log(data);
    if(data) {
      this.season = data.seasson;
      this.episode = data.episodes;
      this.serie = data.full;

      this.serie['seasons'].sort(function(a, b){
        return b.season_number - a.season_number;
      })

      // Remove tempora 0, caso exista... Vídeos de abertura pré-temporada são colocados como zero
      let last = this.serie['seasons'].length-1;
      if(this.serie['seasons'][last] && this.serie['seasons'][last].season_number == 0) {
        this.serie['seasons'].pop();
      }

      for(let i = 0; i < this.serie['seasons'].length; i++) {
        this.episodes[i] = [];
        for(let j = 0; j < this.serie['seasons'][i].episode_count; j++) {
          this.episodes[i][j] = false;
        }
      }

      // this.api.getTVSeason(this.serie.id, 0).subscribe(
      //   (res) => { console.log('res', res);},
      //   (err) => { console.log('err', err);},
      //   () => {},
      // )


    } else {
      this.navCtrl.setRoot("ListPage");
    }
  }

  public goBack() {
    this.navCtrl.pop();
  }

  public getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public numSeasonChange(s, e) {
    let data = {
      id: this.serie.id,
      full: this.serie,
      seasson: s,
      episodes: e,      
    };

    this.user.updateSerie(this.serie.id, data)
      .then((res)=>{
        if(res === true) {
          this.season = s;
          this.episode = e;
          // TODO: toaster
          console.log('ok', 'atualizado')
        } else {
          // TODO: toaster
          console.log('Ooops')
        }
      }) 
      .catch(err=>{console.log('erro ao atualziar: TODO: mostrar mensagem')})
  }

  // Verifica se episódio já visto, baseado na temporada e episódio marcadas
  public checkStatus(s, e) {
    return s < this.season || 
          (s === this.season && (this.episode === null || e <= this.episode));
  }

}
