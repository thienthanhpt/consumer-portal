import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

import * as _ from 'lodash';

import { AuthService, ErrorResponse, ModalService } from '@app/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {

  formGroup: FormGroup;
  loading = false;
  errorMessage: string;
  successMessage: string;

  constructor(public modal: ModalService,
              private authService: AuthService,
              private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    this.formGroup = this.fb.group({
      email: ['', Validators.required],
      login_id: ['', Validators.required],
    });
  }

  submit() {
    if (!this.formGroup.invalid) {

      const email = this.formGroup.get('email').value;
      const login_id = this.formGroup.get('login_id').value;
      const url = document.location.host + '/create-new-password';
      this.loading = true;
      this.errorMessage = null;
      // this.authService.forgotPassword(email, login_id, url);
      this.authService.forgotPassword(email, login_id, url).subscribe((res) => {
        console.log(res);
        this.successMessage = _.get(res, 'message', 'We just sent you the link to your email');
      }, (error) => {
        this.errorMessage = 'Username or email is invalid.';
      });
    } else {
      this.errorMessage = 'Username or email is invalid.';
    }

  }

  verifyUsername() {
    if (this.formGroup.invalid) {
      if (!this.formGroup.controls['login_id'].value) {
        this.errorMessage = 'Username is required.';
      }
    } else {
      this.errorMessage = '';
    }
  }

  verifyLoginId() {
    if (this.formGroup.invalid) {
      if (!this.formGroup.controls['email'].value) {
        this.errorMessage = 'Email is required.';
      } else if (this.formGroup.controls['email'].invalid) {
        this.errorMessage = 'Email is invalid format.';
      }
    } else {
      this.errorMessage = '';
    }
  }
}
