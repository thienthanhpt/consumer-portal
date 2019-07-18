import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmaFactSheetComponent } from './ema-fact-sheet.component';

describe('EmaFactSheetComponent', () => {
  let component: EmaFactSheetComponent;
  let fixture: ComponentFixture<EmaFactSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmaFactSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmaFactSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
