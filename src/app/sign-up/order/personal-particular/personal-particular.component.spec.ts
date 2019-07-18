import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalParticularComponent } from './personal-particular.component';

describe('PersonalParticularComponent', () => {
  let component: PersonalParticularComponent;
  let fixture: ComponentFixture<PersonalParticularComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonalParticularComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalParticularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
