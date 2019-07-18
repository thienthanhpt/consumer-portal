import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { AppConfig } from '../configs/app.config';

@Injectable()
export class ConfigService {

  private _config = AppConfig;

  get = (key: string) => {
    return _.get(this._config, key);
  }
}
