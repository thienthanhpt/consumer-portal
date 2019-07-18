import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppOptions, BaseModel, BaseService, HEADER_NEED_CREDENTIALS, SuccessResponse } from './base.service';
import { PaymentCard, PromotionTemplate } from '@app/core';

const PROMOTION_FIELD_MAP = {
  createDate: 'created_date', lastModifiedDate: 'last_modified_date', code: 'code', isExpired: 'is_expired', expiredDate: 'expired_date',
  issuedDate: 'issued_date', actualUsedDate: 'actual_used_date', issuer: 'issuer', promotionType: 'promotion_type',
  calculationType: 'calculation_type', usageCount: 'usage_count', promotionTemplatesData: 'promotion_template',
  planRateType: 'plan_rate_type', planRateValue: 'plan_rate_value', applyingPeriod: 'applying_periods'
};

export class Promotion extends BaseModel {
  createDate: string = null;
  lastModifiedDate: string = null;
  code: string = null;
  isExpired: boolean = false;
  expiredDate: string = null;
  issuedDate: string = null;
  actualUsedDate: string = null;
  issuer: string = null;
  promotionType: string = null;
  calculationType: string = null;
  usageCount: number = null;
  promotionTemplate: PromotionTemplate = null;
  planRateType: string = null;
  planRateValue: number = null;
  applyingPeriod: number = null;

  set promotionTemplatesData(data) {
    this.promotionTemplate = new PromotionTemplate().fromData(data);
  }

  protected getFieldMap() {
    return super.getFieldMap(PROMOTION_FIELD_MAP);
  }
}

const CUSTOMER_FIELD_MAP = {
  address: 'address', country: 'country', customerType: 'c_type', ssAcountNo: 'ss_acc', id: 'cuid',
  emailAddress: 'emailaddress', postal: 'postal', uen: 'uen', gst: 'gst', name: 'customer',
  docType: 'docidtype', mobileNo: 'mobileno', consumersData: 'consumers'
};

export class Customer extends BaseModel {
  address: string = null;
  country: number = null;
  customerType: number = null;
  ssAcountNo: string = null;
  emailAddress: string = null;
  postal: string = null;
  uen: string = null;
  gst: string = null;
  name: string = null;
  docType: string = null;
  mobileNo: string = null;
  consumers: Consumer[] = [];

  protected getFieldMap() {
    return super.getFieldMap(CUSTOMER_FIELD_MAP);
  }

  set consumersData(dataArray: object[]) {
    this.consumers = _.map(dataArray, data => new Consumer().fromData(data));
  }
}

const DISCOUNT_AMOUNT_FIELD_MAP = {
  fixed: 'fixed', percent: 'percent'
};

export class DiscountAmount extends BaseModel {
  fixed: number = null;
  percent: number = null;

  protected getFieldMap() {
    return super.getFieldMap(DISCOUNT_AMOUNT_FIELD_MAP);
  }
}

const CONSUMER_FIELD_MAP = {
  accountNo: 'acc_no', ebsNo: 'ebs_no', address: 'address', mType: 'm_type', id: 'coid',
  meterId: 'meter_id', voltageType: 'v_type', msslNo: 'mssl_no', meterType: 'meter_type', postal: 'postal',
  consumer: 'consumer', referralCode: 'referral_code', contractData: 'contract', discountAmountData: 'discount_amount'
};

export class Consumer extends BaseModel {
  accountNo: string = null;
  ebsNo: string = null;
  address: string = null;
  mType: number = null;
  meterId: string = null;
  voltageType: number = null;
  msslNo: string = null;
  meterType: string = null;
  postal: string = null;
  consumer: string = null;
  referralCode: string = null;
  contract: Contract = null;
  discountAmount: DiscountAmount = null;

  set discountAmountData(data: object) {
    if (!_.isEmpty(data)) {
      this.discountAmount = new DiscountAmount().fromData(data);
    }
  }

  protected getFieldMap() {
    return super.getFieldMap(CONSUMER_FIELD_MAP);
  }

  set contractData(data) {
    this.contract = new Contract().fromData(data);
  }
}

const CONTRACT_FIELD_MAP = {
  pricePlan: 'price_plan', hardCopy: 'hardcopy', address: 'address', createDate: 's_date', id: 'crid', dwellingType: 'dwelling_type',
  paymentTerm: 'p_term', offPeak: 'offpeak', startDate: 'c_date', status: 'contract_status', endDate: 'pe_date',
  depositAmount: 'deposit_amount', postal: 'post_code', contractRef: 'contract_ref', contractTerm: 'c_term', promotionsData: 'promotions',
  actualEndDate: 'ae_date', avg: 'avg_cons', productType: 'product_type', cleanEnergyPercentage: 'clean', paymentModeData: 'payment_mode',
  isAutoDeduct: 'is_auto_deduct'
};

export class Contract extends BaseModel {
  pricePlan: string = null;
  hardCopy = false;
  address: string = null;
  createDate: string = null;
  paymentTerm: string = null;
  offPeak: number = null;
  startDate: string = null;
  status: string = null;
  endDate: string = null;
  postal: string = null;
  contractRef: string = null;
  actualEndDate: string = null;
  avg: number = null;
  dwellingType: string = null;
  productType: string = null;
  depositAmount: number = null;
  contractTerm: string = null;
  cleanEnergyPercentage: string = null;
  promotions: Promotion[] = [];
  paymentMode: PaymentCard = null;
  isAutoDeduct: boolean = null;

  set paymentModeData(data) {
    this.paymentMode = new PaymentCard().fromData(data);
  }

  set promotionsData(datas) {
    datas.forEach(data => {
      this.promotions.push(new Promotion().fromData(data));
    });
  }

  protected getFieldMap() {
    return super.getFieldMap(CONTRACT_FIELD_MAP);
  }
}

const ACCOUNT_FIELD_MAP = {
  identificationNumber: 'uen', contactListSize: 'contactlistsize', newBillEmailNotification: 'nbe',
  newBillSMSNotification: 'nbs', dueBillEmailNotification: 'bde', dueBillSMSNotification: 'bds', contacts: 'contactlist',
  customerData: 'customer', contractData: 'contract', promotionSMSNotification: 'promotion_notify_sms',
  promotionEmailNotification: 'promotion_notify_email', newsletterNotification: 'newsletter_notify', isFirstTimeLoggedIn: 'is_first_time',
  tempPassword: 'temporary_password', userId: 'username'
};

export class MyAccount extends BaseModel {

  // Declare customer for only search, support backend
  identificationNumber: string = null;
  contactListSize: number = null;
  newBillEmailNotification = false;
  newBillSMSNotification = false;
  dueBillEmailNotification = false;
  dueBillSMSNotification = false;
  promotionSMSNotification = false;
  promotionEmailNotification = false;
  newsletterNotification = false;
  isFirstTimeLoggedIn: boolean = null;
  tempPassword: string = null;
  customer: Customer = null;
  userId: string = null;

  set customerData(data) {
    this.customer = new Customer().fromData(data);
  }

  protected getFieldMap() {
    return super.getFieldMap(ACCOUNT_FIELD_MAP);
  }

}

function newAccount(data: object) {
  return new MyAccount().fromData(data);
}

@Injectable()
export class MyAccountService extends BaseService<MyAccount> {

  protected baseUrl = 'account';

  protected newModel = (data: object) => newAccount(data);

  protected getFieldMap() {
    return super.getFieldMap(_.assign({}, ACCOUNT_FIELD_MAP));
  }

  fetchAccount(): Observable<MyAccount> {
    return this.http.get(`${this.baseUrl}/`, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  update(model: MyAccount, updateFields?: string[]): Observable<MyAccount> {
    return this.http.post(`${this.baseUrl}/`, model.toData(updateFields), this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  updateCustomer(model: Customer, updateFields?: string[]): Observable<Customer> {
    return this.http.post(`${this.baseUrl}/customer/`, model.toData(updateFields), this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => new Customer().fromData(rs.data)));
  }

  changePassword(password: string, oldPassword): Observable<MyAccount> {
    const data = { password: password, old_password: oldPassword };
    return this.http.post(`${this.baseUrl}/`, data, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  protected getHttpConfigs = (httpConfigs: AppOptions = {}) => {
    const headerValues: { [ name: string ]: string } = {
      [ HEADER_NEED_CREDENTIALS ]: 'true',
    };
    _.assign(httpConfigs, this.httpConfigs);

    if (!_.isEmpty(httpConfigs)) {
      headerValues[ 'App-Options' ] = JSON.stringify(httpConfigs);
    }

    if (!_.isEmpty(headerValues)) {
      return { headers: headerValues };
    } else {
      return {};
    }
  }
}
