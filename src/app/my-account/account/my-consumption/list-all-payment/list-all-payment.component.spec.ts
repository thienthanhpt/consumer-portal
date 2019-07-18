import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAllPaymentComponent } from './list-all-payment.component';

describe('ListAllPaymentComponent', () => {
  let component: ListAllPaymentComponent;
  let fixture: ComponentFixture<ListAllPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAllPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAllPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
