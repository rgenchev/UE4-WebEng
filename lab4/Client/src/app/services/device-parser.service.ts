import {Device} from '../model/device';
import {Injectable} from '@angular/core';
import {ControlType} from '../model/controlType';

declare var drawThermometer: Function;
declare var drawBulb: Function;
declare var drawCam: Function;
declare var drawShutter: Function;
declare var addImage: Function;

declare var updateThermometer: Function;
declare var updateBulb: Function;
declare var updateCam: Function;
declare var updateShutter: Function;


@Injectable()
export class DeviceParserService {

  private function_map = [{id: "Heizkörperthermostat", value: drawThermometer}, {
    id: "Beleuchtung",
    value: drawBulb
  }, {id: "Webcam", value: drawCam}, {id: "Überwachungskamera", value: drawCam}, {id: "Rollladen", value: drawShutter}];

  private update_map = [{id: "Heizkörperthermostat", value: updateThermometer}, {
    id: "Beleuchtung",
    value: updateBulb
  }, {id: "Webcam", value: updateCam}, {id: "Überwachungskamera", value: updateCam}, {
    id: "Rollladen",
    value: updateShutter
  }];

  parseDevice(dev: Device): Device {

    var draw = this.function_map.filter(x => x.id === dev.type)[0];
    var update = this.update_map.filter(x => x.id === dev.type)[0];

    if (draw != null) {
      dev.draw_image = draw.value;
    } else if (dev.image != null) {
      dev.draw_image = addImage;
    }
    if (update != null) {
      dev.update_image = update.value;
    }
    for (let controlUnit of dev.control_units) {
      switch (controlUnit.type.toString()) {
        case "continuous":
          controlUnit.type = ControlType.continuous;
          break;
        case "enum":
          controlUnit.type = ControlType.enum;
          break;
        case "boolean":
          controlUnit.type = ControlType.boolean;
          break;
      }
    }
    return dev;
  }

}
