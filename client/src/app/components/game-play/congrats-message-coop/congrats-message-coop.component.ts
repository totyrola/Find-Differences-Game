import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatService } from '@app/services/game-play/chat.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { EndgameOutputDto } from '@common/interfaces/game-play/game-endgame.dto';
import { PlayerRecord } from '@common/interfaces/records/player-record';

@Component({
    selector: 'app-congrats-message-coop',
    templateUrl: './congrats-message-coop.component.html',
    styleUrls: ['./congrats-message-coop.component.scss'],
})
export class CongratsMessageCoopComponent implements OnInit {
    winner: PlayerRecord;
    isWinner: boolean = false;

    // eslint-disable-next-line max-params
    constructor(
        private dialogRef: MatDialogRef<CongratsMessageCoopComponent>,
        public chatService: ChatService,
        private router: Router,
        private replayService: ReplayService,
        @Inject(MAT_DIALOG_DATA) public data: { message: EndgameOutputDto; replayIsAvailable: boolean },
    ) {}
    ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.winner = this.data.message.players[0].winner ? this.data.message.players[0] : this.data.message.players[1];
        if (this.chatService.gameData && this.winner.name === this.chatService.gameData.name) {
            this.isWinner = true;
        }
    }

    closePopup(replay: boolean): void {
        this.dialogRef.close();
        if (replay) {
            this.replayService.restart();
        } else {
            this.router.navigateByUrl('/home');
        }
        this.chatService.recordBeaterMessage = '';
    }
}
