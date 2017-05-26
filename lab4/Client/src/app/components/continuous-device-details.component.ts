import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Device} from "../model/device";
import {ControlUnit} from "../model/controlUnit";
import {DeviceService} from "../services/device.service";
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'continuous-details',
  templateUrl: '../views/continuous-device-details.component.html'
})
export class ContinuousDeviceDetailsComponent implements OnInit {
  @Input()
  device: Device;

  @Input()
  controlUnit: ControlUnit;


  constructor(private deviceService: DeviceService) {
  };

  new_value: number;

  ngOnInit(): void {
    this.new_value = this.controlUnit.current;

    this.deviceService.getUpdateRegister().subscribe(values => {
      if (values.unitId == this.device.control_units.indexOf(this.controlUnit) && this.device.id == values.id) {
        this.updateChart();
      }
    });

    this.createChart();
  }

  onSubmit(): void {
    this.deviceService.updateCurrent(this.device, this.new_value, this.controlUnit);
  }

  createChart() {

    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);

    var num = Number(sessionStorage.getItem(id + ":" + unitId));
    if (num > 0) {

      for (var i = 0; i < num; i++) {
        var value = sessionStorage.getItem(id + ":" + unitId + ":" + i + ":value");
        var time = sessionStorage.getItem(id + ":" + unitId + ":" + i + ":time");

        this.lineChartData[0].data.push(value);
        this.lineChartLabels.push(time);
      }
      this.lineChartData = this.lineChartData.slice();
    }
  }

  updateChart() {

    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);

    var num = Number(sessionStorage.getItem(id + ":" + unitId));

    var value = sessionStorage.getItem(id + ":" + unitId + ":" + (num - 1) + ":value");
    var time = sessionStorage.getItem(id + ":" + unitId + ":" + (num - 1) + ":time");

    this.lineChartData[0].data.push(value);
    this.lineChartLabels.push(time);

    this.lineChartData = this.lineChartData.slice();

  }

  public lineChartData: Array<any> = [
    {data: [], label: 'Verlauf'}
  ];
  public lineChartLabels: Array<any> = [];
  public lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };
  public lineChartColors: Array<any> = [
    { // dark grey
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    }
  ];
  public lineChartLegend: boolean = true;
  public lineChartType: string = 'line';
}



