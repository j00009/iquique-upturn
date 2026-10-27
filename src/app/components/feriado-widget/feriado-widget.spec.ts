import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeriadoWidget } from './feriado-widget';

describe('FeriadoWidget', () => {
  let component: FeriadoWidget;
  let fixture: ComponentFixture<FeriadoWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeriadoWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(FeriadoWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
