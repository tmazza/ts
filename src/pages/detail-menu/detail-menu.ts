import { Component } from '@angular/core';
import { IonicPage, 
         ViewController, 
         AlertController, 
         NavParams, 
         NavController,
         Events } from 'ionic-angular';
import { UserProvider } from '../../providers/user-provider';

@IonicPage()
@Component({
  selector: 'page-detail-menu',
  templateUrl: 'detail-menu.html',
})
export class DetailMenuPage {

  public tvShow:any;

  constructor(public viewCtrl: ViewController, public alertCtrl: AlertController,
              public user: UserProvider, public params: NavParams,
              public navCtrl: NavController, public events: Events) {
    this.tvShow = this.params.get('tvShow');
    if(!this.tvShow) {
      this.viewCtrl.dismiss();
    }
  }

  public removeShow() {
    let alert = this.alertCtrl.create({
      title: 'Tem certeza? 😱',
      message: 'Retirar "' + this.tvShow.name + '" da sua lista de séries?',
      buttons: [
        { text: 'Não', },
        {
          text: 'Sim, retirar',
          handler: () => {
            this.user.removeSerie(this.tvShow.id)
              .then((res) => {
                this.viewCtrl.dismiss({
                  remove: true,
                });
                this.events.publish('serie:change', this.tvShow.id, false);
                // let toast = this.toastCtrl.create({
                //   message: 'Série removida.',
                //   duration: 1000,
                //   position: 'bottom',
                //   cssClass: 'customToastSuccess',
                // });
                // toast.present();
              })
              .catch((err) => {
                // TODO: toaster
                console.log('Falha ao remover séries, tente novamente.');
                // let toast = this.toastCtrl.create({
                //   message: 'Falha ao remover séries, tente novamente.',
                //   duration: 1000,
                //   position: 'bottom',
                // });
                // toast.present();
                // console.log('[removeShow.err]', err);
              })
          }
        }
      ]
    });
    alert.present();
  }

}