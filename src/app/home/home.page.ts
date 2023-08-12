import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ComputationService } from 'src/services/computation.service';
import { DatabaseService, TableName } from 'src/services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {

  values: string[];
  start: number = 0;
  end: number = 23;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private databaseService: DatabaseService,
    private computationService: ComputationService
  ) {
    this.values = new Array(24).fill('');
  }

  async ngOnInit(): Promise<void> {
    console.log('onInit');

    const loadingController = await this.loadingController.create({
      message: 'Seeding database, wait a moment...',
      mode: 'ios',
      spinner: 'crescent',
      translucent: true,
      showBackdrop: false
    });

    await loadingController.present();

    try {

      const tab = Object.keys(TableName);
      let dataSeedingCount = 0;

      tab.forEach(async (group) => {
        await this.databaseService.seedFromFile(
          `assets/json/${group}.json`,
          group
        ).then(() => {
          dataSeedingCount++;
          if (dataSeedingCount === tab.length) {
            loadingController.dismiss();
          }
        })
      });

    } catch (error) {
      console.log(error);
      await loadingController.dismiss();
    }
  }

  buttons: string[] = ['+', '-', 'Statistics', 'Wipe'];

  validateValue(colIndex: number) {
    const inputValue = Number(this.values[colIndex]);
    if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 36) {
      this.values[colIndex] = inputValue.toString();
    }
  }

  private moveValuesBackward() {
    if (this.start > 0) {
      this.start--;
      this.end--;

      for (let i = 0; i < this.values.length; i++) {
        if (i >= this.start && i <= this.end) {
          this.values[i] = this.values[i + 1];
        }
      }
      this.values[this.end + 1] = '';
    }
  }

  handleButtonClick(button: string) {
    if (button === 'Wipe') {
      console.log('Wipe');
      this.wipeGrid();
    } else if (button === '+') {
      console.log('+');
      console.log('values', this.values);

      this.addValue();
      this.moveValuesBackward();
      console.log('values', this.values);

    } else if (button === 'Statistics') {

      const inputArray: number[] = [
        35, 25, 19, 22,
        9, 1, 12, 35,
        7, 3,
        36, 33, 35, 11,
        20, 34, 22, 29,
        22, 13,
        25, 9, 2, 21
      ];

      // const result = this.computationService.computeValues(this.values);
      const result = this.computationService.computeValues(inputArray);

      console.log('result', JSON.stringify(result));

      this.databaseService.searchThroughGroup(Number(result.group_a.one_24), Number(result.group_a.two_24), Number(result.group_a.curr_3), 'group_a').then((data) => {
        console.log('data', JSON.stringify(data));
      })
    }
  }

  onInputChange(event: any, index: number) {
    let inputValue = event.target!.value;

    const lastCharacter = inputValue[inputValue.length - 1];

    if (isNaN(lastCharacter)) {
      inputValue = inputValue.slice(0, -1);
    } else {
      let numericValue = Number(inputValue);

      while (numericValue > 36) {
        inputValue = inputValue.slice(0, -1);
        numericValue = Number(inputValue);
      }
    }

    event.target.value = inputValue;
    this.values[index] = inputValue;
  }

  // private addValue() {
  //   console.log('values', this.values);

  //   if (this.values[this.values.length - 1] === '') {
  //     return;
  //   }

  //   let newArray = new Array(this.values.length).fill('');

  //   this.values.forEach((value, index) => {
  //     newArray[index] = value;
  //   });

  //   this.values = newArray;
  //   this.values.push('');

  //   this.start = this.start + 1;
  //   this.end = this.end + 1;

  //   console.log('values', this.values);

  // }

  private addValue() {
    if (this.values[this.values.length - 1] === '') {
      return;
    }

    this.values.push('');
  }


  private wipeGrid() {
    this.alertController.create({
      header: 'Wipe Grid',
      message: 'Are you sure you want to wipe the grid?',
      mode: 'ios',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.values = new Array(24).fill('');
            this.presentSuccessToast('bottom', 'Grid Cleared');
          }
        }
      ]
    }).then(alert => alert.present());
  }

  async presentSuccessToast(position: 'top' | 'middle' | 'bottom', message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: position,
      cssClass: 'toast',
      color: 'medium',
      mode: 'ios',
    });

    await toast.present();
  }
}
