import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import * as _ from 'lodash';
import * as moment from 'moment';

export const DATETIME_FORMAT = {
  DATE_SHORT: 'DD/MM/YYYY',
  DATE_API: 'YYYY-MM-DD[T]00:00:00[Z]',
  TIME_SHORT: 'DD/MM/YYYY HH:mm:ss',
  TIME_API: 'YYYY-MM-DD[T]HH:mm:ss[Z]',
};

const BASE_FIELD_MAP = { id: 'id', createdTime: 'created_date', updatedTime: 'last_modified_date' };
const BASE_IGNORE_FIELDS = [ 'id', 'createdTime', 'updatedTime' ];
export const HEADER_NEED_CREDENTIALS = 'need-credentials';

export abstract class BaseModel {

  public id: number = null;
  public createdTime: string = null;
  public updatedTime: string = null;

  protected getFieldMap(extendedFieldMap: object = {}): object {
    return _.assign({}, BASE_FIELD_MAP, extendedFieldMap);
  }

  protected getToDataIgnoredFields(extendedIgnoreFields: Array<string> = []): Array<string> {
    return _.concat([], BASE_IGNORE_FIELDS, extendedIgnoreFields);
  }

  // map data from data returned from back-end to this model fields
  fromData(data: object) {
    const fieldMap = _.invert(this.getFieldMap());

    _.forEach(data, (value: any, key: string) => {
      if (_.has(fieldMap, key)) {
        const modelField = fieldMap[key];
        if (value || _.isEqual(value, 0)) {
          if (_.endsWith(modelField, 'Date')) {
            // convert from back-end format to local format
            value = moment(value, DATETIME_FORMAT.DATE_API).format(DATETIME_FORMAT.DATE_SHORT);
          } else if (_.endsWith(modelField, 'Time')) {
            // convert from back-end format to local format
            value = moment(value, DATETIME_FORMAT.TIME_API).utc(true).local().format(DATETIME_FORMAT.TIME_SHORT);
          }
          _.set(this, modelField, value);
        } else {
          if (typeof value === 'boolean') {
            _.set(this, modelField, value);
          }
        }
      }
    });

    return this;
  }

  // return data which map data from this model fields to data which will send to back-end
  toData(options?: string[]) {
    let fieldMap = _.omit(this.getFieldMap(), this.getToDataIgnoredFields());
    if (options) {
      fieldMap = _.pick(fieldMap, options);
    }

    const data: { [name: string]: any} = {};
    _.forEach(fieldMap, (dataField, modelField) => {
      let value = _.get(this, modelField);

      if (!value) {
        value = typeof value === 'boolean' ? false : '';
      } else if (_.endsWith(modelField, 'Date')) {
        // convert from local format to back-end format
        value = moment(value, DATETIME_FORMAT.DATE_SHORT).format(DATETIME_FORMAT.DATE_API);
      } else if (_.endsWith(modelField, 'Time')) {
        // convert from local format to back-end format
        value = moment(value, DATETIME_FORMAT.TIME_SHORT).utc().format(DATETIME_FORMAT.TIME_API);
      }

      _.set(data, dataField,  value);
    });

    return data;
  }
}

export class Collection<Model> {
  items: Model[] = [];
  meta?: {
    count: number,
    page: number,
    [name: string]: any
  };
}

export class SuccessResponse {
  status: number;
  code?: string;
  message?: string;
  data?: any;
  meta?: any;
}

export class ErrorResponse {
  status: number;
  errors?: { [name: string]: string[] };
  code?: string;
  message: string;
  debugMessage?: string;
}

export class AppOptions {
  isStarhubUrl?: boolean;
  context?: { [ name: string]: string };
}

@Injectable()
export abstract class BaseService<Model extends BaseModel> {

  protected abstract baseUrl: string;

  protected httpConfigs: AppOptions = {};

  protected abstract newModel: (data: object) => Model;

  constructor(
    protected http: HttpClient,
  ) { }

  clone = (model: Model): Model => _.cloneDeep(model);

  fetchAll(criteria?: any, meta?: { limit?: number, offset?: number, sortAsc?: boolean, sortBy?: string }): Observable<Collection<Model>> {
    const query: any = {};
    const queryContext: { [name: string]: string[] } = {
      keys: [],
      values: []
    };

    if (criteria) {
      _.forEach(criteria, (value: string | number | string[] | number[], key: string) => {
        // to search for a list of options, concat them to string which separated by ","
        if (_.isArray(value)) {
          value = value.toString();
        }

        // key search and, or
        if (key[0] === '~') {
          key = key.substr(1);
          value = '~' + String(value);
        }

        const searchQuery = this.getFieldNameFormMap(key.split('.'), this.getFieldMap(), this.getSortFieldMap());
        if (!_.isEmpty(searchQuery)) {
          queryContext.keys.push(searchQuery);
          queryContext.values.push(String(value));
          _.set(query, searchQuery, value);
        }
      });

      if (_.isEmpty(meta)) {
        meta = { limit: 1000, offset: 0 };
      }
    }

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

    return this.http.get(`${this.baseUrl}${!_.isEmpty(meta) ? '/search' : ''}/${queryString}`, this.getHttpConfigs(appOptions))
      .pipe(map((rs: SuccessResponse) => this.newCollection(rs)));
  }

  fetchOne(id: number): Observable<Model>  {
    return this.http.get(`${this.baseUrl}/${id}/`, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  create(model: Model): Observable<Model> {
    return this.createFromData(model.toData());
  }

  createFromData(data: object): Observable<Model> {
    return this.http.post(`${this.baseUrl}/`, data, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  update(model: Model, updateFields?: string[]): Observable<Model> {
    return this.updateFromData(model.id, model.toData(updateFields));
  }

  updateFromData(id: number, data: object): Observable<Model> {
    return this.http.put(`${this.baseUrl}/${id}/`, data, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  updatePartial(model: Model, updateFields: string[]): Observable<Model> {
    return this.updatePartialFromData(model.id, model.toData(updateFields));
  }

  updatePartialFromData(id: number, data: object): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/`, data, this.getHttpConfigs())
      .pipe(map((rs: SuccessResponse) => this.newModel(rs.data)));
  }

  protected buildQuerry(query: any = {}) {
    return (_.isEmpty(query)) ? '' : '?' +  _.chain(query).map((value: string|number, key: string) => `${key}=${value}`).join('&').value();
  }

  protected newCollection(collectionData: object): Collection<Model> {
    const collection = new Collection<Model>();

    collection.items = _.chain(collectionData).get('data', []).map(row => this.newModel(row)).value();
    if ((_.has(collectionData, 'meta'))) {
      collection.meta = _.get(collectionData, 'meta');
    }

    return collection;
  }

  protected getSortFieldMap(extendedFieldMap: object = {}): object {
    return extendedFieldMap;
  }

  protected getFieldMap(extendedFieldMap: object = {}): object {
    return _.assign({}, BASE_FIELD_MAP, extendedFieldMap);
  }

  protected getFieldNameFormMap(option: string[], map: { [name: string]: any }, listChildMap: { [name: string]: any }): string {
    let query = map[option[0]];

    // if find value = undefined, try search + value, ex: typeValue
    if (_.isEmpty(query)) {
      query = map[option[0] + 'Value'];
      if (!_.isEmpty(query)) {
        return query;
      }
    }
    // if field map is countryValue mean this is BaseType, return value
    if (_.endsWith(query, 'Value')) {
      query = option[0];
      return query;
    }

    // if field map is consumerData mean this is consumer and get child field map
    if (_.isEmpty(query)) {
      query = map[option[0] + 'Data'];

      if (!_.isEmpty(query) && option.length > 1) {
        // query = listOptions[0];
        // if short is query datetime, not action
        // if !short to get child field map
        if (option[1] === 'short') {
          return query;
        }

        // get child exactly query
        const childMap: { [name: string]: string } = listChildMap[option[0]];

        // field map is Object Map
        const childQuery = this.getFieldNameFormMap(_.drop(option), childMap, listChildMap);

        if (_.isEmpty(childQuery)) {
          return query;
        }

        query = query + '__' + childQuery;
      }
    }

    return query;
  }

  protected getHttpConfigs = (httpConfigs: AppOptions = {}) => {
    const headerValues: { [name: string]: string } = {};
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
