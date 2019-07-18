import { Injectable } from '@angular/core';

declare let gtag;

@Injectable()
export class GoogleTagManagerService {

  sendEvent(name: string) {
    if (gtag) {
      gtag('event', name);
    }
  }
}
