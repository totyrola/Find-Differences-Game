import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { SimpleUser } from '@common/interfaces/game-play/simple-user';
import { FromServer, ToServer } from '@common/socket-event-constants';

@Component({
    selector: 'app-awaiting-players-modal',
    templateUrl: './awaiting-players-modal.component.html',
    styleUrls: ['./awaiting-players-modal.component.scss'],
})
export class AwaitingPlayersModalComponent implements OnDestroy, OnInit {
    static opened = false;
    constructor(
        public dialogRef: MatDialogRef<AwaitingPlayersModalComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { gameId: string; waitingPlayers: SimpleUser[]; displayMessage: number },
        private socketService: SocketClientService,
    ) {
        dialogRef.disableClose = true;
    }
    ngOnDestroy(): void {
        this.socketService.removeListener(FromServer.RESPONSE_TO_JOIN_GAME_REQUEST);
        AwaitingPlayersModalComponent.opened = false;
    }

    ngOnInit() {
        AwaitingPlayersModalComponent.opened = true;
    }

    closeDialog() {
        this.dialogRef.close();
        this.socketService.send(ToServer.LEAVE_GAME, this.data.gameId);
    }

    validatePlayer(canJoin: boolean, playerId: string, playerName: string) {
        const waitingPlayer = {
            name: playerName,
            id: playerId,
        };
        if (canJoin) {
            try {
                this.data.waitingPlayers[0] = waitingPlayer;
            } catch (e) {
                canJoin = false;
            }
        }
        this.socketService.send(ToServer.PLAYER_VALIDATION, {
            playerId,
            gameId: this.data.gameId,
            canJoin,
        });
    }
}
