import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, PopoverController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';

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

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public api: ApiProvider, public user: UserProvider,
              public toast: ToastController, public popover: PopoverController) {
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
        this.navCtrl.pop();
      }
    })
  }

  private loadSerie(id) {
    // Informações básicas da séries
    // e status do usuário na série
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
      })

  }

  private get_most_recent_season() {
    return new Promise((resolve, reject) => {
      // Identifica última temporada em produção
      let most_recent_season_number = undefined;
      let date_today = (new Date).getTime();
      for(let s of this.data['seasons']) {
        let air_date = (new Date(s.air_date)).getTime();
        if(s.episode_count > 0 && air_date <= date_today) {
          most_recent_season_number = s.season_number;
          break;            
        }
      }

      // Busca detalhes e lista de episodios da temporada (atual/em producao)
      if(most_recent_season_number !== undefined) {
        this.api.getTVSeason(this.data.id, most_recent_season_number).subscribe(
          (res) => { 
            this.most_recent_season = res;
            let episodes = res.episodes ? res.episodes : [];

            let date_today = (new Date).getTime();
            for(let e of episodes) {
              let air_date = (new Date(e.air_date)).getTime();

              if(air_date >= date_today) {
                this.next_episode_on_air = e;
                this.next_episode_on_air['label'] = this.getEpisodeLabel(e.season_number, e.episode_number);
                this.next_episode_on_air['image'] = this.getStillPath(e);
                break;
              }
            }
            resolve();
          },
          (err) => { 
            console.log('[get_next_episode_on_air.err]', err); 
            reject();
          },
        ); 
      }
    });
  }

  /* Define qual episódio deve ser mostrado como opção para 
   * marcar como já assitido
   * - busca temporada atual
   * - se visto é null ou se é o último episodio da temporada
   *   - busca episodios da próxima
   *   - se encontrar a prox temporada
   *     - mostra primeiro episodios
   *   - se não encontrar próxima tempora
   *     - todos já assistidos
   * - se não é o último
   *   - mostra o próximo episodio dessa temporada
   * ** episodio só pode ser considerado válido se data de transmissão <= data atual*/
  private set_next_episode_to_watch() {
    let cur_season = this.data.current_season;
    let cur_episode = this.data.current_episode;
    console.log('cur_season', cur_season);

    let previousOrToday = (function() {
      let date_today = (new Date()).getTime();
      return function(air_date) {
        return air_date <= date_today;
      }
    })();

    // Verifica se episodio atual do usuário é o último produzido ou algum anterior
    if(cur_season) {
      // Busca informações da temporada que está sendo assistida
      this.api.getTVSeason(this.data.id, cur_season).subscribe(
        (res) => {
          let episodes = res.episodes ? res.episodes : [];
          let last_episode = episodes[episodes.length-1];

          // Acesso logo após inclusão da série?        
          if(cur_episode === null) {
            cur_episode = this.data.current_episode = last_episode.episode_number;
            // TODO: pegar último transmitido e não qq um caso adicione com temporada ocorrendo, 
            // o episodio ainda não transmitidos será marcado como o último visto
            console.log('Marca episodio atual como o último da tempora atual', cur_episode);
          }

          if(cur_episode < last_episode.episode_number) {
            // Busca próximo episódio da temporada que já foi ao ar
            let next_episode = null;
            for(let e of episodes) {
              let air_date = (new Date(e.air_date)).getTime();
              if(previousOrToday(air_date) && e.episode_number > cur_episode) {
                next_episode = e;
                break;
              }
            }
            if(next_episode) {
              this.set_next_episode(next_episode);
            } else {
              // Episódio visto atualmente é o último transmitido, mas existem
              // outros ainda não transmitidos já cadastrados na API.
              this.next_episode_to_watch = undefined;
            }

          } else {
            // Busca informações da temporada seguinte
            this.api.getTVSeason(this.data.id, cur_season+1).subscribe(
              (res) => {
                let episodes = res.episodes ? res.episodes : [];
                let first_episode = episodes[0];
                if(first_episode) {
                  let air_date = (new Date(first_episode.air_date)).getTime();
                  if(previousOrToday(air_date)) {
                    this.set_next_episode(first_episode);
                  } else {
                    // Considerado que a temporada seguinte foi cadastrada na API, 
                    // mas não possui nenhum episodio transmitido
                    console.log('Data de transmissão do 1º da próx temporada > que hoje.');
                  }
                } else {
                  // Considerado que a temporada seguinte foi cadastrada na API, 
                  // mas não possui nenhum episodio cadastrado
                  this.all_episodes_watched = true;
                  console.log('Epissódio 1 da temporada', cur_season+1, 'não encontrado.'); 
                }
              },
              (err) => {
                // Pode assumir que todos foram vistos, mas não
                // que a temporada atual já tenha acabado. Por exemplo,
                // quando temporda para no meio contador de episodios se
                // somente com a metade do epsidoios (os transmitidos). Só
                // atualiza quando a série é retomada.
                console.log('Temporada', cur_season+1, 'não encontrada.'); 
                this.all_episodes_watched = true;
              },
            ); 
          }
        },
        (err) => {
          this.presentToast('Não foi possível buscar as informações da temporada atual. Verifique sua conexão e tente novamente.', 5000)
          console.log('Erro ao buscar informações da série.', err); 
        },
      ); 
    }
  }

  private set_next_episode(e) {
    this.next_episode_to_watch = e;
    this.next_episode_to_watch['label'] = this.getEpisodeLabel(e.season_number, e.episode_number);
    this.next_episode_to_watch['image'] = this.getStillPath(e);
  }

  private getEpisodeLabel(season, episode) {
    return 'S' + ('0'+season).slice(-2) + 'E' + ('0'+episode).slice(-2)
  }

  private getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w185/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  private getStillPath(e) {
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

}