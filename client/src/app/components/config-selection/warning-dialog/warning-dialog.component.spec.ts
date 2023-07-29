import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PaperButtonComponent } from '@app/components/general/paper-button/paper-button.component';
import { WarningDialogComponent } from './warning-dialog.component';
import SpyObj = jasmine.SpyObj;

describe('WarningDialogComponent', () => {
    let component: WarningDialogComponent;
    let fixture: ComponentFixture<WarningDialogComponent>;
    let dialogRefSpy: SpyObj<MatDialogRef<WarningDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        await TestBed.configureTestingModule({
            declarations: [WarningDialogComponent, PaperButtonComponent],
            providers: [
                { provide: MatDialogRef<WarningDialogComponent>, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: 'test' },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WarningDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should close the dialog and return true when user confirms his choice', () => {
        component.closeDialog(true);
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });
    it('should close the dialog and return false when user cancels his choice', () => {
        component.closeDialog(false);
        expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });
});
