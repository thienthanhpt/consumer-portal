import { Component, DoCheck, OnInit, ViewChild } from '@angular/core';

import { RecaptchaComponent } from 'ng-recaptcha';
import { LocalStorage } from '@ngx-pwa/local-storage';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';

import {
  ConfigService,
  ETC_FEE_OPTIONS,
  ModalService,
  MyAccountService,
  ProductType,
  PromotionTemplate,
  UtilService,
  MyAccount,
  AuthService,
  LoaderService, PaymentSessionRequest, TransactionService, Transaction, PaymentCard, TransactionStatus, Consumer
} from '../../../core/index';
import {STORAGE_KEYS} from '@app/my-account/my-account.constant';

declare let Checkout: any;

const OTP_SEND_LIMIT = 5;
const OTP_WARNING = 'You have {{otp_send_remain}} attempts remain';

export function handleHostedCheckout(transaction: Transaction) {
  const el = document.querySelector('#paymentElement');
  if (!el) {
    const paymentScriptElement = document.createElement('script');
    paymentScriptElement.type = 'text/javascript';
    paymentScriptElement.src = 'https://ap-gateway.mastercard.com/checkout/version/51/checkout.js';
    paymentScriptElement.setAttribute('id', 'paymentElement');
    paymentScriptElement.onload = function() {
      Checkout.configure({
        merchant: transaction.paymentInfo.merchantId,
        order: {
          currency: 'SGD',
          description: transaction.otherInformation,
        },
        interaction: {
          merchant: {
            name: transaction.paymentInfo.name
          },
          displayControl : {
            billingAddress : 'HIDE'
          }
        },
        session: {
          id: transaction.paymentInfo.sessionId
        },
        transaction: {
          reference: transaction.transactionId
        }
      });
      Checkout.showPaymentPage();
    };
    document.body.appendChild(paymentScriptElement);
  } else {
    Checkout.configure({
      merchant: transaction.paymentInfo.merchantId,
      order: {
        currency: 'SGD',
        description: 'Pay bill',
      },
      interaction: {
        merchant: {
          name: transaction.paymentInfo.name
        },
        displayControl : {
          billingAddress : 'HIDE'
        }
      },
      session: {
        id: transaction.paymentInfo.sessionId
      },
      transaction: {
        reference: transaction.transactionId
      }
    });
    Checkout.showPaymentPage();
  }
}

@Component({
  selector: 'app-my-details',
  templateUrl: './my-details.component.html',
  styleUrls: [ './my-details.component.scss' ]
})
export class MyDetailsComponent implements DoCheck, OnInit {

  @ViewChild('mobileRC') mobileReCaptcha: RecaptchaComponent;
  // @ViewChild('validateOTP') validateOTP: any;
  @ViewChild('errorModal') errorModal: any;
  @ViewChild('warningModal') warningModal: any;
  @ViewChild('paymentModal') paymentModal: any;
  @ViewChild('alertModal') alertModal: any;
  @ViewChild('timeoutModal') timeoutModal: any;
  @ViewChild('notificationChangeCardMethodModal') notificationChangeCardMethodModal: any;
  @ViewChild('warningRecurringServiceModal') warningRecurringServiceModal: any;

  paymentTimeout = 10;
  account: MyAccount = new MyAccount();
  customerFieldMapInput = {};
  isDotPlan = true;
  recaptchaResponse = '';
  verificationProgress: 'pending' | 'doing' | 'success' | 'fail' = 'pending';
  verificationFailCount = 0;
  errorMessage = '';
  mobileVerification = {
    otp: '',
    messageId: '',
  };
  copyText = 'Copy';
  errorModalMessage = '';
  warningMessage = '';
  config = { bootstrap: null, validationRegex: null, dateTimeFormat: null };
  mobileNoPattern: RegExp;
  postalCodePattern: RegExp;
  isUpdatingMobileNo = false;
  customerFieldsUpdateRs = {};
  indexConsumerSelected = 0;
  consumerSelected: Consumer = null;
  selectedConsumerId: number = null;
  sharedUrl = 'https://www.sunseap.com/residential/electricity-plans/';
  sharedText = 'Take the first step to being powered by Solar and enjoy $20 off from your electricity bill';
  emailContent = '';
  warningHeader = '';
  isRecurringMethodSettedUp = true;
  cardList: PaymentCard[] = null;
  isUpdateRecurringSuccess = true;
  errorMessageUserIdInvalid = '';
  userIdBeforeChange = '';
  isLoadingRecurringMethod = false;
  isDBSCard = false;

  constructor(
    public loaderService: LoaderService,
    public modal: ModalService,
    private accountService: MyAccountService,
    private utilService: UtilService,
    private configService: ConfigService,
    private localStorage: LocalStorage,
    private authService: AuthService,
    private router: Router,
    private transactionService: TransactionService,
    private activeRoute: ActivatedRoute
  ) {
    this.config.validationRegex = configService.get('validationRegex');
    this.config.dateTimeFormat = configService.get('dateTimeFormat');
    this.mobileNoPattern = new RegExp(this.config.validationRegex.mobileNo);
    this.postalCodePattern = new RegExp(this.config.validationRegex.postalCode);
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(params => {
      if (params['resultIndicator']) {
        this.localStorage.getItem<{ [name: string]: any }>(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe(result => {
          if (result) {
            const { successIndicator, sessionId } = result.paymentInfo;
            const { transactionId, consumerId, isAutoDeduct, isSinglePayment } = result;

            if (params['resultIndicator'] === successIndicator) {
              setTimeout(() => {
                this.modal.open(this.alertModal, 'md', { ignoreBackdropClick: false });
              }, 1000);

              this.localStorage.removeItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe();

              const submittedTransactionRQ = {
                consumer_id: consumerId,
                transactionid: transactionId,
                status: TransactionStatus.Submitted
              };

              if (!isSinglePayment) {
                const createTokenRQ = {
                  consumer_id: consumerId,
                  session_id: sessionId,
                  transactionid: transactionId,
                  is_auto_deduct: isAutoDeduct
                };

                this.transactionService.createToken(createTokenRQ).subscribe(() => {
                  this.transactionService.changeTransactionStatus(submittedTransactionRQ).subscribe();
                });

              } else {
                this.transactionService.changeTransactionStatus(submittedTransactionRQ).subscribe();
              }
            }
          }
        });
      }
    });
    const urlHash = window.location.hash;
    if (urlHash && urlHash.indexOf('hc-action-timeout') >= 0) {// transaction timeout
      setTimeout(() => {
        this.modal.open(this.timeoutModal, 'md', { ignoreBackdropClick: false });
      }, 1000);
      this.localStorage.getItem<{ [name: string]: any }>(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe(result => {
        const { transactionId, consumerId } = result;

        this.localStorage.removeItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION).subscribe();

        const cancelledTransactionRQ = {
          consumer_id: consumerId,
          transactionid: transactionId,
          status: TransactionStatus.Cancelled
        };
        this.transactionService.changeTransactionStatus(cancelledTransactionRQ).subscribe();
      });
    }
  }

  closeAlertModal() {
    this.modal.hide();
    setTimeout(() => {
      window.location.reload(); // Recurring card does not show up after payment success
    }, 1000); // Solution is refresh after 1s
  }

  ngDoCheck() {
    this.localStorage.getItem(STORAGE_KEYS.SELECTED_CONSUMER_ID).subscribe(id => {
      if (_.isEqual(this.selectedConsumerId, id)) {
        return;
      } else {
        this.selectedConsumerId = id;
        this.getCurrentAccount(id);
      }
    });
  }

  // Get all card payment
  getCardList(consumerId: number, cardIdOpening: number) {
    this.transactionService.fetchCards(consumerId).subscribe(
      (cards) => {
        if (cards) {
          this.cardList =  _.filter(cards, (card: PaymentCard) => !_.isEmpty(card.cardNo)).map((item) => {
            item.displayNo = 'xxxx-xxxx-xxxx-' + item.cardNo.substr(item.cardNo.length - 4, 4);

            if (item.isAutoDeduct) {
              if (item.cardId !== cardIdOpening) {
                item.isAutoDeduct = false;
              }
            }

            if (item.cardId === cardIdOpening) {
              item.isAutoDeduct = this.consumerSelected.contract.isAutoDeduct;
            }

            if (item.paymentMode && item.paymentMode.includes('DBS')) {
              this.isDBSCard = true;
            } else {
              this.isDBSCard = false;
            }
            return item;
          });
        }
      },
      (err) => {
        this.openErrorModal(err.message);
      }
    );
  }

  getCurrentAccount(id: number) {
    this.loaderService.loading();

    this.accountService.fetchAccount().subscribe(data => {
      this.loaderService.done();
      this.account = data;
      this.indexConsumerSelected = _.findIndex(data.customer.consumers, { id: id });

      if (this.indexConsumerSelected !== -1) {
        this.consumerSelected = data.customer.consumers[this.indexConsumerSelected];

        // If Recurring Method not yet setup, Payment Mode UI block isn't display list card.
        if (data.customer.consumers[this.indexConsumerSelected].contract
          && !data.customer.consumers[this.indexConsumerSelected].contract.paymentMode.cardId) {
          this.isRecurringMethodSettedUp = false;
        } else {
          this.isRecurringMethodSettedUp = true;
        }

        this.isDotPlan = _.lowerCase(this.consumerSelected.contract.productType) === ProductType.Dot;
        const referralCode = this.consumerSelected.referralCode;

        if (!_.isEmpty(referralCode)) {
          this.sharedText = this.sharedText.concat(', thanks to my referral code ' + referralCode + '.');
          this.emailContent = encodeURIComponent(this.sharedText);
        }
      }

      this.getCardList(id, this.consumerSelected.contract.paymentMode.cardId);

    });
  }

  getDiscountAmount(amount: number) {
    return (amount > 0) ? amount : 20;
  }

  // TODO: Use for validate when allow edit fields on Customer block, can remove if not enable this fields.
  // validatePostalCode(postal: any) {
  //   if (!this.isPostalCodeValid(postal.value)) {
  //     if (_.isEmpty(postal.value)) {
  //       this.warningMessage = 'Postal code is required.';
  //     } else {
  //       this.warningMessage = 'Postal code must contains 6 digits.';
  //     }
  //     this.warningHeader = 'Postal Code';
  //     this.modal.open(this.warningModal, 'md', { ignoreBackdropClick: true });
  //   }
  //   this.updateCustomer('postal', postal);
  // }
  //
  // isPostalCodeValid(code: string): boolean {
  //   const postalCodePattern = new RegExp(this.config.validationRegex.postalCode);
  //   if (_.isEmpty(code) || !postalCodePattern.test(code)) {
  //     return false;
  //   }
  //   return true;
  // }

  // validateAddress(address: any) {
  //   if (_.isEmpty(address.value)) {
  //     this.warningMessage = 'Billing address is required.';
  //     this.warningHeader = 'Billing Address';
  //     this.modal.open(this.warningModal, 'md', { ignoreBackdropClick: false });
  //   }
  //   this.updateCustomer('address', address);
  // }

  handleRecurringPayment() {
    this.isLoadingRecurringMethod = true;
    this.paymentTimeout = 10;
    const paymentRQ = new PaymentSessionRequest();
    paymentRQ.paidAmount = 1;
    paymentRQ.date = moment().format(this.config.dateTimeFormat.completeDateTimeISOFormat);
    paymentRQ.paymentGateway = 'ocbc';
    paymentRQ.consumerId = this.selectedConsumerId;
    paymentRQ.returnUrl = window.location.origin + '/details';
    paymentRQ.voidable = true;
    let paymentSession = null;

    this.transactionService.getTransactionSession(paymentRQ).subscribe(
      (rs) => {
        this.isLoadingRecurringMethod = false;
        paymentSession = rs;
        rs.consumerId = paymentRQ.consumerId;
        rs.isAutoDeduct = true;

        // save this info for later request payment token
        this.localStorage.setItem(STORAGE_KEYS.PAYMENT_VALIDATION_SESSION, rs).subscribe();
        this.modal.open(this.paymentModal, 'md', { ignoreBackdropClick: true });

        const interval = setInterval(() => {
          this.paymentTimeout--;
          if (this.paymentTimeout === 0) {
            clearInterval(interval);
            if (paymentSession) {
              paymentSession.otherInformation = 'Verification';
              handleHostedCheckout(paymentSession);
              this.modal.hide();
            }
          }
        }, 1000);
      },
      (error) => {
        this.isLoadingRecurringMethod = false;
        this.openWarningModal(error.message);
      });

  }

  copyReferralCode(referralCode: any) {
    this.copyText = 'Copied';
    referralCode.select();
    document.execCommand('copy');
    referralCode.setSelectionRange(0, 0);
  }

  endCopyReferrallCode() {
    this.copyText = 'Copy';
  }

  // TODO: Current not use, can remove it.
  // getEarlyterminationCharge(dwellingType: string) {
  //   if (!dwellingType || !ETC_FEE_OPTIONS[ dwellingType ]) {
  //     return '';
  //   }
  //   return 'S$ ' + ETC_FEE_OPTIONS[ dwellingType ] + ' per remaining month';
  // }

  singCurrencyFormat(dispositAmount: number) {
    if (!dispositAmount) {
      return 'S$ 0.00';
    }
    return 'S$ ' + dispositAmount.toFixed(2);
  }

  updateCustomer(fieldName: string, input: any) {
    this.customerFieldMapInput[ fieldName ] = false;

    if (this.account.customer[ fieldName ] !== input.value) {

      const customer = _.cloneDeep(this.account.customer);
      customer[ fieldName ] = input.value;

      this.accountService.updateCustomer(customer, [ fieldName ])
        .subscribe(rs => {

          this.account.customer[ fieldName ] = rs[ fieldName ];
          this.isUpdatingMobileNo = false;
          this.customerFieldsUpdateRs[ fieldName ] = true;

          setTimeout( () => {
            this.customerFieldsUpdateRs[ fieldName ] = false;
          }, 3000);

        });
    }
  }

  // TODO: Use for validate when allow edit fields on Customer block, can remove if not enable this fields.
  // isValidMobileNo(mobileNo: string): boolean {
  //   const mobileNoPattern = new RegExp(this.config.validationRegex.mobileNo);
  //   if (_.isEmpty(mobileNo) || !mobileNoPattern.test(mobileNo)) {
  //     return false;
  //   }
  //   return true;
  // }

  /**
   * TODO: Present is not allow edit / update
   * Request OTP when edit some on details myaccount
   */
  // requestOTP = (captchaResponse: string, mobileNoInput: any) => {
  //   if (!captchaResponse) {
  //     return;
  //   }
  //
  //   if (this.recaptchaResponse !== captchaResponse) {
  //     this.recaptchaResponse = captchaResponse;
  //   }
  //
  //   this.verificationProgress = 'pending';
  //   this.errorMessage = '';
  //   this.mobileVerification.otp = '';
  //   this.utilService.requestOtp({ mobile: mobileNoInput.value, recaptcha: this.recaptchaResponse }).subscribe(
  //     rs => {
  //       const modalConfig: { [ key: string ]: any } = {
  //         events: {
  //           onHidden: (reason: string) => {
  //             this.isUpdatingMobileNo = false;
  //             if (!this.isOTPExpired()) {
  //               this.mobileReCaptcha.reset();
  //             }
  //           }
  //         },
  //       };
  //       this.mobileVerification.messageId = rs.data.message_id;
  //       this.modal.config(modalConfig).open(this.validateOTP, 'lg', { class: 'mt-5 pt-5', ignoreBackdropClick: true });
  //     },
  //     error => {
  //       this.openErrorModal(error.message);
  //       this.mobileReCaptcha.reset();
  //     }
  //   );
  // }
  // updateCustomerMobileNo(input: any) {
  //   if (!this.isValidMobileNo(input.value)) {
  //     return;
  //   }
  //   if (this.account.customer[ 'mobileNo' ] === input.value) {
  //     this.customerFieldMapInput[ 'mobileNo' ] = false;
  //     return;
  //   }
  //   this.isUpdatingMobileNo = true;
  //   this.mobileReCaptcha.execute();
  // }
  //
  // requestOTP = (captchaResponse: string, mobileNoInput: any) => {
  //   if (!captchaResponse) {
  //     return;
  //   }
  //
  //   if (this.recaptchaResponse !== captchaResponse) {
  //     this.recaptchaResponse = captchaResponse;
  //   }
  //
  //   this.verificationProgress = 'pending';
  //   this.errorMessage = '';
  //   this.mobileVerification.otp = '';
  //   this.utilService.requestOtp({ mobile: mobileNoInput.value, recaptcha: this.recaptchaResponse }).subscribe(
  //     rs => {
  //       const modalConfig: { [ key: string ]: any } = {
  //         events: {
  //           onHidden: (reason: string) => {
  //             this.isUpdatingMobileNo = false;
  //             if (!this.isOTPExpired()) {
  //               this.mobileReCaptcha.reset();
  //             }
  //           }
  //         },
  //       };
  //       this.mobileVerification.messageId = rs.data.message_id;
  //       this.modal.config(modalConfig).open(this.validateOTP, 'lg', { class: 'mt-5 pt-5', ignoreBackdropClick: true });
  //     },
  //     error => {
  //       this.openErrorModal(error.message);
  //       this.mobileReCaptcha.reset();
  //     }
  //   );
  // }

  verifyOTP = (mobileNoInput: any) => {
    if (this.mobileVerification.otp) {
      this.utilService
        .verifyOtp({
          otp: this.mobileVerification.otp,
          mobile: mobileNoInput.value,
          message_id: this.mobileVerification.messageId,
        })
        .subscribe(
          (data) => {
            this.verificationProgress = 'success';
            this.updateCustomer('mobileNo', mobileNoInput);
            this.modal.hide();
          },
          (error) => {
            this.errorMessage = error.message;
            this.verificationProgress = 'fail';
            this.verificationFailCount++;
            this.localStorage.setItem(STORAGE_KEYS.VERIFYING_OTP_COUNT, this.verificationFailCount).subscribe();
            if (this.isOTPExpired()) {
              this.modal.hide();
              this.clearLocalStorage();
              this.authService.logout();
            } else {
              this.warningMessage = OTP_WARNING.replace('{{otp_send_remain}}', String(OTP_SEND_LIMIT - this.verificationFailCount));
            }
          }
        );
    } else {
      this.verificationProgress = 'doing';
    }
  }

  clearLocalStorage() {
    _.each(STORAGE_KEYS, key => this.localStorage.removeItem(key).subscribe());
  }

  isOTPExpired(): boolean {
    return this.verificationFailCount >= OTP_SEND_LIMIT;
  }

  resendOTP() {
    this.mobileReCaptcha.reset();

    setTimeout(() => {
      this.mobileReCaptcha.execute();
    }, 1000);
  }

  openErrorModal(message, config?: { [ key: string ]: any }) {
    const modal = config ? this.modal.config(config) : this.modal;
    this.errorModalMessage = message;
    modal.open(this.errorModal, 'md', { ignoreBackdropClick: true });
  }

  openWarningModal(message, config?: { [ key: string ]: any }) {
    const modal = config ? this.modal.config(config) : this.modal;
    this.errorModalMessage = message;
    modal.open(this.warningRecurringServiceModal, 'md', { ignoreBackdropClick: true });
  }

  updateUserID(fieldName: string, userId: any) {
    if (!this.userIdBeforeChange) {
      this.userIdBeforeChange = this.account.userId;
    }

    this.account.userId = userId.value;
    this.accountService.update(this.account, [ fieldName ]).subscribe(
      () => {
        this.errorMessageUserIdInvalid = '';
        this.userIdBeforeChange = '';
        this.customerFieldMapInput[ fieldName ] = false;
        userId.blur();
      },
      (error) => {
        this.errorMessageUserIdInvalid = 'The User ID is already in used.';
      }
    );
  }

  updateAccount(fieldName: string) {
    this.accountService.update(this.account, [ fieldName ]).subscribe();
  }

  updateAccountByCheckbox(fieldName: string, value: boolean) {// problem related to input which is blank by default
    this.account[ fieldName ] = value;
    this.updateAccount(fieldName);
  }

  // TODO: Use for validate when allow edit fields on Customer block, can remove if not enable this fields.
  // editCustomer(fieldName: string, input: any) {
  //   this.customerFieldMapInput[ fieldName ] = true;
  //   input.focus();
  // }

  cancelUpdateCustomer(fieldName: string, input: any) {
    if (this.isUpdatingMobileNo) {
      return;
    }
    input.value = this.account.customer[ fieldName ];
    this.customerFieldMapInput[ fieldName ] = false;
  }

  onCustomerChanged(event: any, fieldName: string, input: any) {
    if (event.key === 'Enter') {
      this.updateCustomer(fieldName, input);
    }
  }

  validateUserIdInput(event: any, input: any) {
    if (event.key === ' ' || event.key === 'Spacebar') {
      input.value = _.trim(input.value);
      event.preventDefault();
    }
  }

  // TODO: Use for validate when allow edit fields on Customer block, can remove if not enable this fields.

  // onCustomerAddressChanged(event: any, input: any) {
  //   if (event.key === 'Enter') {
  //     this.validateAddress(input);
  //   }
  // }
  //
  // onCustomerMobileNoChanged(event: any, input: any) {
  //   if (event.key === 'Enter') {
  //     this.updateCustomerMobileNo(input);
  //   }
  // }
  //
  // onPostalCodeChanged(event: any, input: any) {
  //   if (event.key === 'Enter') {
  //     this.validatePostalCode(input);
  //   }
  // }

  onChangeToggleRecurring(card: PaymentCard) {
    this.isLoadingRecurringMethod = true;
    const paymentCardListBeforeChange = _.cloneDeep(this.cardList);
    if (card.isAutoDeduct) {
      this.cardList.map(paymentCard => {
        if (!_.isEqual(paymentCard, card)) {
          paymentCard.isAutoDeduct = false;
        }
      });
    }
    this.transactionService.changedCardRecurringPayment(this.selectedConsumerId, card).subscribe(
      paymentCardListResponse => {
        this.isLoadingRecurringMethod = false;
        this.getCurrentAccount(this.selectedConsumerId);
        this.isUpdateRecurringSuccess = true;
        this.modal.open(this.notificationChangeCardMethodModal, 'md');
      },
      err => {
        this.isLoadingRecurringMethod = false;
        this.isUpdateRecurringSuccess = false;
        this.modal.open(this.notificationChangeCardMethodModal, 'md');
        this.cardList = paymentCardListBeforeChange;

        const cardChange = _.find(this.cardList, { cardId: card.cardId });
        cardChange.isAutoDeduct = !cardChange.isAutoDeduct;
      }
    );
  }
}
