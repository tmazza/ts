import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { AppConfig } from '../../app-config';
import { ApiProvider } from '../../providers/api-provider';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public api: ApiProvider) {

    let query = "vikings";
    this.api.searchTVShows(query).subscribe(
      (res) => { console.log('res', res); },
      (err) => { console.log('err', err); },
      () => { },
    );

    console.log(AppConfig.API_ENDPOINT);
  }

}
