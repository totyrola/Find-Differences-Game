/* eslint-disable max-classes-per-file */
import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCreationBackgroundService } from '@app/services/game-creation/background/game-creation-background.service';
import { ForegroundDataService } from '@app/services/game-creation/foreground/foreground-data.service';
import { ImageIndex } from '@common/enums/game-creation/image-index';
import { ImageEditionZoneComponent } from './image-edition-zone.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-image-picker', template: '' })
class ImagePickerStubComponent {
    @Input() imageIndex: ImageIndex;
}
@Component({ selector: 'app-drawing-area', template: '' })
class DrawingAreaStubComponent {
    @Input() imageIndex: ImageIndex;
}
@Pipe({ name: 'safeResourceUrl' })
class SafeUrlStubPipe implements PipeTransform {
    transform() {
        return '';
    }
}

describe('ImageEditionZoneComponent', () => {
    let component: ImageEditionZoneComponent;
    let fixture: ComponentFixture<ImageEditionZoneComponent>;
    let gameCreationBackgroundServiceSpy: SpyObj<GameCreationBackgroundService>;
    let foregroundDataServiceSpy: SpyObj<ForegroundDataService>;

    beforeEach(() => {
        gameCreationBackgroundServiceSpy = jasmine.createSpyObj('GameCreationBackgroundService', ['getImageUrl', 'clearImage']);
        foregroundDataServiceSpy = jasmine.createSpyObj('ForegroundDataService', ['changeState'], {
            foregroundData: { original: 'original', modified: 'modified' },
        });
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImageEditionZoneComponent, ImagePickerStubComponent, SafeUrlStubPipe, DrawingAreaStubComponent],
            providers: [
                { provide: GameCreationBackgroundService, useValue: gameCreationBackgroundServiceSpy },
                { provide: ForegroundDataService, useValue: foregroundDataServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ImageEditionZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('get ImageUrl should call getImageUrl of GameCreationBackgroundService', () => {
        const imageUrlStub = 'test';
        gameCreationBackgroundServiceSpy.getImageUrl.and.returnValue(imageUrlStub);
        expect(component.imageUrl).toEqual(imageUrlStub);
        expect(gameCreationBackgroundServiceSpy.getImageUrl).toHaveBeenCalled();
    });

    it('clearImage should call clearImage of GameCreationBackgroundService', () => {
        component.clearImage();
        expect(gameCreationBackgroundServiceSpy.clearImage).toHaveBeenCalled();
    });

    it('clearForeground should empty the original foreground if the component is for the original image', () => {
        component.imageIndex = ImageIndex.Original;
        component.clearForeground();
        expect(foregroundDataServiceSpy.changeState).toHaveBeenCalledWith({
            original: '',
            modified: foregroundDataServiceSpy.foregroundData.modified,
        });
    });

    it('clearForeground should empty the modified foreground if the component is for the modified image', () => {
        component.imageIndex = ImageIndex.Modified;
        component.clearForeground();
        expect(foregroundDataServiceSpy.changeState).toHaveBeenCalledWith({
            original: foregroundDataServiceSpy.foregroundData.original,
            modified: '',
        });
    });

    it('copyForeground should copy the original foreground if the component is for the original image', () => {
        component.imageIndex = ImageIndex.Original;
        component.copyForeground();
        expect(foregroundDataServiceSpy.changeState).toHaveBeenCalledWith({
            original: foregroundDataServiceSpy.foregroundData.original,
            modified: foregroundDataServiceSpy.foregroundData.original,
        });
    });

    it('copyForeground should copy the modified foreground if the component is for the modified image', () => {
        component.imageIndex = ImageIndex.Modified;
        component.copyForeground();
        expect(foregroundDataServiceSpy.changeState).toHaveBeenCalledWith({
            original: foregroundDataServiceSpy.foregroundData.modified,
            modified: foregroundDataServiceSpy.foregroundData.modified,
        });
    });
});
