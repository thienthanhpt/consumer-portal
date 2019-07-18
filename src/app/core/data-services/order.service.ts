import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

import { BaseModel, BaseService, SuccessResponse } from './base.service';
import { CustomerType, DwellingType, IdentificationType, ETC_FEE_OPTIONS } from './types';


export const PAYMENT_FIELD_MAP = {
  mode: 'paymentmode', giroAccountName: 'giroaccountname', giroAccountNo: 'giroaccountno', giroContactNo: 'girocontactno',
  giroBankName: 'girobankname', giroBankCode: 'girobankcode', giroSwiftCode: 'giroswiftcode', giroBranchCode: 'girobranchcode',
};

export class Payment extends BaseModel {

  mode: string = null;
  giroAccountName: string = null;
  giroAccountNo: string = null;
  giroContactNo: string = null;
  giroBankName: string = null;
  giroBankCode: string = null;
  giroSwiftCode: string = null;
  giroBranchCode: string = null;

  protected getFieldMap() {
    return super.getFieldMap(PAYMENT_FIELD_MAP);
  }
}

export const ORDER_PREMISE_FIELD_MAP = {
  orderNo: 'ordernumber', serviceNo: 'serviceid', serviceAddress: 'serviceaddress', servicePostalCode: 'postalcode',
  mailingAddress: 'mailingaddress', dwellingType: 'dwellingtype', contractDuration: 'contractduration', loadProfile: 'loadprofile',
  productName: 'productname', startDate: 'startdate', cleanEnergyPercentage: 'cleanenergy', rate: 'rate', contactName: 'contactperson',
  contactDesignation: 'contactdesignation', contactMobileNo: 'contactnumber', contactEmail: 'contactemail', paymentData: 'payment',
  planId: 'priceplan_id'
};

export class OrderPremise extends BaseModel {

  orderNo: string = null;
  serviceNo: string = null;
  serviceAddress: string = null;
  servicePostalCode: string = null;
  mailingAddress: string = null;
  dwellingType: DwellingType = null;
  contractDuration: string = null;
  loadProfile: number = null;
  productName: string = null;
  startDate = '';
  cleanEnergyPercentage: number = null;
  rate: number = null;
  contactName: string = null;
  contactDesignation: string = null;
  contactMobileNo: string = null;
  contactEmail: string = null;
  payment: Payment = null;
  planId: number = null;

  set paymentData(data: object) {
    this.payment = data ? new Payment().fromData(data) : null;
  }
  get paymentData(): object {
    return this.payment ? this.payment.toData() : null;
  }

  get etcFee() {
    return ETC_FEE_OPTIONS[this.dwellingType] || null;
  }

  protected getFieldMap() {
    return super.getFieldMap(ORDER_PREMISE_FIELD_MAP);
  }
}

export const ORDER_FIELD_MAP = {
  mobileNo: 'mobile', email: 'email', customerType: 'customertype', identificationName: 'docidname', identificationNo: 'docid',
  identificationType: 'docidtype', identificationExpiryDate: 'docidexpirydate', companyName: 'companyname', referralCode: 'referral_code',
  premiseData: 'premise', documentIds: 'document_ids', consent: 'consent'
};

export class Order extends BaseModel {

  mobileNo: string = null;
  email: string = null;
  customerType: CustomerType = null;
  identificationName: string = null;
  identificationNo: string = null;
  identificationType: IdentificationType = null;
  identificationExpiryDate = '';
  companyName: string = null;
  referralCode: string = null;
  premise: OrderPremise = null;
  documentIds: number[] = [];
  consent: boolean = null;

  set premiseData(data: object) {
    this.premise = new OrderPremise().fromData(data);
  }
  get premiseData(): object {
    return this.premise.toData();
  }

  protected getFieldMap() {
    return super.getFieldMap(ORDER_FIELD_MAP);
  }
}

@Injectable()
export class OrderService extends BaseService<Order> {

  protected baseUrl = 'orders';

  protected newModel = (data: object) => new Order().fromData(data);

  createOrder(model: Order, token: string): Observable<Order> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Token ${token}`,
      })
    };

    const cloneModel = _.cloneDeep(model);
    if (model.referralCode) {
      cloneModel.referralCode = cloneModel.referralCode.trim().toLocaleUpperCase();
    }

    return this.http.post(`${this.baseUrl}/`, cloneModel.toData(), httpOptions)
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  protected getFieldMap() {
    return super.getFieldMap(ORDER_FIELD_MAP);
  }
}
