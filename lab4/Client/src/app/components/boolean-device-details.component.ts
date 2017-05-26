import {Component, Input, OnInit} from '@angular/core';
import {Device} from "../model/device";
import {ControlUnit} from "../model/controlUnit";
import {DeviceService} from "../services/device.service";

@Component({
  selector: 'boolean-details',
  templateUrl: '../views/boolean-device-details.component.html'
})
export class BooleanDeviceDetailsComponent implements OnInit {
  @Input()
  device: Device;

  @Input()
  controlUnit: ControlUnit;

  constructor(private deviceService: DeviceService) {
  }

  new_value: boolean;

  ngOnInit(): void {
    this.new_value = this.controlUnit.current == 1;

    this.deviceService.getUpdateRegister().subscribe(values => {
      if (values.unitId == this.device.control_units.indexOf(this.controlUnit) && this.device.id == values.id) {
        this.updateChart();
      }
    });
    this.createChart();
  }

  createChart(): void {

    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);

    var num = Number(sessionStorage.getItem(id + ":" + unitId));
    if (num > 0) {

      for (var i = 0; i < num; i++) {
        var value = Number(sessionStorage.getItem(id + ":" + unitId + ":" + i + ":value"));
        this.doughnutChartData[value ? 1 : 0]++;
      }
      this.doughnutChartData = this.doughnutChartData.slice();
    }

  }

  updateChart(): void {
    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);

    var num = Number(sessionStorage.getItem(id + ":" + unitId));
    if (num > 0) {
      var value = Number(sessionStorage.getItem(id + ":" + unitId + ":" + (num - 1) + ":value"));
      this.doughnutChartData[value ? 1 : 0]++;
      this.doughnutChartData = this.doughnutChartData.slice();
    }
  }

  onSubmit(): void {
    this.deviceService.updateCurrent(this.device, this.new_value ? 1 : 0, this.controlUnit);
  }

  public doughnutChartData: number[] = [0, 0];
  public doughnutChartLabels: string[] = ['Aus', 'An'];
  public doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
  };
  public doughnutChartLegend: boolean = true;
  public doughnutChartType: string = 'doughnut';

}
