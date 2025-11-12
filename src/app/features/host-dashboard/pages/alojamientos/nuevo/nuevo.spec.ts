import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nuevo } from './nuevo';

describe('Nuevo', () => {
  let component: Nuevo;
  let fixture: ComponentFixture<Nuevo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Nuevo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nuevo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
