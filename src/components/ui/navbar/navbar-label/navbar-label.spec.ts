import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarLabel } from './navbar-label';

describe('NavbarLabel', () => {
  let component: NavbarLabel;
  let fixture: ComponentFixture<NavbarLabel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarLabel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarLabel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
