import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TramiteCard } from './tramite-card';

describe('TramiteCard', () => {
  let component: TramiteCard;
  let fixture: ComponentFixture<TramiteCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TramiteCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TramiteCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
