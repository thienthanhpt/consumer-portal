import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

import { BaseModel, SuccessResponse } from './base.service';

export const ATTACHMENT_FIELD_MAP = {
  name: 'name', displayName: 'display_name', server: 'server', filePath: 'file_path', fileType: 'file_type',
  isStored: 'is_stored',
};

export class Attachment extends BaseModel {

  name: string = null;
  displayName: string = null;
  server: string = null;
  filePath: string = null;
  fileType: string = null;
  isStored: boolean = null;

  get fullFilePath() {
    return 'http://' + this.filePath;
  }

  protected getFieldMap() {
    return super.getFieldMap(ATTACHMENT_FIELD_MAP);
  }
}

export const POTENTIAL_CUSTOMER_FIELD_MAP = {
  name: 'name', email: 'email', mobile: 'mobile', postalCode: 'postal_code', remark: 'remark',
  consent: 'consent',
};

export class PotentialCustomer extends BaseModel {

  name: string = null;
  email: string = null;
  mobile: string = null;
  postalCode: string = null;
  remark: string = null;
  consent: boolean = true;

  protected getFieldMap() {
    return super.getFieldMap(POTENTIAL_CUSTOMER_FIELD_MAP);
  }
}

export const LOCATION_FIELD_MAP = {
  searchVal: 'SEARCHVAL', blockNo: 'BLK_NO', roadName: 'ROAD_NAME', building: 'BUILDING', address: 'ADDRESS',
  postalCode: 'POSTAL',
};

export class Location extends BaseModel {

  searchVal: string = null;
  blockNo: string = null;
  roadName: string = null;
  building: string = null;
  address: string = null;
  postalCode: boolean = null;

  protected getFieldMap() {
    return super.getFieldMap(LOCATION_FIELD_MAP);
  }
}

@Injectable()
export class UtilService {

  constructor(
    private http: HttpClient
  ) { }

  requestAddresses(postalCode: string): Observable<any> {
    return this.http.get('https://developers.onemap.sg/commonapi/search?searchVal=' +
      postalCode + '&returnGeom=N&getAddrDetails=Y&pageNum=1')
      .pipe(map((rs: any) => {
        const collection = {
          items: [],
          meta: {
            count: 0,
            page: 0,
            totalPages: 0
          }
        };

        collection.items = _.chain(rs).get('results', []).map(row => new Location().fromData(row)).value();
        collection.meta.count = rs.found;
        collection.meta.page = rs.pageNum;
        collection.meta.totalPages = rs.totalNumPages;

        return collection;
      }));
  }

  requestOtp(data: { mobile: string, recaptcha: string }): Observable<any> {
    return this.http.post('otp-verification/', data);
  }

  registContact(data: PotentialCustomer): Observable<any> {
    return this.http.post('regist-contact/', data.toData());
  }

  verifyOtp(data: { otp: string, mobile: string, message_id: string }): Observable<any> {
    return this.http.post('authentication/', data);
  }

  verifyPromotionCode(referral_code: string) {
    const data = { referral_code, customer_type: 'r'};
    return this.http.post(`referral-codes/verify/`, data);
  }

  uploadDocument(content, documentName, token): Observable<Attachment> {
    const uploadRequestParams = {
      'file_name': documentName,
      'file_type': documentName.split('.').pop(),
      'file_content': content,
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Token ${token}`,
      })
    };

    return this.http.post(`document/`, uploadRequestParams, httpOptions).pipe(
      map((rs: SuccessResponse) => new Attachment().fromData(rs.data))
    );
  }
}
