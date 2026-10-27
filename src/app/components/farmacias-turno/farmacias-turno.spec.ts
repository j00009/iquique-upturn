import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarmaciasTurno } from './farmacias-turno';

describe('FarmaciasTurno', () => {
  let component: FarmaciasTurno;
  let fixture: ComponentFixture<FarmaciasTurno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmaciasTurno],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmaciasTurno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
