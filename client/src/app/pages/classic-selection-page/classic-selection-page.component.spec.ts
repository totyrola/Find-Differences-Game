/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Game } from '@app/classes/game-play/game';
import { SocketTestHelper } from '@app/classes/test-helpers/socket-test-helper';
import { AwaitingPlayersModalComponent } from '@app/components/config-selection/awaiting-players-modal/awaiting-players-modal.component';
import { UserNameDialogComponent } from '@app/components/config-selection/user-name-dialog/user-name-dialog.component';
import { WarnPlayerModalComponent } from '@app/components/config-selection/warn-player-modal/warn-player-modal.component';
import { FAKE_ARGS_CANCELLED, FAKE_ARGS_PENDING, FAKE_ARGS_REJECTED, FAKE_ARGS_STARTING } from '@app/constants/game-selection-test-constants';
import { GameSelection } from '@app/interfaces/game-card/game-selection';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';
import { Difficulty } from '@common/enums/game-play/difficulty';
import { GameMode } from '@common/enums/game-play/game-mode';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';
import { SimpleUser } from '@common/interfaces/game-play/simple-user';
import * as Events from '@common/socket-event-constants';
import { Subject } from 'rxjs';
import { ClassicSelectionPageComponent } from './classic-selection-page.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-carousel-view', template: '' })
class CarouselViewStubComponent {
    @Input() games: Game[] = [];
    @Input() buttonNames: [string, string, string];
}

describe('ClassicSelectionPageComponent', () => {
    let fakeObservable: Subject<string | undefined>;
    let dialogRefSpy: SpyObj<MatDialogRef<UserNameDialogComponent>>;
    let component: ClassicSelectionPageComponent;
    let fixture: ComponentFixture<ClassicSelectionPageComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;
    let selectorSpy: SpyObj<GameSelectorService>;
    let socketSpy: SocketTestHelper;
    let fakeSelectionValue: Subject<{ buttonName: string; id: string }>;
    const playerStatusArg: typeof Events.FromServer.PLAYER_STATUS.type = {
        playerConnectionStatus: PlayerConnectionStatus.AttemptingToJoin,
        user: {
            name: 'Alice',
            id: '123',
        },
        playerNbr: 2,
    };

    beforeEach(async () => {
        fakeObservable = new Subject<string | undefined>();
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        fakeSelectionValue = new Subject<GameSelection>();
        socketSpy = new SocketTestHelper();
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        selectorSpy = jasmine.createSpyObj('GameSelectorService', ['setSelectionValue'], { selectionValue: fakeSelectionValue });
        await TestBed.configureTestingModule({
            imports: [MatDialogModule, RouterTestingModule],
            declarations: [ClassicSelectionPageComponent, CarouselViewStubComponent],
            providers: [
                GameDataService,
                { provide: MatDialog, useValue: dialogSpy },
                { provide: SocketClientService, useValue: socketSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameSelectorService, useValue: selectorSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ClassicSelectionPageComponent);
        component = fixture.componentInstance;
        selectorSpy.setSelectionValue.and.callFake((buttonName: string, id: string) => {
            selectorSpy.selectionValue.next({ buttonName, id });
        });
        dialogSpy.open.and.returnValue(dialogRefSpy);
        dialogRefSpy.afterClosed.and.returnValue(fakeObservable.asObservable());
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should subscribe to selectionValue', () => {
        spyOn(component['selectorService'].selectionValue, 'pipe').and.callThrough();
        component.ngOnInit();
        expect(component['selectorService'].selectionValue.pipe).toHaveBeenCalled();
    });
    it('ngOnInit should subscribe selectorService selectionValue to requestUsername', () => {
        const spy = spyOn(component, 'requestUsername' as never);
        component.ngOnInit();
        fakeSelectionValue.next({ buttonName: component.buttonNames[1], id: 'fakeId' });
        expect(spy).toHaveBeenCalled();
    });
    it('requestUserName should open a dialog', () => {
        component['requestUsername']({ buttonName: component.buttonNames[1], id: 'fakeId' });
        expect(dialogSpy.open).toHaveBeenCalled();
    });
    it('should chose game if username confirmed', () => {
        spyOn(component, 'choseGame' as never);
        component['requestUsername']({ buttonName: component.buttonNames[1], id: 'fakeId' });
        fakeObservable.next('fakeName');
        expect(component['choseGame']).toHaveBeenCalledWith({ buttonName: component.buttonNames[1], id: 'fakeId' });
    });
    it('should not chose game if username selection was canceled', () => {
        spyOn(component, 'choseGame' as never);
        component['requestUsername']({ buttonName: component.buttonNames[1], id: 'fakeId' });
        fakeObservable.next(undefined);
        expect(component['choseGame']).not.toHaveBeenCalled();
    });
    it('getGameMode should return classic1v1 if right buttonName', () => {
        expect(component['getGameMode'](component.buttonNames[1])).toEqual(GameMode.Classic1v1);
    });
    it('getGameMode should return ClassicSolo if selecting solo', () => {
        expect(component['getGameMode'](component.buttonNames[0])).toEqual(GameMode.ClassicSolo);
    });
    it('startGame should call navigateByUrl and set gameDifficulty to facile', () => {
        FAKE_ARGS_STARTING.difficulty = Difficulty.Easy;
        component['startGame'](FAKE_ARGS_STARTING);
        expect(component['gameDifficulty']).toEqual('facile');
        expect(routerSpy.navigateByUrl).toHaveBeenCalled();
    });
    it('startGame should call navigateByUrl and set gameDifficulty to difficile', () => {
        FAKE_ARGS_STARTING.difficulty = Difficulty.Hard;
        component['startGame'](FAKE_ARGS_STARTING);
        expect(component['gameDifficulty']).toEqual('difficile');
        expect(routerSpy.navigateByUrl).toHaveBeenCalled();
    });
    it('classicSinglePlayer should startGame and closeAll when response is Starting', () => {
        spyOn<any>(component, 'startGame');
        component['classicSingleplayer'](FAKE_ARGS_STARTING);
        expect(component['startGame']).toHaveBeenCalled();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
    it('classicSinglePlayer should closeAll when response is Pending', () => {
        component['classicSingleplayer'](FAKE_ARGS_PENDING);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
    it('classicSinglePlayer should closeAll when response is Cancelled', () => {
        component['classicSingleplayer'](FAKE_ARGS_CANCELLED);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
    it('classicSinglePlayer should closeAll when response is Rejected', () => {
        component['classicSingleplayer'](FAKE_ARGS_REJECTED);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
    it('should removeWaitingPlayer if valid id', () => {
        const waitingPlayersFake: SimpleUser[] = [
            {
                name: 'Alice',
                id: '123',
            },
            {
                name: 'Bob',
                id: '456',
            },
        ];
        component['waitingPlayers'] = waitingPlayersFake;
        component['removeWaitingPlayer']('123');
        expect(component['waitingPlayers']).toEqual([{ name: 'Bob', id: '456' }]);
    });
    it('should not removeWaitingPlayer if invalid id', () => {
        const waitingPlayersFake: SimpleUser[] = [
            {
                name: 'Alice',
                id: '123',
            },
            {
                name: 'Bob',
                id: '456',
            },
        ];
        component['waitingPlayers'] = waitingPlayersFake;
        component['removeWaitingPlayer']('789');
        expect(component['waitingPlayers']).toEqual(waitingPlayersFake);
    });
    it('classic1v1 should startGame if responseType is Starting', () => {
        FAKE_ARGS_STARTING.hostName = 'Alice';
        spyOn<any>(component, 'startGame');
        component['classic1v1'](FAKE_ARGS_STARTING);
        expect(component['startGame']).toHaveBeenCalled();
        expect(component['name2ndPlayer']).toEqual(FAKE_ARGS_STARTING.hostName);
    });
    it('classic1v1 should set name2ndPlayer to the first waiting player if there is one', () => {
        FAKE_ARGS_STARTING.hostName = 'Alice';
        spyOn<any>(component, 'startGame');
        component['waitingPlayers'] = [
            {
                name: 'Bob',
                id: '456',
            },
        ];
        component['classic1v1'](FAKE_ARGS_STARTING);
        expect(component['name2ndPlayer']).toEqual('Bob');
    });
    it('classic1v1 should open WarnPlayerModal if response is Cancelled', () => {
        component['classic1v1'](FAKE_ARGS_CANCELLED);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
        const args = dialogSpy.open.calls.mostRecent().args;
        expect(args[0]).toEqual(WarnPlayerModalComponent);
        if (args[1]?.data) {
            const data = args[1].data as { warning: number };
            expect(data.warning).toEqual(0);
        }
    });
    it('classic1v1 should open WarnPlayerModal if response is Rejected', () => {
        component['classic1v1'](FAKE_ARGS_REJECTED);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
        const args = dialogSpy.open.calls.mostRecent().args;
        expect(args[0]).toEqual(WarnPlayerModalComponent);
        if (args[1]?.data) {
            const data = args[1].data as { warning: number };
            expect(data.warning).toEqual(1);
        }
    });
    it('choseGame should call classicSinglePlayer if gameMode is ClassicSolo', () => {
        const values = { buttonName: component.buttonNames[0], id: 'fakeId' };
        const gameMode = '0';
        const cardId = '123';
        const playerName = 'Alice';
        spyOn<any>(component, 'classicSingleplayer');
        component['choseGame'](values);
        component.socketService.send(Events.ToServer.REQUEST_TO_PLAY, { gameMode, cardId, playerName });
        socketSpy.peerSideEmit(Events.FromServer.RESPONSE_TO_JOIN_GAME_REQUEST, FAKE_ARGS_STARTING);
        expect(component['classicSingleplayer']).toHaveBeenCalled();
    });
    it('choseGame should open AwaitinPlayerModal if gameMode is Classic1v1', () => {
        const values = { buttonName: component.buttonNames[1], id: 'fakeId' };
        const gameMode = '1';
        const cardId = '123';
        const playerName = 'Alice';
        component['choseGame'](values);
        component.socketService.send(Events.ToServer.REQUEST_TO_PLAY, { gameMode, cardId, playerName });
        const args = dialogSpy.open.calls.mostRecent().args;
        expect(args[0]).toEqual(AwaitingPlayersModalComponent);
        if (args[1]?.data) {
            const data = args[1].data as { gameId: string; waitingPlayers: ClassicSelectionPageComponent; displayMessage: number };
            expect(data.displayMessage).toEqual(1);
        }
    });

    it('choseGame should open AWaitingPlayer with data = 2 if buttonName is creer 1v1', () => {
        const values = { buttonName: component.buttonNames[2], id: 'fakeId' };
        const gameMode = '1';
        const cardId = '123';
        const playerName = 'Alice';
        component['choseGame'](values);
        component.socketService.send(Events.ToServer.REQUEST_TO_PLAY, { gameMode, cardId, playerName });
        const args = dialogSpy.open.calls.mostRecent().args;
        expect(args[0]).toEqual(AwaitingPlayersModalComponent);
        if (args[1]?.data) {
            const data = args[1].data as { gameId: string; waitingPlayers: ClassicSelectionPageComponent; displayMessage: number };
            expect(data.displayMessage).toEqual(2);
        }
    });

    it('classic1v1 should push player in waitingPlayers if response is Pending and PlayerConnectionAttempt is canJoin', () => {
        component['classic1v1'](FAKE_ARGS_PENDING);
        playerStatusArg.playerConnectionStatus = PlayerConnectionStatus.AttemptingToJoin;
        socketSpy.peerSideEmit(Events.FromServer.PLAYER_STATUS, playerStatusArg);
        expect(component['waitingPlayers']).toEqual([{ name: 'Alice', id: '123' }]);
    });
    it('classic1v1 should not push player in waitingPlayers if response is Pending and PlayerConnectionAttempt is Left', () => {
        component['classic1v1'](FAKE_ARGS_PENDING);
        playerStatusArg.playerConnectionStatus = PlayerConnectionStatus.Left;
        socketSpy.peerSideEmit(Events.FromServer.PLAYER_STATUS, playerStatusArg);
        expect(component['waitingPlayers']).toEqual([]);
    });
});
