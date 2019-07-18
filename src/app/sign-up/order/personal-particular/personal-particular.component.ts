import { Component, Host, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import * as moment from 'moment';
import * as _ from 'lodash';
import { RecaptchaComponent } from 'ng-recaptcha';
import { LocalStorage } from '@ngx-pwa/local-storage';

import {
  IdentificationType, ConfigService, UtilService, IDENTIFICATION_TYPE_OPTIONS,
  ModalService, GoogleTagManagerService
} from '@app/core';
import { OrderComponent } from '../order.component';
import { STORAGE_KEYS, ORDER_ROUTES, ORDER_GA_EVENT_NAMES } from '../order.constant';

const IDENTIFICATION_EXPIRY_DATE_CONFIG = {
  minMonthsFromToday: 6
};
const OTP_SEND_LIMIT = 5;
const OTP_WARNING = 'You have {{otp_send_remain}} attempts remain';
const OTP_ERROR_MESSAGE = 'Incorrect input OTP {{otp_send_limit}} times, please back to sign up again';

@Component({
  selector: 'app-personal-particular',
  templateUrl: './personal-particular.component.html',
})
export class PersonalParticularComponent implements OnInit {

  @ViewChild('mobileRC') mobileReCaptcha: RecaptchaComponent;

  IdentificationType = IdentificationType;
  IDENTIFICATION_TYPE_OPTIONS = IDENTIFICATION_TYPE_OPTIONS;

  @ViewChild('validateOTP') validateOTP: any;

  config = { bootstrap: null, validationRegex: null };

  minExpiryDate = moment(new Date()).add(IDENTIFICATION_EXPIRY_DATE_CONFIG.minMonthsFromToday, 'month').toDate();

  confirmEmailValue = '';

  mobileVerification = {
    otp: '',
    messageId: '',
  };

  verificationProgress: 'pending' | 'doing' | 'success' | 'fail' = 'pending';
  verificationFailCount = 0;

  errorMessage = '';
  warningMessage = '';

  verifiedMobileNo = '';
  recaptchaResponse = '';

  constructor(
    @Host() public parent: OrderComponent,
    public modal: ModalService,
    private utilService: UtilService,
    private localStorage: LocalStorage,
    private router: Router,
    private route: ActivatedRoute,
    private gtagService: GoogleTagManagerService,
    configService: ConfigService,
  ) {
    this.config.bootstrap = configService.get('bootstrap');
    this.config.validationRegex = configService.get('validationRegex');
  }

  ngOnInit() {
    this.localStorage.getItem<number>(STORAGE_KEYS.VERIFYING_OTP_COUNT).subscribe(count => {
      this.verificationFailCount = count || 0;
    });
  }

  isEmailConfirmed() {
    return (this.parent.model.email === this.confirmEmailValue);
  }

  isMobileNoVerified() {
    return !_.isEmpty(this.parent.token) && (this.verifiedMobileNo === this.parent.model.mobileNo);
  }

  onExpiryDateChange(value) {
    const date = value ? moment(value).format(this.config.bootstrap.datePicker.dateInputFormat) : '';
    if (date !== this.parent.model.identificationExpiryDate) {
      this.parent.model.identificationExpiryDate = date;
    }
  }

  isOTPExpired(): boolean {
    return this.verificationFailCount >= OTP_SEND_LIMIT;
  }

  onSubmit(form) {
    if (form.valid && this.isEmailConfirmed() && this.isMobileNoVerified()) {
      if (!_.includes([IdentificationType.EmploymentPass, IdentificationType.WorkPermit], this.parent.model.identificationType)) {
        this.parent.model.identificationExpiryDate = '';
      }
      this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.ENTER_YOUR_DETAIL_2);
      this.parent.saveAndNext();
    }
  }

  requestOTP = (captchaResponse: string) => {
    if (!captchaResponse) {
      return;
    }

    if (this.recaptchaResponse !== captchaResponse) {
      this.recaptchaResponse = captchaResponse;
    }

    this.verificationProgress = 'pending';
    this.errorMessage = '';
    this.mobileVerification.otp = '';
    this.utilService.requestOtp({ mobile: this.parent.model.mobileNo, recaptcha: this.recaptchaResponse }).subscribe(
      rs => {
        const modalConfig: { [key: string]: any } = {
          events: {
            onHidden: (reason: string) => this.isOTPExpired() ? this.redirect() : this.mobileReCaptcha.reset()
          },
        };
        this.mobileVerification.messageId = rs.data.message_id;
        this.modal.config(modalConfig).open(this.validateOTP, 'lg', { class: 'mt-5 pt-5', ignoreBackdropClick: true });
      },
      error => {
        this.parent.openErrorModal('Errors', 'Mobile number is invalid format.');
        this.mobileReCaptcha.reset();
      }
    );
  }

  verifyOTP = () => {
    if (this.mobileVerification.otp) {
      this.utilService
        .verifyOtp({
          otp: this.mobileVerification.otp,
          mobile: this.parent.model.mobileNo,
          message_id: this.mobileVerification.messageId,
        })
        .subscribe(
          (data) => {
            this.parent.token = data.data.token;
            this.verificationProgress = 'success';
            this.verifiedMobileNo = this.parent.model.mobileNo;
            this.modal.hide();
          },
          (error) => {
            this.errorMessage = error.message;
            this.verificationProgress = 'fail';
            this.verificationFailCount++;
            this.localStorage.setItem(STORAGE_KEYS.VERIFYING_OTP_COUNT, this.verificationFailCount).subscribe();
            if (this.isOTPExpired()) {
              this.parent.clearLocalStorage();
              this.warningMessage = error.E_LOCKED_SESSION
                || OTP_ERROR_MESSAGE.replace('{{otp_send_limit}}', String(OTP_SEND_LIMIT));
            } else if (this.verificationFailCount > 2) {
              this.warningMessage = OTP_WARNING.replace('{{otp_send_remain}}', String(OTP_SEND_LIMIT - this.verificationFailCount));
            }
          }
        );
    } else {
      this.verificationProgress = 'doing';
    }
  }

  resendOTP() {
    this.mobileReCaptcha.reset();

    setTimeout(() => {
      this.mobileReCaptcha.execute();
    }, 1000);
  }

  redirect() {
    this.modal.hide();
    this.router.navigate([ '..', ORDER_ROUTES.PLAN_DETAIL ], { relativeTo: this.route }).then(() => location.reload());
  }
}
