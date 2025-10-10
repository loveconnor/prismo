import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarDivider } from './navbar-divider';

describe('NavbarDivider', () => {
  let component: NavbarDivider;
  let fixture: ComponentFixture<NavbarDivider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarDivider]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarDivider);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
