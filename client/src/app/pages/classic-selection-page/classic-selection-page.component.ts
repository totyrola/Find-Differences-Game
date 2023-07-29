import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AwaitingPlayersModalComponent } from '@app/components/config-selection/awaiting-players-modal/awaiting-players-modal.component';
import { UserNameDialogComponent } from '@app/components/config-selection/user-name-dialog/user-name-dialog.component';
import { WarnPlayerModalComponent } from '@app/components/config-selection/warn-player-modal/warn-player-modal.component';
import { DIALOG_CUSTOM_CONGIF } from '@app/constants/dialog-config';
import { GameSelection } from '@app/interfaces/game-card/game-selection';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';
import { Difficulty } from '@common/enums/game-play/difficulty';
import { GameConnectionAttemptResponseType } from '@common/enums/game-play/game-connection-attempt-response-type';
import { GameMode } from '@common/enums/game-play/game-mode';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';
import { GameConnectionRequestOutputMessageDto } from '@common/interfaces/game-play/game-connection-request.dto';
import { SimpleUser } from '@common/interfaces/game-play/simple-user';
import * as Events from '@common/socket-event-constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-classic-selection-page',
    templateUrl: './classic-selection-page.component.html',
    styleUrls: ['./classic-selection-page.component.scss'],
})
export class ClassicSelectionPageComponent implements OnInit, OnDestroy {
    buttonNames: [string, string, string] = ['Jouer en solo', 'Créer 1vs1', 'Joindre 1v1'];
    private gameMode: GameMode = GameMode.ClassicSolo;
    private componentDestroyed$: Subject<void> = new Subject<void>();
    private gameDifficulty: string;
    private namePlayer: string;
    private name2ndPlayer: string;
    private waitingPlayers: SimpleUser[] = [];
    private data: { gameId: string; waitingPlayers: SimpleUser[]; displayMessage: number } = {
        gameId: '',
        waitingPlayers: this.waitingPlayers,
        displayMessage: 0,
    };

    // eslint-disable-next-line max-params
    constructor(
        public gameData: GameDataService,
        public socketService: SocketClientService,
        private dialog: MatDialog,
        public router: Router,
        private selectorService: GameSelectorService,
    ) {}

    ngOnInit() {
        this.selectorService.selectionValue.pipe(takeUntil(this.componentDestroyed$)).subscribe((values) => {
            this.requestUsername(values);
        });
    }

    ngOnDestroy() {
        this.socketService.removeListener(Events.FromServer.RESPONSE_TO_JOIN_GAME_REQUEST);
        this.dialog.closeAll();
        this.componentDestroyed$.next();
        this.componentDestroyed$.complete();
    }

    private getGameMode(side: string) {
        let gameMode: GameMode;
        if (side === this.buttonNames[0]) {
            gameMode = GameMode.ClassicSolo;
        } else {
            gameMode = GameMode.Classic1v1;
        }
        return gameMode;
    }

    private requestUsername(selection: GameSelection) {
        const usernameDialogRef = this.dialog.open(UserNameDialogComponent, DIALOG_CUSTOM_CONGIF);
        usernameDialogRef.afterClosed().subscribe((username: string | undefined) => {
            if (username) {
                this.namePlayer = username;
                this.choseGame(selection);
            }
        });
    }

    private startGame(arg: GameConnectionRequestOutputMessageDto) {
        if (arg.difficulty === Difficulty.Easy) this.gameDifficulty = 'facile';
        else if (arg.difficulty === Difficulty.Hard) this.gameDifficulty = 'difficile';
        this.gameData.timeToStart = arg.startingIn;
        this.gameData.modifiedPicture = arg.modifiedImage;
        this.gameData.chronoTime = arg.time;
        this.gameData.gameID = arg.gameId;
        this.gameData.nbOfPlayers = arg.playerNbr;
        this.gameData.originalPicture = arg.originalImage;
        this.gameData.differenceNbr = arg.differenceNbr;
        this.gameData.difficulty = this.gameDifficulty;
        this.gameData.name = this.namePlayer;
        this.gameData.gameName = arg.gameName;
        this.gameData.gameMode = this.gameMode;
        this.gameData.name2ndPlayer = this.name2ndPlayer;
        this.gameData.gameValues = arg.gameValues;
        this.router.navigateByUrl('/game');
    }

    private classicSingleplayer(data: GameConnectionRequestOutputMessageDto) {
        this.gameMode = GameMode.ClassicSolo;
        switch (data.responseType) {
            case GameConnectionAttemptResponseType.Starting:
                this.startGame(data);
                this.dialog.closeAll();
                break;
            case GameConnectionAttemptResponseType.Pending:
                // should never happen
                this.dialog.closeAll();
                break;
            case GameConnectionAttemptResponseType.Cancelled:
                this.dialog.closeAll();
                break;
            case GameConnectionAttemptResponseType.Rejected:
                // should never happen
                this.dialog.closeAll();
                break;
        }
    }

    private removeWaitingPlayer(playerId: string) {
        for (let i = 0; i < this.waitingPlayers.length; i++) {
            const waitingPlayer = this.waitingPlayers[i];
            if (waitingPlayer.id === playerId) {
                this.waitingPlayers.splice(i, 1);
                return;
            }
        }
    }

    private classic1v1(data: GameConnectionRequestOutputMessageDto) {
        this.data.gameId = data.gameId;
        this.gameMode = GameMode.Classic1v1;
        switch (data.responseType) {
            case GameConnectionAttemptResponseType.Starting:
                this.dialog.closeAll();
                if (this.waitingPlayers.length !== 0) this.name2ndPlayer = this.waitingPlayers[0].name;
                else if (data.hostName) this.name2ndPlayer = data.hostName;
                this.startGame(data);
                break;
            case GameConnectionAttemptResponseType.Pending: {
                this.socketService.on(Events.FromServer.PLAYER_STATUS, (d: typeof Events.FromServer.PLAYER_STATUS.type) => {
                    if (d.user) {
                        switch (d.playerConnectionStatus) {
                            case PlayerConnectionStatus.AttemptingToJoin:
                                this.waitingPlayers.push(d.user);
                                break;
                            case PlayerConnectionStatus.Left:
                                this.removeWaitingPlayer(d.user.id);
                                break;
                        }
                    }
                });
                break;
            }
            case GameConnectionAttemptResponseType.Cancelled:
                {
                    const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
                    dialogConfig.data = { warning: 0 };
                    this.dialog.closeAll();
                    this.dialog.open(WarnPlayerModalComponent, dialogConfig);
                }
                break;
            case GameConnectionAttemptResponseType.Rejected:
                {
                    const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
                    dialogConfig.data = { warning: 1 };
                    this.dialog.closeAll();
                    this.dialog.open(WarnPlayerModalComponent, dialogConfig);
                }
                break;
        }
    }

    private choseGame(selection: GameSelection) {
        this.waitingPlayers = [];
        this.data.waitingPlayers = this.waitingPlayers;
        const gameMode = this.getGameMode(selection.buttonName);
        if (selection.buttonName === this.buttonNames[0]) {
            this.socketService.on(Events.FromServer.RESPONSE_TO_JOIN_GAME_REQUEST, this.classicSingleplayer.bind(this));
        } else {
            if (selection.buttonName === this.buttonNames[1]) {
                this.data.displayMessage = 1;
                this.dialog.open(AwaitingPlayersModalComponent, {
                    width: 'fit-content',
                    height: 'fit-content',
                    backdropClass: 'backdropBackground',
                    data: this.data,
                });
            } else if (selection.buttonName === this.buttonNames[2]) {
                this.data.displayMessage = 2;
                this.dialog.open(AwaitingPlayersModalComponent, {
                    width: 'fit-content',
                    height: 'fit-content',
                    backdropClass: 'backdropBackground',
                    data: this.data,
                });
            }
            this.socketService.on(Events.FromServer.RESPONSE_TO_JOIN_GAME_REQUEST, this.classic1v1.bind(this));
        }
        this.socketService.send(Events.ToServer.REQUEST_TO_PLAY, { gameMode, cardId: selection.id, playerName: this.namePlayer });
    }
}
