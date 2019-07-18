import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyConsumptionComponent } from './my-consumption.component';

describe('MyConsumptionComponent', () => {
  let component: MyConsumptionComponent;
  let fixture: ComponentFixture<MyConsumptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyConsumptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
