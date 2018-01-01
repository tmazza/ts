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
  public episodes:any = []; // episodios para cada temporada


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
    .then((data)=>{
      console.log(data);
      this.data = data;

      // Ordena DESC temporadas
      this.data['seasons'].sort(function(a, b){
        return b.season_number - a.season_number;
      })

      // Remove tempora 0, caso exista... Vídeos de abertura pré-temporada são colocados como zero
      let last = this.data['seasons'].length-1;
      if(this.data['seasons'][last] && this.data['seasons'][last].season_number == 0) {
        this.data['seasons'].pop();
      }

      // Inializa vetor com controle de episodios já vistos com tudo false
      for(let i = 0; i < this.data['seasons'].length; i++) {
        this.episodes[i] = [];
        for(let j = 0; j < this.data['seasons'][i].episode_count; j++) {
          this.episodes[i][j] = false;
        }
      }

      // this.api.getTVSeason(this.serie.id, 0).subscribe(
      //   (res) => { console.log('res', res);},
      //   (err) => { console.log('err', err);},
      //   () => {},
      // )
    })

  }

  public goBack() {
    this.navCtrl.pop();
  }

  public getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public numSeasonChange(s, e) {
    let data = this.user.getRelevantInfo(this.data);
    data['current_season'] = s;
    data['current_episode'] = e;

    this.user.updateSerie(this.data.id, data)
      .then((res)=>{
        if(res === true) {
          this.data.current_season = s;
          this.data.current_episode = e;
          // TODO: toaster
        } else {
          // TODO: toaster
          console.log('Ooops')
        }
      }) 
      .catch(err=>{console.log('erro ao atualziar: TODO: mostrar mensagem')})
  }

  // Verifica se episódio já visto, baseado na temporada e episódio marcadas
  public checkStatus(s, e) {
    let c_s = this.data.current_season;
    let c_e = this.data.current_episode;
    return s < c_s || (s === c_s && (c_e === null || e <= c_e));
  }

}
