import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenPermiso } from './resumen-permiso';

describe('ResumenPermiso', () => {
  let component: ResumenPermiso;
  let fixture: ComponentFixture<ResumenPermiso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenPermiso],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenPermiso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
