/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HistoryComponent } from '@app/components/config-selection/history/history.component';
import { WarningDialogComponent } from '@app/components/config-selection/warning-dialog/warning-dialog.component';
import { FAKE_GAMES } from '@app/constants/game-selection-test-constants';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';
import { Subject } from 'rxjs';
import { ConfigPageComponent } from './config-page.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-top-bar', template: '' })
class TopBarStubComponent {
    @Input() pageTitle: string;
}

@Component({ selector: 'app-carousel-view', template: '' })
class CarouselViewStubComponent {
    @Input() buttonNames: [string, string, string] = ['', '', ''];
}

describe('ConfigPageComponent', () => {
    let fakeObservable: Subject<boolean>;
    let component: ConfigPageComponent;
    let fixture: ComponentFixture<ConfigPageComponent>;
    let socketSpy: SpyObj<SocketClientService>;
    let gameListSpy: SpyObj<GameListManagerService>;
    let dialogSpy: SpyObj<MatDialog>;
    let selectorSpy: SpyObj<GameSelectorService>;
    let fakeSelectionValue: Subject<{ buttonName: string; id: string }>;
    let dialogRefSpy: SpyObj<MatDialogRef<WarningDialogComponent>>;

    beforeEach(async () => {
        fakeObservable = new Subject<boolean>();
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        fakeSelectionValue = new Subject<{ buttonName: string; id: string }>();
        socketSpy = jasmine.createSpyObj('SocketClientService', ['connect', 'send']);
        gameListSpy = jasmine.createSpyObj('GameListManagerService', ['deleteGame', 'deleteAllGames', 'resetBestTimes', 'resetAllBestTimes']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        selectorSpy = jasmine.createSpyObj('GameSelectorService', ['setSelectionValue'], { selectionValue: fakeSelectionValue });
        await TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [CarouselViewStubComponent, ConfigPageComponent, TopBarStubComponent],
            providers: [
                { provide: SocketClientService, useValue: socketSpy },
                { provide: GameListManagerService, useValue: gameListSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: GameSelectorService, useValue: selectorSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ConfigPageComponent);
        component = fixture.componentInstance;
        selectorSpy.setSelectionValue.and.callFake((buttonName: string, id: string) => {
            selectorSpy.selectionValue.next({ buttonName, id });
        });
        dialogRefSpy.afterClosed.and.callFake(() => {
            return fakeObservable;
        });
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should subscribe clickhandler to selectorService`s selectionValue on init', () => {
        spyOn<any>(component, 'clickHandler');
        component.ngOnInit();
        selectorSpy.setSelectionValue(component.buttonNames[0], 'fakeId');
        expect(component['clickHandler']).toHaveBeenCalled();
    });
    it('should unsubscribe clickhandler to selectorService`s selectionValue on destroy', () => {
        spyOn<any>(component, 'clickHandler');
        component.ngOnInit();
        component.ngOnDestroy();
        selectorSpy.setSelectionValue(component.buttonNames[0], 'fakeId');
        expect(component['clickHandler']).not.toHaveBeenCalled();
    });
    it('should open the game constants dialog', () => {
        component.requestGameConstants();
        expect(dialogSpy.open).toHaveBeenCalled();
    });
    it('should delete game when clicking on game`s delete button', () => {
        component['deleteGame'] = jasmine.createSpy('deleteGame');
        component['clickHandler']({ buttonName: component.buttonNames[0], id: 'fakeId' });
        expect(component['deleteGame']).toHaveBeenCalled();
    });
    it('should reset game`s best times when clicking on game`s reset button', () => {
        component['resetBestTimes'] = jasmine.createSpy('resetBestTimes');
        component['clickHandler']({ buttonName: component.buttonNames[1], id: 'fakeId' });
        expect(component['resetBestTimes']).toHaveBeenCalled();
    });
    it('should warn player when reseting the game`s best times', () => {
        const spy = spyOn(component, 'warnPlayer');
        spy.and.returnValue(dialogRefSpy);
        component['resetBestTimes'](FAKE_GAMES[0].id);
        expect(component.warnPlayer).toHaveBeenCalledWith('réinitialiser les meilleurs temps de ce jeu');
    });
    it('should reset the game`s best times when player confirms his choice', () => {
        const spy = spyOn(component, 'warnPlayer');
        spy.and.returnValue(dialogRefSpy);
        component['resetBestTimes'](FAKE_GAMES[0].id);
        fakeObservable.next(true);
        expect(gameListSpy.resetBestTimes).toHaveBeenCalledWith(FAKE_GAMES[0].id);
    });
    it('should not reset the game`s best times when player cancels his choice', () => {
        const spy = spyOn(component, 'warnPlayer');
        spy.and.returnValue(dialogRefSpy);
        component['resetBestTimes'](FAKE_GAMES[0].id);
        fakeObservable.next(false);
        expect(gameListSpy.resetBestTimes).not.toHaveBeenCalled();
    });
    it('should warn player when deleting a game', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component['deleteGame']('fakeId');
        expect(component.warnPlayer).toHaveBeenCalledWith('supprimer ce jeu');
    });
    it('should warn player when deleting all games', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.deleteAllGames();
        expect(component.warnPlayer).toHaveBeenCalledWith('supprimer tous les jeux');
    });
    it('should warn player when reseting all games best times', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.resetAllBestTimes();
        expect(component.warnPlayer).toHaveBeenCalledWith('réinitialiser les meilleurs temps de tous les jeux');
    });
    it('should reset all games best times when player confirms his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.resetAllBestTimes();
        fakeObservable.next(true);
        expect(gameListSpy.resetAllBestTimes).toHaveBeenCalled();
    });
    it('should not reset all games best times when player cancels his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.resetAllBestTimes();
        fakeObservable.next(false);
        expect(gameListSpy.resetAllBestTimes).not.toHaveBeenCalled();
    });
    it('should open a warning dialog when warning player', () => {
        component.warnPlayer('fakeAction');
        expect(dialogSpy.open.calls.mostRecent().args[0]).toEqual(WarningDialogComponent);
    });
    it('should complete game`s deletion when user confirmes his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component['deleteGame']('fakeId');
        fakeObservable.next(true);
        expect(gameListSpy.deleteGame).toHaveBeenCalledWith('fakeId');
    });
    it('should cancel game`s deletion when user cancels his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component['deleteGame']('fakeId');
        fakeObservable.next(false);
        expect(gameListSpy.deleteGame).not.toHaveBeenCalled();
    });
    it('should complete deletion of all games when user confirmes his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.deleteAllGames();
        fakeObservable.next(true);
        expect(gameListSpy.deleteAllGames).toHaveBeenCalled();
    });
    it('should cancel deletion of all games when user cancels his choice', () => {
        component.warnPlayer = jasmine.createSpy('warnPlayer').and.returnValue(dialogRefSpy);
        component.deleteAllGames();
        fakeObservable.next(false);
        expect(gameListSpy.deleteAllGames).not.toHaveBeenCalled();
    });
    it('should open the game history dialog', () => {
        component.requestHistory();
        expect(dialogSpy.open.calls.mostRecent().args[0]).toEqual(HistoryComponent);
    });
});
