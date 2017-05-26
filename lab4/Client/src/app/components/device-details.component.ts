import 'rxjs/add/operator/switchMap';
import {Component, OnInit} from "@angular/core";
import {DeviceService} from "../services/device.service";
import {Device} from "../model/device";
import {ActivatedRoute, Params} from "@angular/router";
import {ControlUnit} from '../model/controlUnit';
import {ControlType} from '../model/controlType';

@Component({
    selector: 'my-device-detail',
    templateUrl: '../views/details.html'
  }
)

export class DeviceDetailsComponent implements OnInit {

  device: Device;
  constructor(private deviceService: DeviceService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params
      .switchMap((params: Params) => this.deviceService.getDevice(params['id']))
      .subscribe(device => this.device = device);
  }

  isEnum(controlUnit: ControlUnit): boolean {
    return controlUnit.type === ControlType.enum;
  }

  isContinuous(controlUnit: ControlUnit): boolean{
    return controlUnit.type === ControlType.continuous;
  }

  isBoolean(controlUnit: ControlUnit): boolean{
    return controlUnit.type === ControlType.boolean;
  }

}
