import {Component, Input, OnInit} from '@angular/core';
import {Device} from "../model/device";
import {ControlUnit} from "../model/controlUnit";
import {DeviceService} from "../services/device.service";

@Component({
  selector: 'enum-details',
  templateUrl: '../views/enum-device-details.component.html'
})
export class EnumDeviceDetailsComponent implements OnInit {
  @Input()
  device: Device;

  @Input()
  controlUnit: ControlUnit;

  constructor(private deviceService: DeviceService) {
  };

  new_value: string;

  ngOnInit(): void {
    this.new_value = this.controlUnit.values[this.controlUnit.current];
    this.deviceService.getUpdateRegister().subscribe(values => {
      if (values.unitId == this.device.control_units.indexOf(this.controlUnit) && this.device.id == values.id) {
        this.updateChart();
      }
    });
    this.createChart();

  }

  updateChart(): void {

    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);
    var num = Number(sessionStorage.getItem(id + ":" + unitId));
    if (num > 0) {
      var value = Number(sessionStorage.getItem(id + ":" + unitId + ":" + (num - 1) + ":value"));
      this.polarChartData[value]++;
      this.polarChartData = this.polarChartData.slice();
    }
  }

  createChart(): void {

    for (let val of this.controlUnit.values) {
      this.polarChartLabels.push(val);
      this.polarChartData.push(0);
    }

    var id = this.device.id;
    var unitId = this.device.control_units.indexOf(this.controlUnit);

    var num = Number(sessionStorage.getItem(id + ":" + unitId));
    if (num > 0) {

      for (var i = 0; i < num; i++) {
        var value = Number(sessionStorage.getItem(id + ":" + unitId + ":" + i + ":value"));
        this.polarChartData[value]++;
      }
      this.polarChartData = this.polarChartData.slice();
    }


  }

  onSubmit(): void {
    let index = this.controlUnit.values.indexOf(this.new_value);
    this.deviceService.updateCurrent(this.device, index, this.controlUnit);
  }

  isSelected(val: string): boolean {
    return val == this.new_value;
  }

  public polarChartLabels: string[] = [];

  public polarChartData: any = [];
  public polarChartType: string = 'polarArea';
  public polarChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };
  public polarChartLegend: boolean = true;

}
