import { Component, OnInit } from '@angular/core';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { HistoryService } from '@app/services/game-config/history.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private gameList: GameListManagerService, private readonly historyService: HistoryService) {}

    ngOnInit(): void {
        this.gameList.init();
        this.historyService.init();
    }
}
