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

  public data:any = null;
  
  public most_recent_season:any = undefined;
  public next_episode_on_air:any = undefined;

  public current_watching_season:any = undefined;
  public next_episode_to_watch:any = undefined;

  public all_episodes_watched:boolean = false;

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

        // // TODO: decidir se -> Remove tempora 0, caso exista... Vídeos de abertura pré-temporada são colocados como zero
        // let last = data['seasons'].length-1;
        // if(data['seasons'][last] && data['seasons'][last].season_number == 0) {
        //   data['seasons'].pop();
        // }

        this.set_most_recent_season()
          .then(() => {
            this.set_next_episode_to_watch();
          });
      })

  }

  public set_as_watched() {
    let cur_season = this.current_watching_season;
    let cur_episode_number = this.data.current_episode;

    console.log(cur_season, cur_episode_number);

    if(this.data.current_season !== this.most_recent_season.season_number || 
       this.next_episode_on_air === undefined || 
       cur_episode_number < this.next_episode_on_air.episode_number) {

      let next_season = cur_season.season_number; 
      let next_episode = cur_episode_number; // Próximo marcado como visto

      if(cur_episode_number === cur_season.episodes.length) {
        if(cur_season.season_number === this.most_recent_season.season_number) {
          this.all_episodes_watched = true;
        } 
        if(cur_season.season_number <= this.most_recent_season.season_number) {
          next_season++;
          next_episode = 1;
        }
      } else {
        next_episode++;
      }

      let data = this.user.getRelevantInfo(this.data);
      data['current_season'] = next_season;
      data['current_episode'] = next_episode;

      this.user.updateSerie(this.data.id, data)
        .then((res)=>{
          if(res === true) {
            this.data.current_season = data['current_season'];
            this.data.current_episode = data['current_episode'];
            this.set_next_episode_to_watch();
            // TODO: toaster
            console.log('set to....', this.data.current_season, this.data.current_episode);
          } else {
            // TODO: toaster
            console.log('Ooops')
          }
        }) 
        .catch(err=>{console.log('erro ao atualziar: TODO: mostrar mensagem')})
    } else {
      console.log('Aguardar próxima tranmissão...');
    }
  }

  private set_most_recent_season() {
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
            let episodes = this.most_recent_season.episodes ? this.most_recent_season.episodes : [];

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

  private set_next_episode_to_watch() {

    // Série recem adicionada, considera como episodios da temporada como assistido
    if(this.data.current_episode === null) { 
      this.data.current_season++; 
      this.data.current_episode = 1; 
    }
    let cur_season = this.data.current_season;
    let cur_episode = this.data.current_episode;
    
    // Verifica se episodio atual do usuário é o último produzido ou algum anterior
    if(cur_season) {
      // Busca informações da temporada que está sendo assistida
      this.api.getTVSeason(this.data.id, cur_season).subscribe(
        (res) => {
          this.current_watching_season = res;
          let episodes = this.current_watching_season.episodes ? this.current_watching_season.episodes : [];

          console.log('this.data.current_episode', this.data.current_episode);

          let date_today = (new Date).getTime();
          for(let e of episodes) {
            let air_date = (new Date(e.air_date)).getTime();
            if(air_date <= date_today && e.episode_number === cur_episode) {
              this.next_episode_to_watch = e;
              this.next_episode_to_watch['label'] = this.getEpisodeLabel(e.season_number, e.episode_number);
              this.next_episode_to_watch['image'] = this.getStillPath(e);
              break;
            }
          }
          console.log(this.next_episode_to_watch);
        },
        (err) => { 
          console.log('[get_next_episode_to_watch.err]', err); 
        },
      ); 
    }
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

  // Verifica se episódio já visto, baseado na temporada e episódio marcadas
  // public checkStatus(s, e) {
  //   let c_s = this.data.current_season;
  //   let c_e = this.data.current_episode;
  //   return s < c_s || (s === c_s && (c_e === null || e <= c_e));
  // }

}
