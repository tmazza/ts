import { Component } from '@angular/core';
import { IonicPage, 
         NavController, 
         NavParams, 
         ToastController, 
         PopoverController,
         ViewController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';
import { SerieProvider } from '../../providers/serie';

@IonicPage()
@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {

  public data:any = null;
  
  public next_episode_on_air:any = undefined;
  public next_episode_to_watch:any = undefined;
  public most_recent_season:any = undefined;

  public all_episodes_watched:boolean = false;
  public updating_current:boolean = false;
  public backgroundImage:any = AppConfig.URL_IMAGE;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public api: ApiProvider, public user: UserProvider,
              public toast: ToastController, public popover: PopoverController,
              public viewCtrl: ViewController, public serie: SerieProvider) {
    let id = this.navParams.get('id');
    if(id) {
      this.loadSerie(id);
    } else {
      this.navCtrl.setRoot("ListPage");
    }
  }

  /* Marca episódio recomendado como próximo como assitido.
   * - altera temporada e episodio atual com valores de next_episode_to_watch
   * - grava no LS
   * - faz chamada para atualização da recomendação de próximo episodio */
  public set_as_watched() {
    let cur_season_number = this.next_episode_to_watch.season_number;
    let cur_episode_number = this.next_episode_to_watch.episode_number;

    let data = this.user.getRelevantInfo(this.data);
    data['current_season'] = cur_season_number;
    data['current_episode'] = cur_episode_number;

    this.updating_current = true;

    this.user.updateSerie(this.data.id, data)
      .then((res)=>{
        if(res === true) {
          this.data.current_season = data['current_season'];
          this.data.current_episode = data['current_episode'];
          this.set_next_episode_to_watch();
        } else {
          this.presentToast('Falha ao atualizar episódio atual, verifique sua conexão e tente novamente.');
        }
        this.updating_current = false;
      }) 
      .catch(err=>{
        this.presentToast('Falha ao atualizar episódio atual, verifique sua conexão e tente novamente.');
        console.log('Erro ao atualziar episodio atual.', err);
        this.updating_current = false;
      })
  }

  public openDetailMenu(ev) {
    let popover = this.popover.create("DetailMenuPage", {
      tvShow: this.data,
    });
    popover.present({
      ev: ev,
    });
    popover.onDidDismiss((data)=>{
      if(data && data.remove === true) {
        this.viewCtrl.dismiss({
          remove: true,
        });
      }
    })
  }

  private loadSerie(id) {
    // Informações básicas da série e status do usuário nesta série
    this.user.getItem(id)
      .then((data) => {

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

        console.log('loadSerie:', this.data);

        this.get_most_recent_season()
          .then(() => {
            this.set_next_episode_to_watch();
          });
        this.setBackgroundConfig();
      })

  }

  private get_most_recent_season() {
    return this.serie.get_most_recent_season(this.data).then(res =>{
      this.most_recent_season = res;
      this.serie.get_next_episode_on_air(this.data).then(next_episode_on_air => {
        if(next_episode_on_air !== null) {
          next_episode_on_air['image'] = this.getStillPath(next_episode_on_air);
          this.next_episode_on_air = next_episode_on_air;
        }
      })
    })
  }

  /* Busca próximo episódio disponível para ser assistido. */
  private set_next_episode_to_watch() {
    this.serie.get_next_episode_to_watch(this.data).then(res => {
      this.all_episodes_watched = res['all_episodes_watched'];
      this.next_episode_to_watch = res['next_episode_to_watch'];
      if(this.next_episode_to_watch) {
        this.next_episode_to_watch['image'] = this.getStillPath(this.next_episode_to_watch);
      }
      this.data.current_episode = res['cur_episode'];
    })
  }

  private getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public getStillPath(e) {
    if(e && e.still_path) {
      return AppConfig.URL_IMAGE  + '/w185/' + e.still_path;
    } else if(this.data.backdrop_path) {
      return AppConfig.URL_IMAGE  + '/w185/' + this.data.backdrop_path;
    } else {
      return AppConfig.URL_IMAGE  + '/w185/' + AppConfig.DEFAULT_POSTER;  
    }    
  }

  private presentToast(message, duration = 3000) {
    let toast = this.toast.create({
      message: message,
      duration: duration,
      position: 'middle',
      showCloseButton: true,
      closeButtonText: 'ok',
    });
    toast.present();
  }

  // Verifica se episódio já visto, baseado na temporada e episódio marcadas
  // TODO: usar na página de detalhes da temporada...
  // public checkStatus(s, e) {
  //   let c_s = this.data.current_season;
  //   let c_e = this.data.current_episode;
  //   return s < c_s || (s === c_s && (c_e === null || e <= c_e));
  // }

  private setBackgroundConfig() {
    let img_src = this.data && this.data.backdrop_path ? AppConfig.URL_IMAGE  + '/w500/' + this.data.backdrop_path : AppConfig.DEFAULT_BACKDROP;
    this.backgroundImage = 'url(' + img_src + ')';
  }

}