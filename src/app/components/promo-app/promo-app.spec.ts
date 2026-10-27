import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromoApp } from './promo-app';

describe('PromoApp', () => {
  let component: PromoApp;
  let fixture: ComponentFixture<PromoApp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoApp],
    }).compileComponents();

    fixture = TestBed.createComponent(PromoApp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
