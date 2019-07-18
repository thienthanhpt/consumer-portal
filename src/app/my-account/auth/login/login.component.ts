import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import * as _ from 'lodash';

import { AuthService, ModalService } from '@app/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  @ViewChild('forgotPasswordModal') forgotPasswordModal: any;

  loginForm: FormGroup;
  loading = false;
  errorMessage: string;

  constructor(public modal: ModalService,
              private router: Router,
              private authService: AuthService,
              private fb: FormBuilder) {
    this.createForm();
  }

  createForm() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Username and Password are required!';
      return;
    }

    const formModel = this.loginForm.value;
    this.loading = true;
    this.errorMessage = null;

    this.authService.login(formModel.username, formModel.password).subscribe(() => {
      this.loading = false;
      if (this.authService.isLoggedIn) {
        this.router.navigate(['/details']);
      }
    }, (error) => {
      this.loading = false;
      this.errorMessage = _.get(error, ['error', 'message']) || _.get(error, ['message']);
    });
  }

  openForgotPassword() {
    this.modal.open(this.forgotPasswordModal, 'md');
  }

  goToSignUp() {
    window.location.href = 'https://signup.sunseap.com';
  }

  ngOnInit(): void {
    this.modal.hideAll();
  }

}
