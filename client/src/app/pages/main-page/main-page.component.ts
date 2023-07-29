import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserNameDialogComponent } from '@app/components/config-selection/user-name-dialog/user-name-dialog.component';
// eslint-disable-next-line max-len
import { TimedSelectionModalComponent } from '@app/components/config-selection/timed-selection-modal/timed-selection-modal.component';
import { DIALOG_CUSTOM_CONGIF } from '@app/constants/dialog-config';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { GameDataService } from '@app/services/game-play/game-data.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit {
    playerName: string;
    constructor(private dialog: MatDialog, private gameList: GameListManagerService, public gameData: GameDataService) {}

    ngOnInit(): void {
        this.gameList.init();
    }

    requestUsername(): void {
        const usernameDialogRef = this.dialog.open(UserNameDialogComponent, DIALOG_CUSTOM_CONGIF);
        usernameDialogRef.afterClosed().subscribe((username: string | undefined) => {
            if (username) {
                const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
                dialogConfig.data = { playerName: username };
                this.dialog.open(TimedSelectionModalComponent, dialogConfig);
            }
        });
    }
}
