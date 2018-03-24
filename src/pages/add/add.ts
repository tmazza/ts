import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ViewController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';
import { UserProvider } from '../../providers/user-provider';
import { AppStorage } from '../../providers/app-storage';

@IonicPage()
@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {

  public loading:boolean = true;
  public showData:any = {};
  public seassons:any = [];
  public selectedSeason:any = -1;

  public backgroundImage:any = AppConfig.URL_IMAGE;

  constructor(public navCtrl: NavController, public params: NavParams,
              public api: ApiProvider, private toastCtrl: ToastController,
              public storage: AppStorage, public user: UserProvider, 
              private view: ViewController) {
    let id = this.params.get('id');
    if(id) {
      this.api.getTVbyId(id)
        .subscribe(
          (res) => {
            this.showData = res; 
            console.log(this.showData)
            this.setBackgroundConfig();
          },
          (err) => { 
            // TODO: some nice message 
            this.navCtrl.setRoot("SearchPage");
          },
          () => {
            setTimeout(()=>{
              this.loading = false;            
            }, 300);
          },
        );
    } else {
      this.navCtrl.setRoot("SearchPage");
    }

  }

  public dismiss() {
    this.view.dismiss({
      add: false,
    });
  }

  private setBackgroundConfig() {
    let result = this.showData;
    let img_src = result && result.backdrop_path ? AppConfig.URL_IMAGE  + '/w500/' + result.backdrop_path : AppConfig.DEFAULT_BACKDROP;
    this.backgroundImage = 'url(' + img_src + ')';
  }

  public numSeassonChange(s) {
    this.selectedSeason = s;
  }

  public addShow(jaViTodos = false) {
    let show = this.user.getRelevantInfo(this.showData);
    show['current_season'] = this.selectedSeason;
    show['current_episode'] = jaViTodos ? -1 : null;

    this.storage.pushTo(AppConfig.STORAGE_USER_DATA, show)
      .then((res) => {
        let message = 'Série adicionada.';
        if(res !== true) {
          message = 'Falha ao incluir série. Tente novamente.';
          let toast = this.toastCtrl.create({
            message: message,
            duration: 2000,
            position: 'bottom',
          });
          toast.present();
        }
        this.view.dismiss({add:true});
      })
      .catch((err)=>{
        let toast = this.toastCtrl.create({
          message: 'Falha ao incluir série. Tente novamente.',
          duration: 2000,
          position: 'bottom',
        });
        toast.present();
        this.dismiss();
      })

  }

}