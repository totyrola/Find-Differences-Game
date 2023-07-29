import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ForegroundDataService } from '@app/services/game-creation/foreground/foreground-data.service';
import { ImageIndex } from '@common/enums/game-creation/image-index';
import { ToolBarComponent } from './tool-bar.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-image-picker', template: '' })
class ImagePickerStubComponent {
    @Input() imageIndex: ImageIndex;
}

describe('ToolBarComponent', () => {
    let component: ToolBarComponent;
    let fixture: ComponentFixture<ToolBarComponent>;
    let foregroundDataServiceSpy: SpyObj<ForegroundDataService>;

    beforeEach(() => {
        foregroundDataServiceSpy = jasmine.createSpyObj('ForegroundDataService', ['undo', 'redo']);
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ToolBarComponent, ImagePickerStubComponent],
            imports: [FormsModule],
            providers: [{ provide: ForegroundDataService, useValue: foregroundDataServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ToolBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should select pencil, set the lineSize and select the color black on initialization', () => {
        const selectPencilSpy = spyOn(component, 'selectPencil');
        const setLineSizeSpy = spyOn(component, 'setLineSize');
        const setColorSpy = spyOn(component, 'setColor');
        component.ngOnInit();
        expect(selectPencilSpy).toHaveBeenCalled();
        expect(setLineSizeSpy).toHaveBeenCalled();
        expect(setColorSpy).toHaveBeenCalledWith('#000');
    });

    it('should call undo when CTRL+Z is pressed', () => {
        const undoSpy = spyOn(component, 'undo');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        expect(undoSpy).toHaveBeenCalled();
    });

    it('should call redo when CTRL+SHIFT+Z is pressed', () => {
        const redoSpy = spyOn(component, 'redo');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
        expect(redoSpy).toHaveBeenCalled();
    });

    it('setLineSize should validate the value size input', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validateSizeInputSpy = spyOn<any>(component, 'validateSizeInput');
        component.setLineSize();
        expect(validateSizeInputSpy).toHaveBeenCalled();
    });

    it('selectPencil should select the pencil', () => {
        component.selectPencil();
        expect(component.selectedTool).toEqual(component.pencil);
    });

    it('selectEraser should select the eraser', () => {
        component.selectEraser();
        expect(component.selectedTool).toEqual(component.eraser);
    });

    it('selectRectangle should select the rectangle', () => {
        component.selectRectangle();
        expect(component.selectedTool).toEqual(component.rectangle);
    });

    it('undo should call ForegroundDataService.undo', () => {
        component.undo();
        expect(foregroundDataServiceSpy.undo).toHaveBeenCalled();
    });

    it('redo should call ForegroundDataService.redo', () => {
        component.redo();
        expect(foregroundDataServiceSpy.redo).toHaveBeenCalled();
    });

    it('validateSizeInput should set the tool size to max size if it was above the max size', () => {
        const MAX_SIZE = 40;
        component.toolSize = MAX_SIZE + 1;
        component['validateSizeInput']();
        expect(component.toolSize).toEqual(MAX_SIZE);
    });

    it('validateSizeInput should set the tool size to min size if it was below the min size', () => {
        const MIN_SIZE = 1;
        component.toolSize = MIN_SIZE - 1;
        component['validateSizeInput']();
        expect(component.toolSize).toEqual(MIN_SIZE);
    });
});
