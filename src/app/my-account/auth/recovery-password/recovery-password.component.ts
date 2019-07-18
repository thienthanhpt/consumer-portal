import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { AuthService, ConfigService, ModalService } from '@app/core';

@Component({
  selector: 'app-recovery-password',
  templateUrl: './recovery-password.component.html'
})
export class RecoveryPasswordComponent implements OnInit {

  @ViewChild('confirmModal') confirmModal: any;

  config = { validationRegex: null };
  loading = false;
  formErrorMessage: string;
  errorMessage: string;
  successMessage: string;
  data = {
    newPassword: '',
    confirmPassword: '',
    token: '',
    url: document.location.host + '/create-new-password'
  };

  errors = {
    invalidToken: 'Invalid token.',
    expiredToken: 'For security, this link has been expired. Please regenerate a new link.'
  };

  constructor(public modal: ModalService,
              private router: Router,
              private route: ActivatedRoute,
              private authService: AuthService,
              private configService: ConfigService) {
    this.config.validationRegex = configService.get('validationRegex');
  }

  ngOnInit() {
    this.data.token = _.get(this.route.snapshot.queryParams, 'token');
    this.authService.validateToken(this.data.token).subscribe(null, (err) => {
      this.openMessageModal(false, _.get(err, 'message', 'Invalid token.'));
    });
  }

  openMessageModal(isSuccess: boolean, message: string) {
    if (isSuccess) {
      this.successMessage = message;
    } else {
      this.errorMessage = message;
    }

    const modalConfig: { [ key: string ]: any } = {
      events: {
        onHidden: (reason: string) => this.backToLogin()
      },
    };
    this.modal.config(modalConfig).open(this.confirmModal, 'md');
  }

  backToLogin() {
    this.router.navigate(['/login']);
    if (this.modal) {
      this.modal.hide();
    }
  }

  generatePasswordResetUrl() {
    this.errorMessage = '';
    const { token, url } = this.data;
    this.authService.regeneratePasswordResetUrl(token, url).subscribe( (res) => {
      this.openMessageModal(true, _.get(res, 'message', 'Regenerate Password Reset Url successfully'));
    }, (err) => {
      this.openMessageModal(false, _.get(err, 'message', 'An unknown error has occurred. Please try again.'));
    });
  }

  submit(form) {
    if (form.invalid) {
      return;
    }

    if (this.data.newPassword !== this.data.confirmPassword) {
      this.formErrorMessage = 'Your confirm password does not match.';
      return;
    }

    this.formErrorMessage = null;
    this.loading = true;
    const { token, newPassword } = this.data;

    this.authService.resetPassword(token, newPassword).subscribe((res) => {
      this.openMessageModal(true, _.get(res, 'message', 'Recover your password successfully!'));
    }, (err) => {
      if (_.get(err, 'code') === 'E_PASSWORD_SAME_WITH_LAST') {
        this.formErrorMessage = _.get(err, 'message', 'You have entered your old password.');
        this.loading = false;
      } else {
        this.openMessageModal(false, _.get(err, 'message', 'An unknown error has occurred. Please try again.'));
      }
    });
  }

}
