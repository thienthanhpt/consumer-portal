import { AppOptions, BaseModel, BaseService, HEADER_NEED_CREDENTIALS, SuccessResponse } from './base.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { DataTableParams, TransactionStatus } from './types';

export const PAYMENT_SESSION_REQUEST_FIELD_MAP = {
  paidAmount: 'paid_amount', date: 'date', paymentGateway: 'payment_gateway',
  consumerId: 'consumer_id', returnUrl: 'return_url', voidable: 'voidable'
};

export class PaymentSessionRequest extends BaseModel {

  paidAmount: number = null;
  date: string = null;
  paymentGateway: string = null;
  consumerId: number = null;
  returnUrl: string = null;
  voidable: boolean = false;

  protected getFieldMap() {
    return super.getFieldMap(PAYMENT_SESSION_REQUEST_FIELD_MAP);
  }
}

export const DIRECT_PAYMENT_REQUEST_FIELD_MAP = {
  paidAmount: 'paid_amount', cardId: 'card_id', isRecurring: 'is_recurring', consumerId: 'consumer_id'
};

export class DirectPaymentRequest extends BaseModel {

  paidAmount: number = null;
  cardId: number = null;
  isRecurring: boolean = null;
  consumerId: number = null;

  protected getFieldMap() {
    return super.getFieldMap(DIRECT_PAYMENT_REQUEST_FIELD_MAP);
  }
}

export const PAYMENT_INFO_FIELD_MAP = {
  merchantId: 'merchantid', name: 'name', sessionId: 'sessionid', successIndicator: 'successIndicator', orderId: 'order_id'
};

export class PaymentInfo extends BaseModel {

  merchantId: string = null;
  name: number = null;
  sessionId: string = null;
  successIndicator: string = null;
  orderId: string = null;

  protected getFieldMap() {
    return super.getFieldMap(PAYMENT_INFO_FIELD_MAP);
  }
}

export const PAYMENT_CARD_FIELD_MAP = {
  cardId: 'card_id', expireDate: 'card_expiry_date', cardNo: 'card_number', cardType: 'card_type', holderName: 'holder_name',
  isAutoDeduct: 'is_auto_deduct', paymentMode: 'payment_mode'
};
const PAYMENT_CARD_IGNORE_FIELDS = [ 'expireDate', 'cardNo', 'cardType', 'holderName', 'displayNo' ];


export class PaymentCard extends BaseModel {
  cardId: number = null;
  expireDate: string = null;
  cardNo: string = null;
  cardType: string = null;
  holderName: string = null;
  isAutoDeduct: boolean = null;
  displayNo: string = null;
  paymentMode: string = null;

  protected getFieldMap() {
    return super.getFieldMap(PAYMENT_CARD_FIELD_MAP);
  }

  protected getToDataIgnoredFields() {
    return super.getToDataIgnoredFields(PAYMENT_CARD_IGNORE_FIELDS);
  }
}

const TRANSACTION_CRITERIA_EXTRA_FIELD_MAP = {
  paymentDate: 'payment_date'
};

export const TRANSACTION_FIELD_MAP = {
  createdDate: 'created_date', lastModifiedDate: 'last_modified_date', paymentTransaction: 'payment_transaction',
  paymentNote: 'payment_note', paidAmount: 'paid_amount', status: 'status', paymentGateway: 'payment_gateway',
  otherInformation: 'other_information', paymentDate: 'payment_date', expiredDate: 'expired_date', returnUrl: 'return_url',
  sessionId: 'session_id', orderId: 'order_id', webhookUrl: 'webhook_url', paymentInfoData: 'payment_info', paymentOrder: 'payment_order',
  isAutoCharge: 'auto_charge', transactionId: 'payment_transaction'
};

export class Transaction extends BaseModel {

  createdDate: string = null;
  lastModifiedDate: string = null;
  paymentTransaction: string = null;
  paymentNote: string = null;
  mailingAddress: string = null;
  paidAmount: number = null;
  status: TransactionStatus = null;
  paymentGateway: number = null;
  paymentOrder: string = null;
  otherInformation: string = null;
  paymentDate: string = null;
  expiredDate: number = null;
  returnUrl: number = null;
  webhookUrl: string = null;
  paymentInfo: PaymentInfo = null;
  consumerId: number = null;
  isAutoDeduct: boolean = null;
  isSinglePayment: boolean = null;
  isAutoCharge: boolean = null;
  transactionId: string = null;

  set paymentInfoData(data: object) {
    this.paymentInfo = data ? new PaymentInfo().fromData(data) : null;
  }
  get paymentInfoData(): object {
    return this.paymentInfo ? this.paymentInfo.toData() : null;
  }

  protected getFieldMap() {
    return super.getFieldMap(TRANSACTION_FIELD_MAP);
  }
}

export class TransactionsResponse {
  data: Transaction[] = null;
  meta?: {
    count: number,
    page: number,
    size: number,
    [name: string]: any
  };

  fromData(rs) {
    this.data = _.map(rs.data, data => new Transaction().fromData(data));
    this.meta = rs.meta;
    this.meta.size = _.get(rs.meta, 'page_size');
    return this;
  }
}

@Injectable()
export class TransactionService extends BaseService<Transaction> {

  protected baseUrl = 'paymentgateway';

  protected newModel = (data: object) => new Transaction().fromData(data);

  private newModelPaymentCard = (data: object) => new PaymentCard().fromData(data);

  getTransactionSession(model: PaymentSessionRequest): Observable<Transaction> {

    const cloneModel = _.cloneDeep(model);

    return this.http.post(`${this.baseUrl}/`, cloneModel.toData(), this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  changeRecurringPayment(data: { consumer_id: number, enable_recurring: boolean }): Observable<SuccessResponse> {

    return this.http.post<SuccessResponse>(`payment/recurring/`, data, this.getHttpConfigs());
  }

  createToken(data: {consumer_id: number, session_id: string, transactionid: string}): Observable<SuccessResponse> {

    return this.http.post<SuccessResponse>(`payment/token/`, data, this.getHttpConfigs());
  }

  changeTransactionStatus(data: { consumer_id: number, transactionid: string, status: string }): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(`payment/change-status/`, data, this.getHttpConfigs());
  }

  handleDirectPayment(model: DirectPaymentRequest): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(`payment/charge/`, model.toData(), this.getHttpConfigs());
  }

  fetchCards(consumer_id): Observable<PaymentCard[]> {

    return this.http.get(`payment/${consumer_id}/token/`, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => _.chain(rs).get('data', []).map(row => new PaymentCard().fromData(row)).value()));
  }

  changedCardRecurringPayment(consumer_id: number, paymentCard: PaymentCard): Observable<PaymentCard[]> {
    return this.http.post(`payment/${consumer_id}/token/`, paymentCard.toData(), this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => _.chain(rs).get('data', []).map(row => this.newModelPaymentCard(row)).value()));
  }

  fetchConsumerPayments(id: number, meta?: DataTableParams) {
    const query: any = {};
    const queryContext: { [name: string]: string[] } = {
      keys: [],
      values: []
    };

    if (!_.isEmpty(meta)) {
      const { limit, offset, sortAsc, sortBy } = meta;

      if (limit) {
        _.set(query, 'page_size', limit);
        if (offset) {
          _.set(query, 'page', Math.floor(offset / limit) + 1);
        }
      }

      if (!_.isEmpty(sortBy)) {
        const sortQuery = this.getFieldNameFormMap(sortBy.split('.'), this.getFieldMap(), this.getSortFieldMap());
        if (!_.isEmpty(sortQuery)) {
          _.set(query, 'sort_by', `${ (_.isUndefined(sortAsc) || sortAsc) ? '' : '-' }${sortQuery}`);
        }
      }
    }

    const queryString = this.buildQuerry(query);

    const appOptions: AppOptions = {};
    if (queryContext.keys.length > 0 && queryContext.values.length > 0) {
      appOptions.context = {
        'search_key': queryContext.keys.join(','),
        'search_value': queryContext.values.join(',')
      };
    }

    return this.http.get(`billing/consumer/${id}${!_.isEmpty(meta) ? '/transaction/search' : ''}/${queryString}`, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => new TransactionsResponse().fromData(rs)));
  }

  protected getFieldMap() {
    return super.getFieldMap(_.assign({}, TRANSACTION_FIELD_MAP, TRANSACTION_CRITERIA_EXTRA_FIELD_MAP));
  }

  protected getHttpConfigs = (httpConfigs: AppOptions = {}) => {
    const headerValues: { [name: string]: string } = {
      'Content-Type': 'application/json',
    };
    headerValues[HEADER_NEED_CREDENTIALS] = 'true';

    _.assign(httpConfigs, this.httpConfigs);

    if (!_.isEmpty(httpConfigs)) {
      headerValues['App-Options'] = JSON.stringify(httpConfigs);
    }

    if (!_.isEmpty(headerValues)) {
      return { headers: headerValues };
    } else {
      return {};
    }
  }
}
