import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as _ from 'lodash';
import * as moment from 'moment';

import { environment } from '@env/environment';
import { AuthService } from '../services';
import { HEADER_NEED_CREDENTIALS } from '../data-services';

const HTTP_PATTERN = new RegExp('^(?:[a-z]+:)?//', 'i');
const API_URL = `${environment.apiUrl}/b2capi/mobileapps/${environment.apiVersion}/`;
const WHITE_LIST_CODE = ['E_ORDER_AUTHENTICATION_FAIL'];

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  private context: { [name: string]: string } = {
    'language': 'en',
    'UTC-offset': moment().format('Z'),
    'platform': 'consumer-portal',
  };

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!HTTP_PATTERN.test(req.url)) {
      const url = API_URL + req.url;
      const setHeaders: { [name: string]: any }  = {
        'Context': JSON.stringify(this.context)
      };

      if (req.headers.has(HEADER_NEED_CREDENTIALS) && this.authService.isLoggedIn) {
        setHeaders['Authorization'] = `Token ${this.authService.token}`;
      }

      req = req.clone({ url, setHeaders, headers: req.headers.delete(HEADER_NEED_CREDENTIALS) });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.authService.isLoggedIn && !_.includes(WHITE_LIST_CODE, error.error.code)) {
          this.authService.logout();
        } else if (error.status === 503) {
          document.body.innerHTML = error.error['html_content'];
        }
        return throwError(error.error);
      })
    );
  }
}
