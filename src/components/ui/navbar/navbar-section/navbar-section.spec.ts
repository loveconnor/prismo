import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSection } from './navbar-section';

describe('NavbarSection', () => {
  let component: NavbarSection;
  let fixture: ComponentFixture<NavbarSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
