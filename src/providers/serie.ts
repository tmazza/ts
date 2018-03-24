import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config';
import { ApiProvider } from './api-provider';


@Injectable()
export class SerieProvider {

  public constructor(public api: ApiProvider) {}

  /** Retorna última tempora que ja teve pelo menos um
   * episódio transmitido. */
  public get_most_recent_season(serie) {
    return new Promise((resolve, reject) => {
      // Identifica última temporada em produção
      let most_recent_season_number = undefined;
      let date_today = (new Date).getTime();
      
      // Ordena DESC temporadas
      serie.seasons.sort(function(a, b){
        return b.season_number - a.season_number;
      });

      for(let s of serie.seasons) {
        let air_date = (new Date(s.air_date)).getTime();
        if (s.episode_count > 0 && air_date <= date_today) {
          most_recent_season_number = s.season_number;
          break;
        }
      }

      // Busca detalhes e lista de episodios da temporada (atual/em producao)
      if(most_recent_season_number !== undefined) {
        this.api.getTVSeason(serie.id, most_recent_season_number).subscribe(
          (res) => { 
            resolve(res);
          },
          (err) => { 
            console.log('[serie:get_most_recent_season:err]', err); 
            reject();
          },
        ); 
      } else {
        reject();
      }
    });
  }

  /** Retorna última tempora mesmo que nenhum episódio tenha sido.
   * transmitido. */
  public get_most_recent_confirm_season(serie) {
    return new Promise((resolve, reject) => {
      // Identifica última temporada em produção
      let most_recent_season_number = undefined;
      let date_today = (new Date).getTime();
      
      // Ordena DESC temporadas
      serie.seasons.sort(function(a, b){
        return b.season_number - a.season_number;
      });

      for(let s of serie.seasons) {
        if (s.episode_count > 0) {
          most_recent_season_number = s.season_number;
          break;
        }
      }

      // Busca detalhes e lista de episodios da temporada (atual/em producao)
      if(most_recent_season_number !== undefined) {
        this.api.getTVSeason(serie.id, most_recent_season_number).subscribe(
          (res) => { 
            resolve(res);
          },
          (err) => { 
            console.log('[serie:get_most_recent_season:err]', err); 
            reject();
          },
        ); 
      } else {
        reject();
      }
    });
  }

  /** Retorne data e outras informações do próximo episódio
   * com data para ser transmitido.   */ 
  public get_next_episode_on_air(serie) {
    return this.get_most_recent_confirm_season(serie).then(most_recent_season => {
      let episodes = most_recent_season['episodes'] ? most_recent_season['episodes'] : [];

      let date_today = (new Date).getTime();
      for(let e of episodes) {
        let air_date = (new Date(e.air_date)).getTime();

        if(air_date >= date_today) {
          let next_episode_on_air = e;
          next_episode_on_air['label'] = this.getEpisodeLabel(e.season_number, e.episode_number);
          return next_episode_on_air;
        }
      }
      return null;
    })
  }

  public getEpisodeLabel(season, episode) {
    return 'S' + ('0'+season).slice(-2) + 'E' + ('0'+episode).slice(-2)
  }

  /* Define qual episódio deve ser mostrado como opção para 
   * marcar como já assitido
   * - busca temporada atual
   * - se visto é null ou se é o último episodio da temporada
   *   - busca episodios da próxima
   *   - se encontrar a prox temporada
   *     - mostra primeiro episodio
   *   - se não encontrar próxima temporada
   *     - todos já assistidos
   * - se não é o último
   *   - mostra o próximo episodio dessa temporada
   * ** episodio só pode ser considerado válido se data de transmissão <= data atual*/
  public get_next_episode_to_watch(serie) {

    let cur_season = serie.current_season;
    let cur_episode = serie.current_episode;

    let previousOrToday = (function() {
      let date_today = (new Date()).getTime();
      return function(air_date) {
        return air_date <= date_today;
      }
    })();

    let next_episode_to_watch = null;
    let all_episodes_watched = false;

    return new Promise((resolve, reject) => {
      if(cur_season) {
        // Busca informações da temporada que está sendo assistida
        this.api.getTVSeason(serie.id, cur_season).subscribe(
          (res) => {
            let episodes = res.episodes ? res.episodes : [];

            let last_episode = episodes[episodes.length-1];
            
            // Acesso logo após inclusão da série?      
            if(cur_episode === null || cur_episode === -1 ) {
              if(cur_episode === null) { // clicou -> "estou assitindo a temporada"
                cur_episode = serie.current_episode = 0;
              } else { // "Já assisti a temporada"
                // Último episódio da temporada já transmitido
                let last_aired_episode = null;
                for(let e of episodes) {
                  let air_date = (new Date(e.air_date)).getTime();
                  if(!previousOrToday(air_date)) {
                    break;
                  }
                  last_aired_episode = e;
                }
                
                cur_episode = serie.current_episode = last_aired_episode.episode_number;
              }
              console.log('Seleciona episódio atual, após série ter sido adicionada.', cur_episode);
            }

            if(cur_episode < last_episode.episode_number) {
              // Busca próximo episódio da temporada sendo assitida que já foi ao ar
              let next_episode = null;
              for(let e of episodes) {
                let air_date = (new Date(e.air_date)).getTime();
                if(previousOrToday(air_date) && e.episode_number > cur_episode) {
                  next_episode = e;
                  break;
                }
              }
              if(next_episode) {
                next_episode['label'] = this.getEpisodeLabel(next_episode.season_number, next_episode.episode_number);
                next_episode_to_watch = next_episode;
              } else {
                // Episódio visto atualmente é o último transmitido, mas existem
                // outros ainda não transmitidos já cadastrados na API.
                next_episode_to_watch = undefined;
              }

              resolve({
                next_episode_to_watch: next_episode_to_watch,
                all_episodes_watched: all_episodes_watched,
                cur_episode: cur_episode,
              });

            } else {
              // Busca informações da temporada seguinte
              this.api.getTVSeason(serie.id, cur_season+1).subscribe(
                (res) => {
                  let episodes = res.episodes ? res.episodes : [];
                  let first_episode = episodes[0];
                  if(first_episode) {
                    let air_date = (new Date(first_episode.air_date)).getTime();
                    if(previousOrToday(air_date)) {
                      first_episode['label'] = this.getEpisodeLabel(first_episode.season_number, first_episode.episode_number);
                      next_episode_to_watch = first_episode;
                    } else {
                      // Considerado que a temporada seguinte foi cadastrada na API, 
                      // mas não possui nenhum episodio transmitido
                      console.log('Data de transmissão do 1º da próx temporada > que hoje.');
                      // all_episodes_watched = true;
                    }
                  } else {
                    // Considerado que a temporada seguinte foi cadastrada na API, 
                    // mas não possui nenhum episodio cadastrado
                    all_episodes_watched = true;
                    console.log('Episódio 1 da temporada', cur_season+1, 'não encontrado.'); 
                  }

                  resolve({
                    next_episode_to_watch: next_episode_to_watch,
                    all_episodes_watched: all_episodes_watched,
                    cur_episode: cur_episode,
                  });

                },
                (err) => {
                  // Pode assumir que todos foram vistos, mas não
                  // que a temporada atual já tenha acabado. Por exemplo,
                  // quando temporada para no meio contador de episodios se
                  // somente com a metade do epsidoios (os transmitidos). Só
                  // atualiza quando a série é retomada.
                  console.log('Temporada', cur_season+1, 'não encontrada.'); 
                  all_episodes_watched = true;
                  
                  resolve({
                    next_episode_to_watch: next_episode_to_watch,
                    all_episodes_watched: all_episodes_watched,
                    cur_episode: cur_episode,
                  });

                },
              ); 
            }
          },
          (err) => {
            reject('Não foi possível buscar as informações da temporada atual. Verifique sua conexão e tente novamente.')
            console.log('Erro ao buscar informações da série.', err); 
          },
        ); 
      } else {
        reject("Temporada sendo assistida não selecionada.");
      }
    });
  }

  public getStillPath(e, backdrop_path) {
    if(e && e.still_path) {
      return AppConfig.URL_IMAGE  + '/w500/' + e.still_path;
    } else if(backdrop_path) {
      return AppConfig.URL_IMAGE  + '/w500/' + backdrop_path;
    } else {
      return AppConfig.URL_IMAGE  + '/w500/' + AppConfig.DEFAULT_POSTER;  
    }    
  }

}