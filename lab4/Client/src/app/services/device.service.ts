import {Device} from '../model/device';
import {Router, Params} from "@angular/router";
import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';

import {AccessService} from './access.service';
import {DeviceParserService} from './device-parser.service';

import 'rxjs/add/operator/toPromise';
import {DatePipe} from '@angular/common';
import {ControlUnit} from "../model/controlUnit";
import {Subject} from 'rxjs/Subject';


@Injectable()
export class DeviceService {

  constructor(private datePipe: DatePipe,
              private activeRoute: Router,
              private http: Http,
              private parserService: DeviceParserService,
              private accessService: AccessService) {
  }

  //TODO Passen Sie die URLs zu Ihrer REST-Schnittstelle, entsprechend der von Ihnen vorgenommenen Änderungen am Server, an

  private listDevicesURL = 'http://localhost:8081/listDevices';
  private updateDeviceURL = 'http://localhost:8081/updateDevice';
  private deleteDeviceURL = 'http://localhost:8081/deleteDevice';
  private createDeviceURL = 'http://localhost:8081/createDevice';

  private connection: WebSocket = null;

  private devices: Device[] = null;
  private updateRegister: Subject<{id: string, unitId: number}> = new Subject();


  /**
   * Löscht das gewünschte Gerät über die REST-Schnittstelle
   * @param device
   * @returns {Promise<TResult|boolean>|Promise<TResult2|boolean>|Promise<boolean>}
   */
  deleteDevice(device: Device): Promise<boolean> {

    return this.http.post(this.deleteDeviceURL, {"id": device.id},
      {headers: this.accessService.getTokenHeader()})
      .toPromise()
      .then(response => {
        response = response.json();
        if (response["status"] === 200) {
          return true;
        }
        return false;
      });

  }

  /**
   * Fügt das gewünschte Gerät über die REST-Schnittstelle hinzu
   * @param device
   * @returns {Promise<TResult|boolean>|Promise<TResult2|boolean>|Promise<boolean>}
   */
  createDevice(device: Device): Promise<boolean> {
    return this.http.post(this.createDeviceURL, {"device": JSON.stringify(device)}, {headers: this.accessService.getTokenHeader()})
      .toPromise()
      .then(response => {
        response = response.json();
        if (response["status"] === 200) {
          return true;
        } else {
          return false;
        }
      });
  }

  /**
   * Aktualisiert das gewünschte Gerät über die REST-Schnittstelle
   * @param device
   * @returns {Promise<TResult|boolean>|Promise<TResult2|boolean>|Promise<boolean>}
   */
  updateDevice(device: Device): Promise<boolean> {

    return this.http.post(this.updateDeviceURL, {"device": JSON.stringify(device)},
      {headers: this.accessService.getTokenHeader()})
      .toPromise()
      .then(response => {
        response = response.json();
        if (response["status"] === 200) {
          return true;
        }
        return false;
      });

  }

  /**
   * Aktualisiert den aktuellen Zustand eines Gerätes über die REST-Schnittstelle
   * Verwendet dafür natives JavaScript
   * @param device
   * @param new_value
   * @param controlUnit
   */
  updateCurrent(device: Device, new_value: number, controlUnit: ControlUnit): void {

    var request = new XMLHttpRequest();
    request.onreadystatechange = this.stateChanged;
    request["controlUnit"] = controlUnit;

    request.open("POST", "http://localhost:8081/updateCurrent", true);

    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.setRequestHeader("access-token", this.accessService.getToken());

    var unitId = device.control_units.indexOf(controlUnit);

    var data = "id=" + device.id + "&unitId=" + unitId + "&value=" + new_value;
    request.send(data);

  }

  /**
   * Wird bei Statusänderungen des XMLHTTPRequests aufgerufen und liest bei Abschluss die Werte aus
   * @param event
   */
  stateChanged(event: any): void {
    var request = event.target;
    switch (request.readyState) {
      case 0:
        break;// unsent
      case 1:
        break; // opened
      case 2:
        break; // sent
      case 3:
        break; // loading
      case 4: // done
        if (request.status == 200) {

          var response = JSON.parse(request.responseText);
          if (response.status == 200) {
            var controlUnit: ControlUnit = request["controlUnit"];
            controlUnit.log = response.message;
            controlUnit.current = response.value;
          }
        }
        break;
    }
  }


  /**
   * Öffnet einen Websocket zum Server und reagiert entsprechend auf Änderungen
   */
  openWebsocket(): void {
    if (this.connection != null) {
      return;
    }

    this.connection = new WebSocket("ws://localhost:8081/subscribe");

    var token = this.accessService.getToken();
    this.connection.onopen = function (event) {
      var con = event.target as WebSocket;
      con.send(JSON.stringify({token: token}));
    };

    this.connection.onmessage = event => {

      var msg = JSON.parse(event.data);
      if (msg.method == -1 && !msg.message.includes("submitted")) {
        this.connection.close();
        return;
      }

      // überprüfen welche der unterschiedlichen Updatemethoden verwendet wurden
      if (msg.method < 0) {
        return;
      }

      if (msg.method == 3) {
        var new_device = JSON.parse(msg.device);
        new_device = this.parserService.parseDevice(new_device);
        this.devices.push(new_device);
        this.devices.slice();
        return;
      }

      // auslesen der aktualisierten Werte und speichern dieser
      var device = this.devices.find(device => device.id === msg.deviceID);
      switch (msg.method) {
        case 0:
          var controlUnit = device.control_units[msg.control_unitID];
          if (controlUnit.current != msg.value as number) {
            controlUnit.current = msg.value as number;
            controlUnit.log = msg.log;
            if (controlUnit.primary && this.activeRoute.url === "/overview") {
              device.update_image(device.id, controlUnit.min, controlUnit.max, controlUnit.current, controlUnit.values);
            }
            this.writeDeviceLog(device.id, msg.control_unitID, msg.value, msg.date as Date);
          }
          break;
        case 1:
          device.display_name = msg.value;
          break;
        case 2:
          this.devices.splice(this.devices.indexOf(device), 1);
          break;
      }
    }
  }

  /**
   * Schreibt einen neuen Zustand eines Gerätes in den SessionStorage
   * @param id      id des Gerätes
   * @param unitId  id des Steuerungselements
   * @param value   neuer Zustand
   * @param time    Zeitpunkt der Wertänderung
   */
  writeDeviceLog(id: string, unitId: string, value: number, time: Date) {

    var num = Number(sessionStorage.getItem(id + ":" + unitId));

    sessionStorage.setItem(id + ":" + unitId + ":" + num + ":value", value.toString());
    sessionStorage.setItem(id + ":" + unitId + ":" + num + ":time", this.datePipe.transform(time, "mediumTime"));

    sessionStorage.setItem(id + ":" + unitId, (num + 1) + "");
    this.updateRegister.next({id: id, unitId: Number(unitId)});
  }

  /**
   * Liefert ein Subject zurück, welches überwacht werden kann um auf Änderungen an Gerätezuständen zu reagieren
   * @returns {Subject<{id: string, unitId: number}>}
   */
  getUpdateRegister(): Subject<{id: string, unitId: number}> {
    return this.updateRegister;
  }


  /**
   * Liefert alle Geräte als Array zurück
   * @returns {Promise<any>}
   */
  getDevices(): Promise<Device[]> {
    return this.http.get(this.listDevicesURL, {headers: this.accessService.getTokenHeader()})
      .toPromise()
      .then(response => {

        var devices = response.json().message.devices as Device[];
        //parse devices from json to typescript to be usable with angular
        for (let i = 0; i < devices.length; i++) {
          devices[i] = this.parserService.parseDevice(devices[i]);
        }
        this.devices = devices;
        return devices;

      })
      .catch(this.handleError);
  }

  /**
   * Liefert das gewünschte Gerät zurück
   * @param id
   * @returns {Promise<Device[]>}
   */
  getDevice(id: string): Promise<Device> {
    return this.getDevices()
      .then(devices => devices.find(device => device.id === id));
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
