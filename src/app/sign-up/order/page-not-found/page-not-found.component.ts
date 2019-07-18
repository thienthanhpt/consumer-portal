import { Component } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: 'page-not-found.component.html',
  styles: [`
    .error-code {
      font-size: 300px;
    }
    .oops {
      font-size: 120px;
    }
    .explanation {
      font-size: 48px;
    }
  `],
})

export class PageNotFoundComponent { }
