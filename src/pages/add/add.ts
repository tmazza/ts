import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { AppStorage } from '../../providers/app-storage';

@IonicPage()
@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {

  private id:any = false;
  public showData:any = {};
  public seassons:any = [];
  public selectedSeason:any = -1;

  constructor(public navCtrl: NavController, public params: NavParams,
              public api: ApiProvider, private toastCtrl: ToastController,
              public storage: AppStorage) {
    this.id = this.params.get('id');
    if(this.id) {
      this.api.getTVbyId(this.id)
        .subscribe(
          (res) => {
            this.showData = res; 
            for(let i = 0; i < this.showData.number_of_seasons; i++) {
              this.seassons[i] = i;
            }
          },
          (err) => { 
            // TODO: some nice message 
            this.navCtrl.setRoot("HomePage");
          },
          () => {},
        );
    } else {
      this.navCtrl.setRoot("HomePage");
    }

  }

  public dismiss() {
    this.navCtrl.pop();
  }

  public getPosterPath(result) {
    return result && result.poster_path ? AppConfig.URL_IMAGE  + '/w640/' + result.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public getBackdropPath(result) {
    return result && result.backdrop_path ? AppConfig.URL_IMAGE  + '/w640/' + result.backdrop_path : AppConfig.DEFAULT_BACKDROP;
  }

  public numSeassonChange(s) {
    this.selectedSeason = s;
  }

  public addShow() {
    let show = {
      id: this.showData.id,
      seasson: this.selectedSeason,
      episodes: null,
      full: this.showData,
    };

    this.storage.pushTo(AppConfig.STORAGE_USER_DATA, show)
      .then((res) => {
        let message = 'Série adicionada.';
        if(res !== true) {
          message = 'Falha ao incluir série. Tente novamente.';
        }
        let toast = this.toastCtrl.create({
          message: message,
          duration: 2000,
          position: 'top'
        });
        toast.present();
        this.dismiss();
      })
      .catch((err)=>{
        let toast = this.toastCtrl.create({
          message: 'Falha ao incluir série. Tente novamente.',
          duration: 2000,
          position: 'top'
        });
        toast.present();
        this.dismiss();
      })

  }
}