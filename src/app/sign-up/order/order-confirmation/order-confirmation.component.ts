import { Component } from '@angular/core';

import { ORDER_ROUTES } from '../order.constant';


@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
})
export class OrderConfirmationComponent {

  ORDER_ROUTES = ORDER_ROUTES;

  constructor() { }

}
