import { Component, HostListener, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { IdentificationType } from '@app/core';
import { ORDER_GA_EVENT_NAMES } from '@app/sign-up/order/order.constant';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  isSideBarCollapsed = false;
  listRequest = [
    {
      'id': '0000',
      'requestDate': '12/09/2018',
      'status': 'Resolved',
      'email': 'abc@def.com',
      'mobile': '+84373929892',
      'serviceAddress': [
        '285 cmt8 p12 q10 tphcm',
        '123 cmt2 p11 q2 tphcm',
        'abc def ghi'
      ],
      'requestType': 'Billing dispute',
      'description': 'abcdefghi'
    },
    {
      'id': '0001',
      'requestDate': '13/09/2018',
      'status': 'Pending',
      'email': 'abc@def.com',
      'mobile': '+84373929892',
      'serviceAddress': [
        '285 cmt8 p12 q10 tphcm',
        '123 cmt2 p11 q2 tphcm',
        'abc def ghi'
      ],
      'requestType': 'Relocation',
      'description': 'abcdefghi'
    },
    {
      'id': '0002',
      'requestDate': '14/09/2018',
      'status': 'Pending',
      'email': 'abc@def.com',
      'mobile': '+84373929892',
      'serviceAddress': [
        '285 cmt8 p12 q10 tphcm',
        '123 cmt2 p11 q2 tphcm',
        'abc def ghi'
      ],
      'requestType': 'Termination',
      'description': 'abcdefghi'
    },
    {
      'id': '0003',
      'requestDate': '15/09/2018',
      'status': 'Received',
      'email': 'abc@def.com',
      'mobile': '+84373929892',
      'serviceAddress': [
        '285 cmt8 p12 q10 tphcm',
        '123 cmt2 p11 q2 tphcm',
        'abc def ghi'
      ],
      'requestType': 'Technical issue',
      'description': 'abcdefghi'
    },
    {
      'id': '0004',
      'requestDate': '16/09/2018',
      'status': 'Resolved',
      'email': 'abc@def.com',
      'mobile': '+84373929892',
      'serviceAddress': [
        '285 cmt8 p12 q10 tphcm',
        '123 cmt2 p11 q2 tphcm',
        'abc def ghi'
      ],
      'requestType': 'Request hard copy',
      'description': 'abcdefghi'
    }
  ];
  selectedRequest = {};
  isNewRequest = true;

  constructor() { }

  ngOnInit() {
  }

  onSubmit(form) {
    console.log('cac');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 768) {
      this.isNewRequest = null;
    } else {
      this.isNewRequest = true;
    }
  }

  showRequests() {
    this.isNewRequest = null;
    this.selectedRequest = {};
  }

  showNewRequest() {
    this.isNewRequest = true;
    this.selectedRequest = {};
  }

  onSelectRequest(request) {
    this.isNewRequest = false;
    this.selectedRequest = request;
  }

  getStatus(status: string) {
    switch (status) {
      case 'Resolved':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Received':
        return 'badge-primary';
      default:
        break;
    }
  }

  toggleSideBar() {
    this.isSideBarCollapsed = !this.isSideBarCollapsed;
  }

}
