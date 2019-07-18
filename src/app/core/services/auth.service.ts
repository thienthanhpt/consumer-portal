// Package: https://github.com/7leads/ngx-cookie-service/blob/master/lib/cookie-service/cookie.service.ts
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoginService } from '../data-services';

const TOKEN_KEY = 'token';
const LOGIN_URL = '/login';

@Injectable()
export class AuthService {

  private readonly documentIsAccessible: boolean;

  isLoggedIn = false;

  token: string;

  constructor(@Inject(DOCUMENT) private document: any,
              private router: Router,
              private loginService: LoginService) {
    // To avoid issues with server side pre-rendering, check if `document` is defined.
    this.documentIsAccessible = document !== undefined;
    this.getToken();
  }

  login(username: string, password: string): Observable<boolean> {
    return this.loginService.login(username, password).pipe(tap((res) => {
      if (res.token) {
        this.setCookie(TOKEN_KEY, res.token);
        this.getToken();
      }
    }));
  }

  logout() {
    this.loginService.logout().subscribe(() => {
      this.clearToken();
      this.router.navigate([ LOGIN_URL ]);
    }, () => {
      this.clearToken();
      this.router.navigate([ LOGIN_URL ]);
    });
  }

  forgotPassword(email: string, login_id: string, url: string): Observable<any> {
    return this.loginService.forgotPassword(email, login_id, url);
  }

  validateToken(unVerifyToken: string): Observable<any> {
    return this.loginService.validateToken(unVerifyToken);
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.loginService.resetPassword(token, password);
  }

  regeneratePasswordResetUrl(token: string, url: string): Observable<object> {
    return this.loginService.regeneratePasswordResetUrl(token, url);
  }

  private clearToken() {
    this.deleteCookie(TOKEN_KEY);
    this.token = null;
    this.isLoggedIn = false;
  }

  private getToken() {
    this.token = this.getCookie(TOKEN_KEY);
    this.isLoggedIn = !!this.token;
  }

  private checkCookieName(name: string): boolean {
    if (!this.documentIsAccessible) {
      return false;
    }

    name = encodeURIComponent(name);
    const regExp: RegExp = this.getCookieRegExp(name);

    return regExp.test(this.document.cookie);
  }

  private getCookie(name: string): string {
    if (this.documentIsAccessible && this.checkCookieName(name)) {
      name = encodeURIComponent(name);
      const regExp: RegExp = this.getCookieRegExp(name);
      const result: RegExpExecArray = regExp.exec(this.document.cookie);

      return decodeURIComponent(result[ 1 ]);
    } else {
      return '';
    }
  }

  private setCookie(name: string, value: string, expires?: number | Date, path?: string, domain?: string, secure?: boolean): void {
    if (!this.documentIsAccessible) {
      return;
    }

    let cookieString: string = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';';

    if (expires) {
      if (typeof expires === 'number') {
        const dateExpires: Date = new Date(new Date().getTime() + expires * 1000 * 60 * 60 * 24);

        cookieString += 'expires=' + dateExpires.toUTCString() + ';';
      } else {
        cookieString += 'expires=' + expires.toUTCString() + ';';
      }
    }

    if (path) {
      cookieString += 'path=' + path + ';';
    }

    if (domain) {
      cookieString += 'domain=' + domain + ';';
    }

    if (secure) {
      cookieString += 'secure;';
    }

    this.document.cookie = cookieString;
  }

  private deleteCookie(name: string, path?: string, domain?: string): void {
    if (!this.documentIsAccessible) {
      return;
    }

    this.setCookie(name, '', new Date('Thu, 01 Jan 1970 00:00:01 GMT'), path, domain);
  }

  private getCookieRegExp(name: string): RegExp {
    const escapedName: string = name.replace(/([\[\]\{\}\(\)\|\=\;\+\?\,\.\*\^\$])/ig, '\\$1');
    return new RegExp('(?:^' + escapedName + '|;\\s*' + escapedName + ')=(.*?)(?:;|$)', 'g');
  }
}
