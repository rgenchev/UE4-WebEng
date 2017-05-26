import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AccessService} from '../services/access.service';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'my-login',
  templateUrl: '../views/login.html'
})
export class LoginComponent {

  loginError: boolean = false;

  constructor(private router: Router, private accessService: AccessService) {
  }

  onSubmit(form: NgForm): void {

    if (!form || !form.value || !form.value["username"] || !form.value["password"]) {
      this.loginError = true;
    }

    this.accessService.doLogin(form.value["username"], form.value["password"]).then(successfully => {
      this.loginError = !successfully;
      if (successfully) {
        this.router.navigate(['overview']);
      }
    });

  }
}
