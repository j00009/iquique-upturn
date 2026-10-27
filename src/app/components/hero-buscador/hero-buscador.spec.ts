import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroBuscador } from './hero-buscador';

describe('HeroBuscador', () => {
  let component: HeroBuscador;
  let fixture: ComponentFixture<HeroBuscador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroBuscador],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroBuscador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
