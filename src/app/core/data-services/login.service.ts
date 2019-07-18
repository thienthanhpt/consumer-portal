import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { HEADER_NEED_CREDENTIALS } from '../data-services/base.service';

@Injectable()
export class LoginService {

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    const data = { userid: username, password: password };
    return this.http.post('login/', data);
  }

  logout(): Observable<any> {
    const headerValues: { [name: string]: string } = {};
    headerValues[HEADER_NEED_CREDENTIALS] = 'true';

    return this.http.get('logout/', { headers: headerValues });
  }

  forgotPassword(email: string, login_id: string, url: string): Observable<any> {
    const data = { email, login_id,  url, action: 'forget' };
    return this.http.post('forget-password/', data);
  }

  validateToken(unVerifyToken: string): Observable<any> {
    return this.http.get(`validate-reset-password-token/${unVerifyToken}/`);
  }

  resetPassword(token: string, password: string): Observable<any> {
    const data = { password, action: 'change' };
    return this.http.post(`forget-password/?token=${token}`, data);
  }

  regeneratePasswordResetUrl(token: string, url: string): Observable<any> {
    const data = {expired_token: token, url: url};
    return this.http.post(`resend-email-reset-password/`, data);
  }
}
