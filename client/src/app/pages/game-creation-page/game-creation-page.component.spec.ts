/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CanvasTestHelper } from '@app/classes/test-helpers/canvas-test-helper';
import { SocketTestHelper } from '@app/classes/test-helpers/socket-test-helper';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@app/constants/images-constants';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { ImageFileService } from '@app/services/divers/image-file.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameCreationBackgroundService } from '@app/services/game-creation/background/game-creation-background.service';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { ForegroundDataService } from '@app/services/game-creation/foreground/foreground-data.service';
import { ImageIndex } from '@common/enums/game-creation/image-index';
import { FromServer, ToServer } from '@common/socket-event-constants';
import { Buffer } from 'buffer';
import { GameCreationPageComponent } from './game-creation-page.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-tool-bar', template: '' })
class ToolBarStubComponent {}

@Component({ selector: 'app-top-bar', template: '' })
class TopBarStubComponent {
    @Input() pageTitle: string;
}

@Component({ selector: 'app-image-edition-zone', template: '' })
class ImageEditionZoneStubComponent {
    @Input() imageIndex: ImageIndex;
}

@Component({ selector: 'app-game-creation-dialog', template: '' })
class GameCreationDialogStubComponent {}

@Component({ selector: 'app-paper-button', template: '' })
class PaperButtonStubComponent {
    @Input() onClick: () => void;
}

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;
    let socketHelper: SocketTestHelper;
    let imageFileServiceSpy: SpyObj<ImageFileService>;
    let gameCreationBackgroundServiceSpy: SpyObj<GameCreationBackgroundService>;
    let foregroundDataServiceSpy: SpyObj<ForegroundDataService>;
    let drawServiceSpy: SpyObj<DrawService>;
    let gameListManagerServiceSpy: SpyObj<GameListManagerService>;

    beforeEach(async () => {
        const observableSpy = jasmine.createSpyObj('Observable', ['subscribe']);
        const dialogRefSpy = jasmine.createSpyObj('MatDialog', ['afterClosed']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy.afterClosed.and.returnValue(observableSpy);
        dialogSpy.open.and.returnValue(dialogRefSpy);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        socketHelper = new SocketTestHelper();
        imageFileServiceSpy = jasmine.createSpyObj('ImageFileService', ['urlToBuffer', 'loadImage']);
        gameCreationBackgroundServiceSpy = jasmine.createSpyObj('GameCreationBackgroundService', ['clearImage', 'getImageUrl']);
        foregroundDataServiceSpy = jasmine.createSpyObj('ForegroundDataService', ['reset', 'changeState'], {
            foregroundData: { original: 'original', modified: 'modified' },
        });
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['clearCanvas', 'drawImage']);
        await TestBed.configureTestingModule({
            declarations: [
                GameCreationPageComponent,
                TopBarStubComponent,
                PaperButtonStubComponent,
                ImageEditionZoneStubComponent,
                GameCreationDialogStubComponent,
                ToolBarStubComponent,
            ],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: SocketClientService, useValue: socketHelper },
                { provide: ImageFileService, useValue: imageFileServiceSpy },
                { provide: GameCreationBackgroundService, useValue: gameCreationBackgroundServiceSpy },
                { provide: ForegroundDataService, useValue: foregroundDataServiceSpy },
                { provide: DrawService, useValue: drawServiceSpy },
                { provide: GameListManagerService, useValue: gameListManagerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize server events', () => {
        spyOn(socketHelper, 'on');
        component.ngOnInit();
        expect(socketHelper.on).toHaveBeenCalledWith(FromServer.CARD_VALIDATION, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(FromServer.CARD_CREATION, jasmine.any(Function));
    });
    it('should update the difference radius correctly based on the slider input value', () => {
        const FIRST_SLIDER_VALUE = '0';
        const FIRST_RADIUS_VALUE = 0;
        const SECOND_SLIDER_VALUE = '1';
        const SECOND_RADIUS_VALUE = 3;
        const THIRD_SLIDER_VALUE = '2';
        const THIRD_RADIUS_VALUE = 9;
        const FOURTH_SLIDER_VALUE = '3';
        const FOURTH_RADIUS_VALUE = 15;

        component.updateDifferenceRadius(FIRST_SLIDER_VALUE);
        expect(component.differenceRadius).toEqual(FIRST_RADIUS_VALUE);
        component.updateDifferenceRadius(SECOND_SLIDER_VALUE);
        expect(component.differenceRadius).toEqual(SECOND_RADIUS_VALUE);
        component.updateDifferenceRadius(THIRD_SLIDER_VALUE);
        expect(component.differenceRadius).toEqual(THIRD_RADIUS_VALUE);
        component.updateDifferenceRadius(FOURTH_SLIDER_VALUE);
        expect(component.differenceRadius).toEqual(FOURTH_RADIUS_VALUE);
    });

    it('openCreationDialog should open dialog if there is a valid number of diffrences', () => {
        component['openCreationDialog']({ valid: true, differenceNbr: 5, difficulty: 0, differenceImage: '' });
        expect(dialogSpy.open).toHaveBeenCalled();
    });

    it("should assign difficulty 'facile' for difficulty code 0", () => {
        expect(component['getDifficulty'](0)).toEqual('facile');
    });

    it("should assign difficulty 'difficile' for difficulty code 1", () => {
        expect(component['getDifficulty'](1)).toEqual('difficile');
    });

    it("should assign difficulty 'facile' for unknown difficulty code", () => {
        expect(component['getDifficulty'](2)).toEqual('facile');
    });

    it('sendDifferenceCalculationRequest should send the correct request to server', async () => {
        spyOn(socketHelper, 'send');
        spyOn<any>(component, 'getImageBuffers').and.callFake(async () => {
            return { original: Buffer.from(await new File([], '').arrayBuffer()), modified: Buffer.from(await new File([], '').arrayBuffer()) };
        });
        await component.sendDifferenceCalculationRequest();
        expect(socketHelper.send).toHaveBeenCalledWith(ToServer.CARD_VALIDATION_REQUEST, jasmine.any(Object));
    });

    it('sendGameCreationRequest should send the correct request to server when name is provided', async () => {
        spyOn(socketHelper, 'send');
        spyOn<any>(component, 'getImageBuffers').and.callFake(async () => {
            return { original: Buffer.from(await new File([], '').arrayBuffer()), modified: Buffer.from(await new File([], '').arrayBuffer()) };
        });
        await component['sendGameCreationRequest']('test');
        expect(socketHelper.send).toHaveBeenCalledWith(ToServer.CARD_CREATION_REQUEST, jasmine.any(Object));
    });

    it('sendGameCreationRequest should not send a request to server when name is not provided', async () => {
        spyOn(socketHelper, 'send');
        await component['sendGameCreationRequest']('');
        expect(socketHelper.send).not.toHaveBeenCalled();
    });

    it('navigateToConfig should go back to config page', () => {
        component['navigateToConfig']();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/config');
    });
    it('merge layers should call imageFileService.urlToBuffer with the background image if there is no foreground', () => {
        const backgroundUrl = 'test-background';
        const foregroundUrl = '';
        component['mergeLayers'](backgroundUrl, foregroundUrl);
        expect(imageFileServiceSpy.urlToBuffer).toHaveBeenCalledWith(backgroundUrl);
    });

    it('merge layers should clear the hidden canvas if both images are provided', async () => {
        const backgroundUrl = 'test-background';
        const foregroundUrl = 'test-foreground';
        const ctxStub = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        const dataUrlStub = 'test-dataUrl';
        const nativeElementSpy = jasmine.createSpyObj('nativeElement', ['getContext', 'toDataURL']);
        nativeElementSpy.getContext.and.returnValue(ctxStub);
        nativeElementSpy.toDataURL.and.returnValue(dataUrlStub);
        component.hiddenCanvas = {
            nativeElement: nativeElementSpy,
        };
        await component['mergeLayers'](backgroundUrl, foregroundUrl);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalledWith({ x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT }, ctxStub);
    });

    it('merge layers should draw the background and the foreground on the hidden canvas if both images are provided', async () => {
        const backgroundUrl = 'test-background';
        const foregroundUrl = 'test-foreground';
        const ctxStub = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        const dataUrlStub = 'test-dataUrl';
        const nativeElementSpy = jasmine.createSpyObj('nativeElement', ['getContext', 'toDataURL']);
        nativeElementSpy.getContext.and.returnValue(ctxStub);
        nativeElementSpy.toDataURL.and.returnValue(dataUrlStub);
        component.hiddenCanvas = {
            nativeElement: nativeElementSpy,
        };
        await component['mergeLayers'](backgroundUrl, foregroundUrl);
        expect(imageFileServiceSpy.loadImage).toHaveBeenCalledWith(backgroundUrl);
        expect(imageFileServiceSpy.loadImage).toHaveBeenCalledWith(foregroundUrl);
        expect(drawServiceSpy.drawImage).toHaveBeenCalledTimes(2);
    });

    it('merge layers should call imageFileService.urlToBuffer with the canvas data url if both images are provided', async () => {
        const backgroundUrl = 'test-background';
        const foregroundUrl = 'test-foreground';
        const ctxStub = CanvasTestHelper.createCanvas(DEFAULT_WIDTH, DEFAULT_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        const dataUrlStub = 'test-dataUrl';
        const nativeElementSpy = jasmine.createSpyObj('nativeElement', ['getContext', 'toDataURL']);
        nativeElementSpy.getContext.and.returnValue(ctxStub);
        nativeElementSpy.toDataURL.and.returnValue(dataUrlStub);
        component.hiddenCanvas = {
            nativeElement: nativeElementSpy,
        };
        await component['mergeLayers'](backgroundUrl, foregroundUrl);
        expect(imageFileServiceSpy.urlToBuffer).toHaveBeenCalledWith(dataUrlStub);
    });

    it('getImageBuffers should call mergeLayers', async () => {
        const imageUrlStub = 'test-url';
        gameCreationBackgroundServiceSpy.getImageUrl.and.returnValue(imageUrlStub);
        spyOn<any>(component, 'mergeLayers');
        await component['getImageBuffers']();
        expect(component['mergeLayers']).toHaveBeenCalledTimes(2);
        expect(component['mergeLayers']).toHaveBeenCalledWith(imageUrlStub, foregroundDataServiceSpy.foregroundData.original);
        expect(component['mergeLayers']).toHaveBeenCalledWith(imageUrlStub, foregroundDataServiceSpy.foregroundData.modified);
    });

    it('getImageBuffers should return buffers for the original and modified merged images', async () => {
        const bufferStub = Buffer.from(await new File([], 'original').arrayBuffer());
        spyOn<any>(component, 'mergeLayers').and.callFake(async () => bufferStub);
        expect(await component['getImageBuffers']()).toEqual({ original: bufferStub, modified: bufferStub });
    });

    it('swapForegrounds should change the foreground state', () => {
        component.swapForegrounds();
        expect(foregroundDataServiceSpy.changeState).toHaveBeenCalledWith({
            original: foregroundDataServiceSpy.foregroundData.modified,
            modified: foregroundDataServiceSpy.foregroundData.original,
        });
    });
});
