import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import {CanActivate, Router} from '@angular/router';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class AccessService implements CanActivate {

  private token_name = "access-token";

  //TODO Passen Sie die URLs zu Ihrer REST-Schnittstelle, entsprechend der von Ihnen vorgenommenen Änderungen am Server, an

  private loginURL = "http://localhost:8081/login";
  private logoutURL = "http://localhost:8081/logout";
  private statusURl = "http://localhost:8081/getStatus";
  private token: string = null;

  server_start: Date = new Date;
  failed_logins: number = 0;

  constructor(private http: Http, private router: Router) {
  };

  /**
   * Aktivierungsfunktion für Guards
   * @returns {boolean}
   */
  canActivate() {
    this.readToken();
    if (this.token != null) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }

  /**
   * Liest Token vom LocalStorage und speichert diesen in this.token
   */
  readToken() {
    var token = localStorage.getItem(this.token_name);
    if (token) {
      this.token = token;
    }
  }

  /**
   * Schreibt JWT in LocalStorage
   */
  writeToken() {
    localStorage.setItem(this.token_name, this.token);
  }

  /**
   * Entfernt JWT aus LocalStorage
   */
  removeToken() {
    localStorage.removeItem(this.token_name);
  }

  /**
   * Führt den Login mit den bereitgestellten Logindaten durch
   * @param username
   * @param password
   * @returns {Promise<TResult|boolean>|Promise<TResult2|boolean>|Promise<boolean>}
   */
  doLogin(username: string, password: string): Promise<boolean> {
    return this.http.post(this.loginURL, {"username": username, "password": password}).toPromise().then(res => {
      res = res.json();
      if (res["status"] === 200) {
        this.token = res["token"];
        this.writeToken();

        this.getServerStatus();

        return true;
      }
      return false;
    });
  }

  /**
   * Erzeugt einen http header, welcher den Token zur Authentifizierung enthält
   * @returns {any}
   */
  getTokenHeader(): Headers {

    if (this.token == null) {
      return null;
    }
    let header = new Headers();
    header.append(this.token_name, this.token);
    return header;
  }

  /**
   * Führt einen Log-out für den eingeloggten Benutzer durch
   * @returns {Promise<TResult|boolean>|Promise<TResult2|boolean>|Promise<boolean>}
   */
  doLogout(): Promise<boolean> {
    return this.http.post(this.logoutURL, {}, {headers: this.getTokenHeader()}).toPromise().then(res => {
      res = res.json();
      if (res["status"] === 200) {
        this.removeToken();
        return true;
      }
      return false;
    });
  }

  /**
   * Liest den Serverstatus (Startdatum, Anzahl der fehlgeschlagenen Log-ins) aus
   */
  getServerStatus(): void {
    this.http.get(this.statusURl, {headers: this.getTokenHeader()}).toPromise().then(res => {
      res = res.json();
      if (res["status"] === 200) {
        this.server_start = res["date"] as Date;
        this.failed_logins = res["failed"] as number;
      }
    });
  }


  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string {
    if (this.token) {
      return this.token;
    }
    return null;
  }
}
