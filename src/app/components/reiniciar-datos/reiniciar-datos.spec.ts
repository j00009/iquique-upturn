import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReiniciarDatos } from './reiniciar-datos';

describe('ReiniciarDatos', () => {
  let component: ReiniciarDatos;
  let fixture: ComponentFixture<ReiniciarDatos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReiniciarDatos],
    }).compileComponents();

    fixture = TestBed.createComponent(ReiniciarDatos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
