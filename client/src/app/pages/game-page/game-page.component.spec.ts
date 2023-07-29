/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FormatTimePipe } from '@app/classes/pipes/format-time.pipe';
import { SafeUrlPipe } from '@app/classes/pipes/safe-url-pipe';
import { SocketTestHelper } from '@app/classes/test-helpers/socket-test-helper';
import { WarningDialogComponent } from '@app/components/config-selection/warning-dialog/warning-dialog.component';
import { ChronometerContainerComponent } from '@app/components/game-play/chronometer-container/chronometer-container.component';
import { CongratsMessageCoopComponent } from '@app/components/game-play/congrats-message-coop/congrats-message-coop.component';
import { CongratsMessageTimeLimitedComponent } from '@app/components/game-play/congrats-message-time-limited/congrats-message-time-limited.component';
import { CongratsMessageComponent } from '@app/components/game-play/congrats-message/congrats-message.component';
import { DifferencesFoundComponent } from '@app/components/game-play/differences-found/differences-found.component';
import { DisplayHintsComponent } from '@app/components/game-play/feature/display-hints/display-hints.component';
import { DisplayScoreComponent } from '@app/components/game-play/feature/display-score/display-score.component';
import { PostItComponent } from '@app/components/general/post-it/post-it.component';
import { DIALOG_CUSTOM_CONGIF } from '@app/constants/dialog-config';
import { ImageFileService } from '@app/services/divers/image-file.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameTimeService } from '@app/services/game-play/game-time.service';
import { GameService } from '@app/services/game-play/game.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { SoundService } from '@app/services/game-play/sound.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';
import { CardFiles } from '@common/interfaces/game-card/card-files';
import { EndgameOutputDto } from '@common/interfaces/game-play/game-endgame.dto';
import { SimpleUser } from '@common/interfaces/game-play/simple-user';
import * as Events from '@common/socket-event-constants';
import { Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-play-area', template: '' })
class PlayAreaStubComponent {
    @Input() name: string;
    @Input() isModified: boolean;
    @Input() backgroundImageUrl: string;
}

@Component({ selector: 'app-chatbox', template: '' })
class ChatboxStubComponent {
    @Input() differenceFound: boolean;
    @Input() differenceError: boolean;
    @Input() playerGaveUp: boolean;
    @Input() valueChanged: boolean;
    @Input() gameId: string;
    @Input() isMultiplayer: boolean;
}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let socketHelper: SocketTestHelper;
    let dialogSpy: SpyObj<MatDialog>;
    let imageFileServiceSpy: SpyObj<ImageFileService>;
    let gameServiceSpy: SpyObj<GameService>;
    let soundServiceSpy: SpyObj<SoundService>;
    let replayServiceSpy: SpyObj<ReplayService>;
    let gameTimeServiceSpy: SpyObj<GameTimeService>;
    let routerSpy: SpyObj<Router>;
    let fakeObservable: Subject<boolean>;
    let fakeDialogRef: SpyObj<MatDialogRef<WarningDialogComponent>>;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        imageFileServiceSpy = jasmine.createSpyObj('ImageFileService', ['base64StringToUrl']);
        gameServiceSpy = jasmine.createSpyObj('GameServiceSpy', [
            'reset',
            'showErrorMessage',
            'incrementDifferencesFound',
            'cheat',
            'removeCheatIndex',
            'flashDifferences',
        ]);
        fakeDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        fakeObservable = new Subject();
        soundServiceSpy = jasmine.createSpyObj('SoundService', ['playSuccess', 'playError']);
        const replayEventSpy = jasmine.createSpyObj('EventEmitter', ['subscribe']);
        replayServiceSpy = jasmine.createSpyObj('ReplayService', ['reset', 'store', 'doAndStore', 'endOfReplay'], {
            isReplayMode: false,
            replayEvent: replayEventSpy,
        });
        replayServiceSpy.doAndStore.and.callFake((action) => action());
        gameTimeServiceSpy = jasmine.createSpyObj('GameTimeService', { time: 0, isReplayMode: true });
        await TestBed.configureTestingModule({
            declarations: [
                GamePageComponent,
                DisplayHintsComponent,
                DisplayScoreComponent,
                PlayAreaStubComponent,
                ChronometerContainerComponent,
                ChatboxStubComponent,
                FormatTimePipe,
                DifferencesFoundComponent,
                PostItComponent,
                SafeUrlPipe,
            ],
            providers: [
                GameDataService,
                { provide: Router, useValue: routerSpy },
                { provide: SocketClientService, useValue: socketHelper },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: ImageFileService, useValue: imageFileServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: SoundService, useValue: soundServiceSpy },
                { provide: ReplayService, useValue: replayServiceSpy },
                { provide: GameTimeService, useValue: gameTimeServiceSpy },
            ],
            imports: [MatTooltipModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        dialogSpy.open.and.returnValue(fakeDialogRef);
        fakeDialogRef.afterClosed.and.returnValue(fakeObservable);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call `on` method of socketService on init', () => {
        spyOn(socketHelper, 'on');
        component.ngOnInit();
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.IS_PLAYING, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.CLICK_PERSONAL, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.ENDGAME, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.CLICK_ENEMY, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.CHEAT, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.NEXT_CARD, jasmine.any(Function));
        expect(socketHelper.on).toHaveBeenCalledWith(Events.FromServer.PLAYER_STATUS, jasmine.any(Function));
    });
    it('should open CongratsMessageTimeLimitedComponent dialog if gameMode is limited time', () => {
        component['congratsMessage'](true, true);
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = { replayIsAvailable: true };
        expect(dialogSpy.open).toHaveBeenCalledWith(CongratsMessageTimeLimitedComponent, dialogConfig);
    });
    it('should open congrats message dialog if gameMode is classic', () => {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = { replayIsAvailable: true };
        component['congratsMessage'](true, false);
        expect(dialogSpy.open).toHaveBeenCalledWith(CongratsMessageComponent, dialogConfig);
    });

    it('should not call navigateByUrl when is_playing event is not received', () => {
        component.ngOnInit();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('processTo;imitedTimeSinglePlayer should be called when PlayerConnectionStatus.Left', () => {
        const user: SimpleUser = {
            name: 'test',
            id: '123',
        };
        const testData: typeof Events.FromServer.PLAYER_STATUS.type = {
            playerConnectionStatus: PlayerConnectionStatus.Left,
            user,
        };
        component['processToLimitedTimeSinglePlayer'](testData);
        expect(component.isCoopGame).toBeFalse();
        expect(component.nbOfPlayers).toBe(1);
        expect(component.gameMode).toBe(GameMode.LimitedTimeSolo);
    });

    it('should play sound and increment differences found on success', () => {
        component['processSuccess']({ differenceNaturalOverlay: '', differenceFlashOverlay: '' });
        expect(gameServiceSpy.incrementDifferencesFound).toHaveBeenCalled();
        expect(soundServiceSpy.playSuccess).toHaveBeenCalled();
    });

    it('should play sound and show error on error', () => {
        component['processError']();
        replayServiceSpy.doAndStore.calls.mostRecent().args[0]();
        expect(gameServiceSpy.showErrorMessage).toHaveBeenCalled();
        expect(soundServiceSpy.playError).toHaveBeenCalled();
    });

    it('should call coop congrats message when endgame event', () => {
        const congratsSpy = spyOn<any>(component, 'congratsMessageCoop');
        const congratsSpy2 = spyOn<any>(component, 'congratsMessage');
        component['gameMode'] = GameMode.LimitedTimeCoop;
        component['processEndGameEvent']({} as EndgameOutputDto);
        expect(congratsSpy).not.toHaveBeenCalled();
        expect(congratsSpy2).toHaveBeenCalled();
    });

    it('should call only solo congrats message when endgame event', () => {
        const congratsSpy = spyOn<any>(component, 'congratsMessage');
        const congratsSpy2 = spyOn<any>(component, 'congratsMessageCoop');
        component['gameMode'] = GameMode.ClassicSolo;
        component['processEndGameEvent']({} as EndgameOutputDto);
        expect(congratsSpy).toHaveBeenCalled();
        expect(congratsSpy2).not.toHaveBeenCalled();
    });

    it('should update the final time when receiving it from endgame event', () => {
        const NBR_SECONDS = 5;
        spyOn<any>(component, 'congratsMessage');
        component['processEndGameEvent']({ finalTime: NBR_SECONDS } as EndgameOutputDto);
        expect(component.finalTime).toEqual(NBR_SECONDS);
    });
    it('should process success and store incrementPersonalDifference on successful click response', () => {
        const processSuccessSpy = spyOn<any>(component, 'processSuccess');
        const incrementDifferenceSpy = spyOn(component, 'incrementPersonalDifference' as never).and.callThrough();
        component.personalDifference = 0;
        component['processClickResponse']({
            valid: true,
            penaltyTime: 0,
            differenceNaturalOverlay: 'test',
            differenceFlashOverlay: 'test',
        });
        expect(processSuccessSpy).toHaveBeenCalled();
        incrementDifferenceSpy.calls.reset();
        replayServiceSpy.doAndStore.calls.mostRecent().args[0]();
        expect(component['incrementPersonalDifference']).toHaveBeenCalledTimes(1);
    });
    it('should process error on an error click response', () => {
        const processErrorSpy = spyOn<any>(component, 'processError');
        component['processClickResponse']({
            valid: false,
            penaltyTime: 0,
            differenceNaturalOverlay: 'test',
            differenceFlashOverlay: 'test',
        });
        expect(processErrorSpy).toHaveBeenCalled();
    });
    it('should set the time to 0 and store endOfReplay method when the game is over', () => {
        component['processEndGameEvent']({ finalTime: 0 } as EndgameOutputDto);
        replayServiceSpy.store.calls.mostRecent().args[0]();
        expect(component.finalTime).toEqual(0);
        expect(replayServiceSpy.endOfReplay).toHaveBeenCalled();
    });
    it('should warn player when player tries to give up', () => {
        component.playerGaveUp = false;
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = 'abandonner la partie';
        component.toggleGiveUp();
        expect(dialogSpy.open).toHaveBeenCalledWith(WarningDialogComponent, dialogConfig);
    });
    it('should set playerGaveUp to true when player gives up', () => {
        component.playerGaveUp = false;
        component.toggleGiveUp();
        fakeObservable.next(true);
        expect(component.playerGaveUp).toBeTruthy();
    });
    it('should not set playerGaveUp to true if player chooses not to give-up', () => {
        component.playerGaveUp = false;
        component.toggleGiveUp();
        fakeObservable.next(false);
        expect(component.playerGaveUp).toBeFalsy();
    });
    it('should handle keyup event when releasing t key', () => {
        spyOn(component, 'handleKeyUp');
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 't' }));
        expect(component.handleKeyUp).toHaveBeenCalled();
    });
    it('should toggle cheat when handling keyup', () => {
        gameServiceSpy.cheating = false;
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 't' }));
        expect(gameServiceSpy.cheating).toBeTruthy();
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 't' }));
        expect(gameServiceSpy.cheating).toBeFalsy();
    });
    it('should increment enemyDifference when receiving an enemyFoundDifference event', () => {
        component.enemyDifference = 0;
        component['processClickOpponentResponse']({
            playerName: '',
            valid: true,
            differenceFlashOverlay: '',
            differenceNaturalOverlay: '',
        });
        expect(component.enemyDifference).toEqual(1);
    });
    it('should increment enemyDifference and personalDifference when receiving an enemyFoundDifference event and gameMode is coop', () => {
        component.enemyDifference = 0;
        component.personalDifference = 0;
        component.isCoopGame = true;
        component['processClickOpponentResponse']({
            playerName: '',
            valid: true,
            differenceFlashOverlay: '',
            differenceNaturalOverlay: '',
        });
        expect(component.enemyDifference).toEqual(1);
        expect(component.personalDifference).toEqual(1);
    });

    it('should not increment enemyDifference when receiving an enemyFoundDifference with false', () => {
        component.enemyDifference = 0;
        component['processClickOpponentResponse']({
            playerName: '',
            valid: false,
            differenceFlashOverlay: '',
            differenceNaturalOverlay: '',
        });
        expect(component.enemyDifference).toEqual(0);
    });
    it('should store processClickOpponentResponse', () => {
        const spy = spyOn(component, 'processClickOpponentResponse' as never);
        spy.and.callThrough();
        component.enemyDifference = 0;
        const data = {
            playerName: '',
            valid: false,
            differenceFlashOverlay: '',
            differenceNaturalOverlay: '',
        };
        component['processClickOpponentResponse'](data);
        spy.calls.reset();
        const storedFunction = replayServiceSpy.store.calls.mostRecent().args[0] as () => void;
        storedFunction();
        expect(component['processClickOpponentResponse']).toHaveBeenCalledOnceWith(data);
    });
    it('resetForReplay should reset the game', () => {
        component['resetForReplay']();
        expect(gameServiceSpy.reset).toHaveBeenCalled();
    });

    it('processEndGameEvent should call congrats message when gameMode is LimitedTimeSolo', () => {
        component['gameMode'] = GameMode.LimitedTimeSolo;
        const congratsSpy = spyOn<any>(component, 'congratsMessage');
        component['processEndGameEvent']({} as EndgameOutputDto);
        expect(congratsSpy).toHaveBeenCalled();
    });

    it('processEndGameEvent should call congratsMessageCoop when gameMode is Classic1v1', () => {
        component['gameMode'] = GameMode.Classic1v1;
        const congratsSpy = spyOn<any>(component, 'congratsMessageCoop');
        component['processEndGameEvent']({} as EndgameOutputDto);
        expect(congratsSpy).toHaveBeenCalled();
    });
    it('processEndGameEvent should call congratsMessageCoop when gameMode is LimitedTimeCoop', () => {
        component['gameMode'] = GameMode.LimitedTimeCoop;
        const congratsSpy = spyOn<any>(component, 'congratsMessage');
        component['processEndGameEvent']({} as EndgameOutputDto);
        expect(congratsSpy).toHaveBeenCalled();
    });
    it('congratsMessageCoop should call congratsMessageCoopComponent', () => {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = { message: {}, replayIsAvailable: false };
        component['congratsMessageCoop'](false, {} as EndgameOutputDto);
        expect(dialogSpy.open).toHaveBeenCalledWith(CongratsMessageCoopComponent, dialogConfig);
    });
    it('updateCards should set pendingCardUpdate to false when new card', () => {
        component['gameMode'] = GameMode.LimitedTimeCoop;
        const cardFiles: CardFiles[] = [
            {
                name: 'test',
                originalImage: 'test',
                modifiedImage: 'test',
                nbDifferences: 2,
            },
        ];
        component.nextCardFiles = cardFiles;
        component['updateCards']();
        expect(component.pendingCardUpdate).toEqual(false);
    });
    it('updateCards should set pendingCardUpdate to false when no card available', () => {
        component['gameMode'] = GameMode.LimitedTimeSolo;
        component.nextCardFiles = [];
        component['updateCards']();
        expect(component.pendingCardUpdate).toEqual(true);
    });
    it('decrementHints should decrement hints', () => {
        component['gameService'].hintsLeft = 3;
        component['decrementHints']();
        expect(component['gameService'].hintsLeft).toEqual(2);
    });
    it('processNextCardEvent should call updateCards when there is cards', () => {
        const updateCardsSpy = spyOn<any>(component, 'updateCards');
        const cardFiles: CardFiles = {
            name: 'test',
            originalImage: 'test',
            modifiedImage: 'test',
            nbDifferences: 2,
        };
        component.pendingCardUpdate = true;
        socketHelper.peerSideEmit(Events.FromServer.NEXT_CARD, cardFiles);
        expect(updateCardsSpy).toHaveBeenCalled();
    });
    it('requestHint should call doAndStore and socketCLient send', () => {
        spyOn(socketHelper, 'send');
        component['gameService'].hintsLeft = 3;
        component['replayService'].isReplayMode = false;
        component.nbOfPlayers = 1;
        component.requestHint();
        expect(component['gameService'].hintsLeft).toEqual(2);
        expect(socketHelper.send).toHaveBeenCalledWith(Events.ToServer.HINT, component.gameId);
    });
    it('should send player to main page if player not playing according to server', () => {
        component.ngOnInit();
        socketHelper.peerSideEmit(Events.FromServer.IS_PLAYING, false);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
    });
    it('should not send player to main page if player is playing according to server', () => {
        component.ngOnInit();
        socketHelper.peerSideEmit(Events.FromServer.IS_PLAYING, true);
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });
});
