import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import { AppOptions, BaseModel, BaseService, HEADER_NEED_CREDENTIALS, SuccessResponse } from './base.service';
import {map} from 'rxjs/operators';
import { DataTableParams } from '@app/core';

const BILLING_FIELD_MAP = {
  id: 'inid', invoiceNo: 'invoice_no', invoiceDate: 'invoice_date', dueDate: 'due_date', totalAmountPayable: 'total_amount_payable',
  usageFromDate: 'usage_date_from', usageToDate: 'usage_date_to', usageAmount: 'usage_amount', status: 'status',
  totalAmount: 'tot_amt', billUrl: 'bill_url', billPeriod: 'bill_period', billAmount: 'bill_amount'
};

const BILLING_IGNORE_FIELDS = [ 'consumerData', 'customerName', 'contractData' ];

export class Billing extends BaseModel {

  // Declare customer for only search, support backend
  invoiceNo: string = null;
  invoiceDate: string = null;
  dueDate: string = null;
  totalAmountPayable: number = null;
  usageDateFrom: string = null;
  usageDateTo: string = null;
  usageAmount: number = null;
  status: string = null;
  totalAmount: number = null;
  billUrl: string = null;
  billPeriod: string = null;
  billAmount: number = null;

  isPaid(): boolean {
    return this.status === 'paid';
  }

  protected getFieldMap() {
    return super.getFieldMap(BILLING_FIELD_MAP);
  }

  protected getToDataIgnoredFields() {
    return super.getToDataIgnoredFields(BILLING_IGNORE_FIELDS);
  }
}

function newBilling(data: object) {
  return new Billing().fromData(data);
}

const INVOICE_CRITERIA_EXTRA_FIELD_MAP = {
  consumerName: 'consumer', consumerPremiseAddress: 'address', consumerPremisePostalCode: 'postal',
  customerName: 'customer', customerSunseapAccountNo: 'ss_acc_no', period: 'inv_date', startDate: 'start_date',
  endDate: 'end_date'
};

const CUSTOMER_BILLING_FIELD_MAP = {
  latestBilling: 'current_billing', allBilling: 'billing_list', totalAmount: 'total_amount'
};

export class BillingReport {
  currentBilling: Billing = null;
  billingList: Billing[] = null;
  totalAmount: number = null;
  meta?: {
    count: number,
    page: number,
    [name: string]: any
  };

  fromData(rs) {
    this.currentBilling = new Billing().fromData(rs.data.current_billing);
    this.billingList = _.map(rs.data.billing_list, data => new Billing().fromData(data));
    this.totalAmount = rs.data.total_amount;
    this.meta = rs.meta;
    return this;
  }
}

@Injectable()
export class BillingService extends BaseService<Billing> {

  protected baseUrl = 'billing/consumer/';

  protected newModel = (data: object) => newBilling(data);

  fetchCustomerBilling(id: number, meta?: DataTableParams) {
    const query: any = {};
    const queryContext: { [name: string]: string[] } = {
      keys: [],
      values: []
    };

    if (!_.isEmpty(meta)) {
      const { limit, offset, sortAsc, sortBy, fromDate, toDate } = meta;

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

      if (fromDate) {
        _.set(query, 'from_date', fromDate);
      }

      if (toDate) {
        _.set(query, 'to_date', toDate);
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

    return this.http.get(`${this.baseUrl}${id}${!_.isEmpty(meta) ? '/search' : ''}/${queryString}`, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => new BillingReport().fromData(rs)));
  }

  protected getFieldMap() {
    return super.getFieldMap(_.assign({}, BILLING_FIELD_MAP, INVOICE_CRITERIA_EXTRA_FIELD_MAP));
  }

  // TODO: handle http headers for internal users here when apis from backend are ready
  protected getHttpConfigs = (httpConfigs: AppOptions = {}) => {
    const headerValues: { [name: string]: string } = {
      'Content-Type': 'application/json, text/plain, */*',
    };
    // Need this to add `Authorization` param in request header at the interceptor
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
