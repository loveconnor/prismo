import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDescriptionComponent } from './dialog-description';

describe('DialogDescriptionComponent', () => {
  let component: DialogDescriptionComponent;
  let fixture: ComponentFixture<DialogDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
