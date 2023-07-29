import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserName } from '@app/classes/game-play/user-name';
import { WarningDialogComponent } from '@app/components/config-selection/warning-dialog/warning-dialog.component';
import { ChatboxComponent } from '@app/components/game-play/chatbox/chatbox.component';
import { CongratsMessageCoopComponent } from '@app/components/game-play/congrats-message-coop/congrats-message-coop.component';
import { CongratsMessageTimeLimitedComponent } from '@app/components/game-play/congrats-message-time-limited/congrats-message-time-limited.component';
import { CongratsMessageComponent } from '@app/components/game-play/congrats-message/congrats-message.component';
import { DIALOG_CUSTOM_CONGIF } from '@app/constants/dialog-config';
import { HINT_DURATION } from '@app/constants/game-constants';
import { NB_MS_IN_SECOND } from '@app/constants/time-constants';
import { ImageFileService } from '@app/services/divers/image-file.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { ChatService } from '@app/services/game-play/chat.service';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameTimeService } from '@app/services/game-play/game-time.service';
import { GameService } from '@app/services/game-play/game.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { SoundService } from '@app/services/game-play/sound.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';
import { Speed } from '@common/enums/game-play/speed';
import { CardFiles } from '@common/interfaces/game-card/card-files';
import { DifferenceImages } from '@common/interfaces/game-play/difference-images';
import { GameClickOutputDto } from '@common/interfaces/game-play/game-click.dto';
import { EndgameOutputDto } from '@common/interfaces/game-play/game-endgame.dto';
import { GameValues } from '@common/interfaces/game-play/game-values';
import * as Events from '@common/socket-event-constants';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild('chatBox') chatBox: ChatboxComponent;

    originalUrl: string;
    modifiedUrl: string;
    playerGaveUp: boolean = false;
    finalTime: number;
    gameName: string;
    userName: string = UserName.value;
    userName2ndPlayer?: string;
    difficulty: string;
    personalDifference = 0;
    enemyDifference = 0;
    gameId: string;
    nbOfPlayers: number;
    isCoopGame: boolean;
    isMultiplayer: boolean;
    nextCardFiles: CardFiles[] = [];
    pendingCardUpdate = false;
    gameMode: GameMode;
    totalDifferences: number;
    gameValues: GameValues;

    private time: number;

    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketClientService,
        public gameData: GameDataService,
        public dialog: MatDialog,
        private imageFileService: ImageFileService,
        private gameService: GameService,
        private replayService: ReplayService,
        private soundService: SoundService,
        private router: Router,
        private gameTimeService: GameTimeService,
        private chatService: ChatService,
    ) {}

    get hintDuration(): number {
        return HINT_DURATION / NB_MS_IN_SECOND;
    }

    @HostListener('document:keyup.t', ['$event'])
    handleKeyUp() {
        this.gameService.cheating = !this.gameService.cheating;
        if (this.gameService.cheating) {
            this.socketService.send(Events.ToServer.CHEAT, this.gameId);
        }
    }

    @HostListener('document:keyup.i', ['$event'])
    requestHint(): void {
        if (!this.hintsAreFinished() && !this.isMultiplayerGame() && !this.replayService.isReplayMode) {
            this.replayService.doAndStore(() => this.decrementHints());
            this.socketService.send(Events.ToServer.HINT, this.gameId);
        }
    }

    ngOnInit(): void {
        this.socketService.on(Events.FromServer.IS_PLAYING, (bool: typeof Events.FromServer.IS_PLAYING.type) => {
            if (!bool) this.router.navigateByUrl('/home');
        });
        this.socketService.send(Events.ToServer.IS_PLAYING);
        this.gameMode = this.gameData.gameMode;
        this.gameService.reset();
        this.gameValues = this.gameData.gameValues;
        this.replayService.reset();
        this.time = this.gameData.chronometerTime;
        this.gameId = this.gameData.gameID;
        this.originalUrl = this.gameData.originalPicture;
        this.modifiedUrl = this.gameData.modifiedPicture;
        this.difficulty = this.gameData.difficulty;
        this.nbOfPlayers = this.gameData.nbOfPlayers;
        this.originalUrl = this.imageFileService.base64StringToUrl(this.originalUrl);
        this.modifiedUrl = this.imageFileService.base64StringToUrl(this.modifiedUrl);
        this.gameService.totalDifferences = this.gameData.differenceNbr;
        this.totalDifferences = this.gameData.differenceNbr;
        this.userName = this.gameData.name;
        this.gameName = this.gameData.gameName;
        this.isCoopGame = this.gameMode === GameMode.LimitedTimeCoop;
        this.isMultiplayer = this.gameMode === GameMode.Classic1v1 || this.gameMode === GameMode.LimitedTimeCoop;
        this.socketService.on(Events.FromServer.CLICK_PERSONAL, this.processClickResponse.bind(this));
        this.socketService.on(Events.FromServer.ENDGAME, this.processEndGameEvent.bind(this));
        this.socketService.on(Events.FromServer.CLICK_ENEMY, this.processClickOpponentResponse.bind(this));
        this.gameTimeService.isReplayMode = false;
        this.gameTimeService.time = this.time;
        this.userName2ndPlayer = this.gameData.name2ndPlayer;
        this.socketService.on(Events.FromServer.CHEAT, this.gameService.cheat.bind(this.gameService));
        this.gameService.canCheat = true;
        this.socketService.on(Events.FromServer.NEXT_CARD, this.processNextCardEvent.bind(this));
        this.replayService.replayEvent.subscribe(this.resetForReplay.bind(this));
        this.socketService.on(Events.FromServer.PLAYER_STATUS, this.processToLimitedTimeSinglePlayer.bind(this));
        this.soundService.speed = Speed.NORMAL;
        this.socketService.on(Events.FromServer.CHEAT_INDEX, this.gameService.removeCheatIndex.bind(this.gameService));
    }

    ngOnDestroy(): void {
        this.socketService.send(Events.ToServer.LEAVE_GAME, this.gameId);
        this.socketService.removeListener(Events.FromServer.PLAYER_STATUS);
        this.socketService.removeListener(Events.FromServer.ENDGAME);
        this.socketService.removeListener(Events.FromServer.CHEAT);
        this.socketService.removeListener(Events.FromServer.CLICK_ENEMY);
        this.socketService.removeListener(Events.FromServer.CLICK_PERSONAL);
        this.socketService.removeListener(Events.FromServer.NEXT_CARD);
        this.socketService.removeListener(Events.FromServer.CHEAT_INDEX);
    }

    toggleGiveUp(): void {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = 'abandonner la partie';
        this.dialog
            .open(WarningDialogComponent, dialogConfig)
            .afterClosed()
            .subscribe((confirmed: boolean) => {
                if (confirmed) {
                    this.socketService.send(Events.ToServer.LEAVE_GAME, this.gameId);
                    this.playerGaveUp = true;
                    this.router.navigateByUrl('/home');
                }
            });
    }

    isMultiplayerGame(): boolean {
        return this.nbOfPlayers === 2;
    }

    isReplaying(): boolean {
        return this.replayService.isReplayMode;
    }

    hintsAreFinished(): boolean {
        return this.gameService.hintsLeft === 0;
    }

    private decrementHints(): void {
        this.gameService.hintsLeft--;
    }

    private processToLimitedTimeSinglePlayer(data: typeof Events.FromServer.PLAYER_STATUS.type): void {
        if (data.playerConnectionStatus === PlayerConnectionStatus.Left) {
            this.isCoopGame = false;
            this.isMultiplayer = false;
            this.nbOfPlayers = 1;
            this.gameMode = GameMode.LimitedTimeSolo;
        }
    }

    private processNextCardEvent(data: CardFiles): void {
        const newCard: CardFiles = {
            name: data.name,
            originalImage: this.imageFileService.base64StringToUrl(data.originalImage),
            modifiedImage: this.imageFileService.base64StringToUrl(data.modifiedImage),
            nbDifferences: data.nbDifferences,
        };
        this.nextCardFiles.push(newCard);
        if (this.pendingCardUpdate) this.updateCards();
    }

    private updateCards() {
        if (this.gameMode === GameMode.LimitedTimeCoop || this.gameMode === GameMode.LimitedTimeSolo) {
            const newCard = this.nextCardFiles.shift();
            if (newCard) {
                this.gameService.cheating = false;
                this.originalUrl = newCard.originalImage;
                this.modifiedUrl = newCard.modifiedImage;
                this.gameName = newCard.name;
                this.totalDifferences = newCard.nbDifferences;
                this.pendingCardUpdate = false;
            } else this.pendingCardUpdate = true;
        }
    }

    private processClickOpponentResponse(data: GameClickOutputDto) {
        this.replayService.store(() => this.processClickOpponentResponse(data));
        if (data.valid) {
            this.enemyDifference++;
            this.updateCards();
            this.processEnemySuccess({
                differenceNaturalOverlay: data.differenceNaturalOverlay as string,
                differenceFlashOverlay: data.differenceFlashOverlay as string,
            });
            if (this.isCoopGame) {
                this.personalDifference++;
            }
        }
    }

    private processClickResponse(data: GameClickOutputDto) {
        if (data.valid) {
            this.updateCards();
            this.replayService.doAndStore(() => this.incrementPersonalDifference());
            this.processSuccess({
                differenceNaturalOverlay: data.differenceNaturalOverlay as string,
                differenceFlashOverlay: data.differenceFlashOverlay as string,
            });
        } else {
            this.processError();
        }
    }

    private incrementPersonalDifference(): void {
        this.personalDifference++;
    }

    private processEndGameEvent(data: EndgameOutputDto) {
        switch (this.gameMode) {
            case GameMode.ClassicSolo: {
                this.congratsMessage(true, false);
                break;
            }
            case GameMode.LimitedTimeSolo: {
                this.congratsMessage(false, true);
                break;
            }
            case GameMode.Classic1v1: {
                this.congratsMessageCoop(true, data);
                break;
            }
            case GameMode.LimitedTimeCoop: {
                this.congratsMessage(false, true);
                break;
            }
        }
        this.finalTime = data.finalTime ? data.finalTime : 0;
        this.gameService.canCheat = true;
        this.gameService.cheating = false;
        this.gameService.canCheat = false;
        this.replayService.store(() => this.replayService.endOfReplay());
    }

    private processSuccess(differenceImages: DifferenceImages) {
        this.replayService.doAndStore(() => this.showSuccess(differenceImages));
        this.chatService.differenceFound = true;
    }

    private showSuccess(differenceImages: DifferenceImages) {
        this.soundService.playSuccess();
        this.gameService.incrementDifferencesFound(differenceImages);
    }

    private processEnemySuccess(differenceImages: DifferenceImages) {
        this.soundService.playSuccess();
        this.gameService.flashDifferences(differenceImages);
    }

    private congratsMessage(replayIsAvailable: boolean, timeLimited: boolean): void {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = { replayIsAvailable };
        if (timeLimited) {
            this.dialog.open(CongratsMessageTimeLimitedComponent, dialogConfig);
        } else {
            this.dialog.open(CongratsMessageComponent, dialogConfig);
        }
    }

    private congratsMessageCoop(replayIsAvailable: boolean, message: EndgameOutputDto): void {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = { message, replayIsAvailable };
        this.dialog.open(CongratsMessageCoopComponent, dialogConfig);
    }

    private processError() {
        this.replayService.doAndStore(() => this.showError());
        this.chatService.differenceError = true;
    }

    private showError() {
        this.soundService.playError();
        this.gameService.showErrorMessage();
    }

    private resetForReplay() {
        this.gameService.reset();
        this.time = this.gameData.chronometerTime;
        this.gameService.totalDifferences = this.gameData.differenceNbr;
        this.gameTimeService.time = 0;
        this.personalDifference = 0;
        this.enemyDifference = 0;
    }
}
