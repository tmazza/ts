import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { AppStorage } from '../../providers/app-storage';

@IonicPage()
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {

  public series:any = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public storage: AppStorage) {

    this.storage.get(AppConfig.STORAGE_USER_DATA)
      .then((data) => {
        this.series = data;
      })
      .catch(()=>{
        this.navCtrl.setRoot("HomePage");
      });

  }

  public getPosterPath(serie) {
    return serie.poster_path ? AppConfig.URL_IMAGE  + '/w342/' + serie.poster_path : AppConfig.DEFAULT_POSTER;
  }

  public detailPage(serie) {
    this.navCtrl.push("DetailPage", {
      id: serie.id,
    });
  }

}
