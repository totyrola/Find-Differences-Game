import { Injectable } from '@angular/core';
import { TWO_DIGIT_TIME } from '@app/constants/time-constants';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { UserNameCheckerService } from '@app/services/game-selection/user-name-checker.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { ChatMessageOutputDto } from '@common/interfaces/game-play/chat-message.dto';
import { GameClickOutputDto } from '@common/interfaces/game-play/game-click.dto';
import { Message } from '@common/interfaces/game-play/message';
import { FromServer, ToServer } from '@common/socket-event-constants';
import { GameDataService } from './game-data.service';
import { GameService } from './game.service';
import { ReplayService } from './replay.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    differenceFound: boolean;
    differenceError: boolean;
    playerGaveUp: boolean;
    valueChanged: boolean;

    isCoop: boolean = true;
    messages: Message[] = [];
    inputValue: string = '';
    recordBeaterMessage: string;
    gameMode = this.gameData.gameMode;

    private isMessage: boolean;

    // eslint-disable-next-line max-params
    constructor(
        public socketService: SocketClientService,
        public gameData: GameDataService,
        private userNameChecker: UserNameCheckerService,
        private classicGameService: GameService,
        private replayService: ReplayService,
    ) {
        this.socketService.on(FromServer.HINT, () => {
            const message: Message = {
                text: 'Indice utilisé',
                time: this.getCurrentTime(),
                isMessageText: false,
                messageReceived: false,
            };
            this.pushMessage(message);
        });
        this.socketService.on(FromServer.CHAT_MESSAGE, (data: ChatMessageOutputDto) => {
            const message: Message = {
                text: data.sender + ': ' + data.message,
                time: this.getCurrentTime(),
                isMessageText: true,
                messageReceived: true,
            };
            this.pushMessage(message);
        });

        this.socketService.on(FromServer.GLOBAL_MESSAGE, (data: string) => {
            const message: Message = {
                text: this.getCurrentTime() + ' - ' + data,

                time: this.getCurrentTime(),
                isMessageText: false,
                messageReceived: false,
            };
            this.pushMessage(message);
        });

        this.socketService.on(FromServer.RECORD_BEATER, (data: string) => {
            this.recordBeaterMessage = data;
        });

        this.socketService.on(FromServer.DESERTER, (data: string) => {
            const message: Message = {
                text: data + ' a abandonné la partie',
                time: this.getCurrentTime(),
                isMessageText: false,
                messageReceived: false,
            };
            this.pushMessage(message);
        });

        this.replayService.replayEvent.subscribe(this.reset.bind(this));
    }

    waitForEnemyClick() {
        this.socketService.on(FromServer.CLICK_ENEMY, (data: GameClickOutputDto) => {
            const message: Message = {
                text: (data.valid ? 'Différence trouvée par' : 'Erreur par') + ' ' + data.playerName,
                time: this.getCurrentTime(),
                isMessageText: false,
                messageReceived: false,
            };
            this.pushMessage(message);
        });
    }

    getGameMode() {
        if (this.gameData.gameMode === GameMode.ClassicSolo || this.gameMode === GameMode.LimitedTimeSolo) {
            this.isCoop = false;
        } else if (this.gameMode === GameMode.Classic1v1 || this.gameMode === GameMode.LimitedTimeCoop) {
            this.isCoop = true;
        }
    }

    reset() {
        this.messages = [];
    }

    onKeyDown(event: Event): void {
        if (this.gameMode === GameMode.LimitedTimeCoop || this.gameMode === GameMode.Classic1v1) {
            if (event instanceof KeyboardEvent && event.key === 'Enter') {
                this.isMessage = true;

                this.addMessage(true);
            }
        }
    }

    differenceFounded() {
        if (this.differenceFound) {
            if (this.gameMode === GameMode.ClassicSolo || this.gameMode === GameMode.LimitedTimeSolo) {
                this.inputValue = 'Différence trouvée';
            } else {
                this.inputValue = `Différence trouvée par ${this.gameData.name}`;
            }
            this.addMessage(false);
        }
    }

    differenceMistakeMade() {
        if (this.differenceError) {
            if (this.gameMode === GameMode.ClassicSolo || this.gameMode === GameMode.LimitedTimeSolo) {
                this.inputValue = 'Erreur';
            } else {
                this.inputValue = `Erreur par ${this.gameData.name}`;
            }
            this.addMessage(false);
        }
    }

    onFocus() {
        this.classicGameService.canCheat = false;
    }

    onFocusOut() {
        this.classicGameService.canCheat = true;
    }

    pushMessage(message: Message) {
        this.replayService.store(() => this.pushMessage(message));
        this.messages.unshift(message);
    }

    private addMessage(isPersonalMessage: boolean) {
        if (this.userNameChecker.isValidInput(this.inputValue)) {
            const prefix = isPersonalMessage ? 'VOUS: ' : '';
            const newMessage: Message = {
                text: prefix + this.inputValue,
                time: this.getCurrentTime(),
                isMessageText: this.isMessage,
                messageReceived: false,
            };
            const messageData = {
                gameId: this.gameData.gameID,
                message: this.inputValue,
            };
            if (this.isMessage) {
                this.socketService.send(ToServer.CHAT_MESSAGE, messageData);
            }
            this.pushMessage(newMessage);
            this.inputValue = '';
            this.isMessage = false;
        }
    }

    private getCurrentTime(): string {
        const now = new Date();
        const hours = this.formatTime(now.getHours());
        const minutes = this.formatTime(now.getMinutes());
        const seconds = this.formatTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    private formatTime(time: number): string {
        return time < TWO_DIGIT_TIME ? `0${time}` : `${time}`;
    }
}
