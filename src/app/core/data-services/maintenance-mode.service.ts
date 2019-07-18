import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable()
export class MaintenanceModeService {

  constructor(private http: HttpClient) { }

  checkMaintenanceMode(): Observable<any> {
    return this.http.get('maintenance/check_status/');
  }
}
