/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AwaitingPlayersModalComponent } from '@app/components/config-selection/awaiting-players-modal/awaiting-players-modal.component';
import { PostItComponent } from '@app/components/general/post-it/post-it.component';
import { FAKE_ARGS_CANCELLED, FAKE_ARGS_PENDING, FAKE_ARGS_REJECTED, FAKE_ARGS_STARTING } from '@app/constants/game-selection-test-constants';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';

import { WarnPlayerModalComponent } from '@app/components/config-selection/warn-player-modal/warn-player-modal.component';
import { Difficulty } from '@common/enums/game-play/difficulty';
import { GameConnectionAttemptResponseType } from '@common/enums/game-play/game-connection-attempt-response-type';
import { GameMode } from '@common/enums/game-play/game-mode';
import { GameConnectionRequestOutputMessageDto } from '@common/interfaces/game-play/game-connection-request.dto';
import { GameValues } from '@common/interfaces/game-play/game-values';
import { ToServer } from '@common/socket-event-constants';
import { TimedSelectionModalComponent } from './timed-selection-modal.component';

@Component({ selector: 'app-paper-button', template: '' })
class PaperButtonStubComponent {
    @Input() onClick: () => void;
}

describe('TimedSelectionModalComponent', () => {
    let component: TimedSelectionModalComponent;
    let fixture: ComponentFixture<TimedSelectionModalComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TimedSelectionModalComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
        await TestBed.configureTestingModule({
            declarations: [TimedSelectionModalComponent, PostItComponent, PaperButtonStubComponent],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TimedSelectionModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog', () => {
        component.closeDialog();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
    it('playSolo should call socketService.send with LimitedTimeSolo and playerName', () => {
        const socketServiceSpy = spyOn(component['socketService'], 'send');
        component.playSolo();
        expect(socketServiceSpy).toHaveBeenCalledWith(ToServer.REQUEST_TO_PLAY, {
            gameMode: GameMode.LimitedTimeSolo,
            playerName: component.data.playerName,
        });
    });
    it('playCoop should call socketService.send with LimitedTimeCoop and playerName', () => {
        const socketServiceSpy = spyOn(component['socketService'], 'send');
        component.playCoop();
        expect(socketServiceSpy).toHaveBeenCalledWith(ToServer.REQUEST_TO_PLAY, {
            gameMode: GameMode.LimitedTimeCoop,
            playerName: component.data.playerName,
        });
    });
    it('startGame should call router.navigate with /game-play and set difficulty to facile when easy', () => {
        const data: GameConnectionRequestOutputMessageDto = {
            responseType: GameConnectionAttemptResponseType.Starting,
            gameName: 'gameName',
            playerNbr: 1,
            startingIn: 1,
            originalImage: 'originalImage',
            modifiedImage: 'modifiedImage',
            time: 1,
            gameId: 'gameId',
            difficulty: Difficulty.Easy,
            differenceNbr: 1,
            hostName: 'hostName',
            gameValues: {} as GameValues,
        };
        component['startGame'](data);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/game');
        expect(component.gameDifficulty).toEqual('facile');
    });

    it('startGame should call router.navigate with /game-play and set difficulty to difficile when hard', () => {
        const data: GameConnectionRequestOutputMessageDto = {
            responseType: GameConnectionAttemptResponseType.Starting,
            gameName: 'gameName',
            playerNbr: 1,
            startingIn: 1,
            originalImage: 'originalImage',
            modifiedImage: 'modifiedImage',
            time: 1,
            gameId: 'gameId',
            difficulty: Difficulty.Hard,
            differenceNbr: 1,
            hostName: 'hostName',
            gameValues: {} as GameValues,
        };
        component['startGame'](data);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/game');
        expect(component.gameDifficulty).toEqual('difficile');
    });

    it('should set name2ndPlayer to d.user?.name if d.playerConnectionStatus is PlayerConnectionStatus.Joined', () => {
        const d = {
            playerConnectionStatus: PlayerConnectionStatus.Joined,
            user: {
                name: 'test user',
            },
        };
        component.name2ndPlayer = 'Anonymous';
        component.name2ndPlayer = d.user.name;
        expect(component.name2ndPlayer).toEqual('test user');
    });

    it('should set name2ndPlayer to Anonymous if d.playerConnectionStatus is not PlayerConnectionStatus.Joined', () => {
        const d = {
            playerConnectionStatus: PlayerConnectionStatus.Left,
            user: {
                name: 'test user',
            },
        };
        component.name2ndPlayer = 'test user';
        component.name2ndPlayer = d.user.name;
        expect(component.name2ndPlayer).toEqual('test user');
    });

    it('limitedTimeSingleplayer should call startGame and closeAll when response is Starting', () => {
        spyOn<any>(component, 'startGame');
        component['limitedTimeSingleplayer'](FAKE_ARGS_STARTING);
        expect(component['startGame']).toHaveBeenCalledWith(FAKE_ARGS_STARTING);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('limitedTimeSingleplayer should call closeDialog when response is pending', () => {
        spyOn<any>(component, 'startGame');
        component['limitedTimeSingleplayer'](FAKE_ARGS_PENDING);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('limitedTimeSinglePlayer should open WarnPlayerModalComponent when response cancelled', () => {
        spyOn<any>(component, 'startGame');
        WarnPlayerModalComponent.opened = false;
        component['limitedTimeSingleplayer'](FAKE_ARGS_CANCELLED);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.open).toHaveBeenCalledWith(WarnPlayerModalComponent, {
            width: '450px',
            height: '400x',
            data: { warning: 3 },
        });
    });

    it('limitedSinglePlayer should call closeDialog when response is rejected', () => {
        spyOn<any>(component, 'startGame');
        component['limitedTimeSingleplayer'](FAKE_ARGS_REJECTED);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('limitedTimeCoopMode should call startGame and closeAll when response is Starting', () => {
        spyOn<any>(component, 'startGame');
        component['limitedTimeCoopMode'](FAKE_ARGS_STARTING);
        expect(component['startGame']).toHaveBeenCalledWith(FAKE_ARGS_STARTING);
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('limitedTimeCoopMode should open AwaitingPlayerModal', () => {
        spyOn<any>(component, 'startGame');
        component['limitedTimeCoopMode'](FAKE_ARGS_PENDING);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.open).toHaveBeenCalledWith(AwaitingPlayersModalComponent, {
            width: '500px',
            height: 'fit-content',
            backdropClass: 'backdropBackground',
            data: component['dataAwaitingPlayers'],
        });
    });

    it('limitedTimeCoopMode should open WarnPlayerModalComponent when response cancelled and WarnPlayerModalComponent not opened', () => {
        spyOn<any>(component, 'startGame');
        WarnPlayerModalComponent.opened = false;
        component['limitedTimeCoopMode'](FAKE_ARGS_CANCELLED);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.open).toHaveBeenCalledWith(WarnPlayerModalComponent, {
            width: '450px',
            height: '400x',
            data: { warning: 3 },
        });
    });
    it('limitedTimeCoopMode should not open WarnPlayerModalComponent when response cancelled and WarnPlayerModalComponent is opened', () => {
        spyOn<any>(component, 'startGame');
        WarnPlayerModalComponent.opened = true;
        component['limitedTimeCoopMode'](FAKE_ARGS_CANCELLED);
        expect(component['startGame']).not.toHaveBeenCalled();
        expect(dialogSpy.open).not.toHaveBeenCalledWith(WarnPlayerModalComponent, {
            width: '450px',
            height: '400x',
            data: { warning: 3 },
        });
    });
});
