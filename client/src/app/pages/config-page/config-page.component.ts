import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameConstantsComponent } from '@app/components/config-selection/game-constants/game-constants.component';
import { HistoryComponent } from '@app/components/config-selection/history/history.component';
import { WarningDialogComponent } from '@app/components/config-selection/warning-dialog/warning-dialog.component';
import { DIALOG_CUSTOM_CONGIF } from '@app/constants/dialog-config';
import { GameSelection } from '@app/interfaces/game-card/game-selection';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-config-page',
    templateUrl: './config-page.component.html',
    styleUrls: ['./config-page.component.scss'],
})
export class ConfigPageComponent implements OnInit, OnDestroy {
    buttonNames: [string, string, string] = ['Supprimer', 'Réinitialiser top 3', 'Réinitialiser top 3'];
    private componentDestroyed$: Subject<void> = new Subject<void>();

    // eslint-disable-next-line max-params
    constructor(
        public dialog: MatDialog,
        public selectorService: GameSelectorService,
        public gameListManager: GameListManagerService,
        public socketService: SocketClientService,
    ) {}

    ngOnInit(): void {
        this.selectorService.selectionValue.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (values) => this.clickHandler(values));
    }

    ngOnDestroy(): void {
        this.componentDestroyed$.next();
        this.componentDestroyed$.complete();
    }

    requestGameConstants(): void {
        this.dialog.open(GameConstantsComponent, DIALOG_CUSTOM_CONGIF);
    }

    requestHistory(): void {
        this.dialog.open(HistoryComponent, DIALOG_CUSTOM_CONGIF);
    }

    warnPlayer(action: string) {
        const dialogConfig = Object.assign({}, DIALOG_CUSTOM_CONGIF);
        dialogConfig.data = action;
        return this.dialog.open(WarningDialogComponent, dialogConfig);
    }
    deleteAllGames() {
        const dialogRef = this.warnPlayer('supprimer tous les jeux');
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) this.gameListManager.deleteAllGames();
        });
    }
    resetAllBestTimes() {
        const dialogRef = this.warnPlayer('réinitialiser les meilleurs temps de tous les jeux');
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) this.gameListManager.resetAllBestTimes();
        });
    }

    private deleteGame(id: string) {
        const dialogRef = this.warnPlayer('supprimer ce jeu');
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) this.gameListManager.deleteGame(id);
        });
    }
    private clickHandler(values: GameSelection) {
        if (values.buttonName === this.buttonNames[0]) {
            this.deleteGame(values.id);
        } else {
            this.resetBestTimes(values.id);
        }
    }

    private resetBestTimes(id: string) {
        const dialogRef = this.warnPlayer('réinitialiser les meilleurs temps de ce jeu');
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) this.gameListManager.resetBestTimes(id);
        });
    }
}
