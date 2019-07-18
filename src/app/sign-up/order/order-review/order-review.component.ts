import {Component, ElementRef, Host, OnInit, ViewChild} from '@angular/core';

import { LocalStorage } from '@ngx-pwa/local-storage';

import {
  ConfigService,
  DWELLING_TYPE_OPTIONS,
  ETC_FEE_OPTIONS, GoogleTagManagerService,
  IDENTIFICATION_TYPE_OPTIONS,
  IdentificationType, ModalService,
  PricingPlan,
  ProductType
} from '@app/core';
import { OrderComponent } from '../order.component';
import { ORDER_GA_EVENT_NAMES, STORAGE_KEYS } from '../order.constant';
import * as moment from 'moment';
import * as _ from 'lodash';

const POSTAL_CODE_WARNING = 'The postal code you have entered is currently not eligible for the Open Electricity Market. ' +
  'Please refer to <a href="https://www.openelectricitymarket.sg/index.html" target="_blank">EMA\'s site</a> for more information.';
const IDENTIFICATION_EXPIRY_DATE_CONFIG = {
  minMonthsFromToday: 6
};

@Component({
  selector: 'app-order-review',
  templateUrl: './order-review.component.html',
  styleUrls: [ './order-review.component.scss' ]
})
export class OrderReviewComponent implements OnInit {

  ETC_FEE_OPTIONS = ETC_FEE_OPTIONS;
  IDENTIFICATION_TYPE_OPTIONS = IDENTIFICATION_TYPE_OPTIONS;
  DWELLING_TYPE_OPTIONS = DWELLING_TYPE_OPTIONS;

  @ViewChild('warningModal') warningModal: any;
  // @ViewChild('reviewForm') reviewForm: ElementRef;

  validation = {};

  serviceAddress = { houseNo: '', level: '', unitNo: '', levelUnit: '', streetName: '', buildingName: '' };
  selectedPricingPlan: PricingPlan;
  rebateAmount: number = null;
  acknowledge = false;

  checked = true;
  isDotPlan = false;
  reviewMapInput = {};
  serviceAddressMapInput = {};
  premiseMapInput = {};
  IdentificationType = IdentificationType;
  config = { bootstrap: null, validationRegex: null };
  warningMessage = '';
  minExpiryDate = moment(new Date()).add(IDENTIFICATION_EXPIRY_DATE_CONFIG.minMonthsFromToday, 'month').toDate();
  nationName = 'singapore';

  constructor(
    @Host() public parent: OrderComponent,
    public modal: ModalService,
    private localStorage: LocalStorage,
    private configService: ConfigService,
    private gtagService: GoogleTagManagerService
  ) {
    this.config.bootstrap = configService.get('bootstrap');
    const validationRegex = configService.get('validationRegex');
    this.config.validationRegex = validationRegex;

    this.validation = {
      identificationNo: { isRequired: true, regex: validationRegex.nricNo, message: 'NRIC No / FIN is invalid.' },
      serviceNo: { isRequired: true, regex: validationRegex.spAccountNo, message: 'SP No is invalid.' },
      identificationName: { isRequired: true, regex: null, message: 'Full name is required.' },
      houseNo: { isRequired: true, regex: validationRegex.blockHouseNo,
        message: 'Block/House No is required and contains at least one number.' },
      streetName: { isRequired: true, regex: null, message: 'Street name is required.' },
      levelUnit: { isRequired: false, regex: null, message: null },
      buildingName: { isRequired: false, regex: null, message: null },
      servicePostalCode: { isRequired: true, regex: validationRegex.postalCode, message: POSTAL_CODE_WARNING },
    };
  }

  ngOnInit() {
    this.localStorage.getItem(STORAGE_KEYS.REBATE_AMOUNT)
      .subscribe(rebateAmount => {
        this.rebateAmount = rebateAmount;
      });
    this.localStorage.getItem(STORAGE_KEYS.SERVICE_ADDRESS)
      .subscribe(serviceAddress => serviceAddress && (this.serviceAddress = serviceAddress));
    this.localStorage.getItem<PricingPlan>(STORAGE_KEYS.PRICING_PLAN)
      .subscribe(selectedPricingPlan => {
        if (selectedPricingPlan) {
          this.selectedPricingPlan = selectedPricingPlan;
          this.isDotPlan = (selectedPricingPlan.productType === ProductType.Dot);
        }
      });
  }

  validate(fieldName: string, input: HTMLInputElement) {
    if (this.validation[fieldName].isRequired) {
      const pattern = this.validation[fieldName].regex ? new RegExp(this.validation[fieldName].regex) : null;
      if (pattern && !pattern.test(input.value) || _.isEmpty(input.value)) {
        this.warningMessage = this.validation[fieldName].message;
        this.modal.open(this.warningModal, 'md', { ignoreBackdropClick: false });
        return;
      }
      if (fieldName === 'servicePostalCode'
        && (!moment().isSameOrAfter('2019-05-01') && !_.inRange(+input.value.substring(0, 2), 34, 84)
        || (moment().isSameOrAfter('2019-05-01') && !_.inRange(+input.value.substring(0, 2), 1, 84)))) {
        this.warningMessage = POSTAL_CODE_WARNING;
        this.modal.open(this.warningModal, 'md', {ignoreBackdropClick: false});
        return;
      }
    }
    if (fieldName in this.parent.model) {
      this.updateReview(fieldName, input);
    }
    if (fieldName in this.parent.model.premise) {
      this.updatePremise(fieldName, input);
    }
    if (fieldName in this.serviceAddress) {
      this.updateService(fieldName, input);
    }
  }

  onExpiryDateChange(value) {
    const date = value ? moment(value).format(this.config.bootstrap.datePicker.dateInputFormat) : '';
    if (date !== this.parent.model.identificationExpiryDate) {
      this.parent.model.identificationExpiryDate = date;
    }
  }

  cancelUpdateReview(fieldName: string, input: any) {
    input.value = this.parent.model[ fieldName ];
    this.reviewMapInput[ fieldName ] = false;
  }

  cancelUpdateService(fieldName: string, input: any) {
    input.value = this.serviceAddress[ fieldName ];
    this.serviceAddressMapInput[ fieldName ] = false;
  }

  cancelUpdatePremise(fieldName: string, input: any) {
    input.value = this.parent.model.premise[ fieldName ];
    this.premiseMapInput[ fieldName ] = false;
  }

  updateReview(fieldName: string, input: any) {
    this.parent.model[ fieldName ] = input.value;
    this.reviewMapInput[ fieldName ] = false;
  }

  updateService(fieldName: string, input: any) {
    this.serviceAddress[ fieldName ] = input.value;
    this.serviceAddressMapInput[ fieldName ] = false;
  }

  updatePremise(fieldName: string, input: HTMLInputElement) {
    this.parent.model.premise[ fieldName ] = input.value;
    this.premiseMapInput[ fieldName ] = false;
  }

  isExpiryDateValid() {
    if ((this.parent.model.identificationType === IdentificationType.EmploymentPass
      || this.parent.model.identificationType === IdentificationType.WorkPermit) && _.isEmpty(this.parent.model.identificationExpiryDate)) {
      return false;
    }
    return true;
  }

  onInputChanged(event: any, fieldName: string, input: any) {
    if (event.key === 'Enter') {
      this.validate(fieldName, input);
    }
  }

  onIdTypeChanged(idType: string) {
    if (!this.isExpiryDateValid()) {
      this.warningMessage = 'Expiry date is required.';
      this.modal.open(this.warningModal, 'md', { ignoreBackdropClick: false });
    }
  }

  editService(fieldName: string, input: any) {
    this.serviceAddressMapInput[ fieldName ] = true;
    input.focus();
  }

  editPremise(fieldName: string, input: any) {
    this.premiseMapInput[ fieldName ] = true;
    input.focus();
  }

  editReview(fieldName: string, input: any) {
    this.reviewMapInput[ fieldName ] = true;
    input.focus();
  }

  onSubmit(submitBtn: HTMLInputElement) {
    submitBtn.disabled = true;
    const indexNationName = _.lowerCase(this.serviceAddress.streetName).indexOf(this.nationName);
    if (indexNationName > -1) {
      this.serviceAddress.streetName = this.serviceAddress.streetName
      .replace(this.serviceAddress.streetName.substr(indexNationName - 1, 10), '');
    }
    this.parent.model.premise.serviceAddress = _.chain(this.serviceAddress)
      .pick([ 'houseNo', 'streetName', 'buildingName', 'levelUnit' ])
      .values()
      .without('')
      .join(' ')
      .value();
    this.parent.model.consent = this.checked;
    this.gtagService.sendEvent(ORDER_GA_EVENT_NAMES.REVIEW_ORDER_2);
    this.parent.saveAndNext(submitBtn);
  }
}
