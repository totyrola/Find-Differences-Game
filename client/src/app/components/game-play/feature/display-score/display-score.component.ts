import { Component, Input } from '@angular/core';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameService } from '@app/services/game-play/game.service';
import { GameMode } from '@common/enums/game-play/game-mode';

@Component({
    selector: 'app-display-score',
    templateUrl: './display-score.component.html',
    styleUrls: ['./display-score.component.scss'],
})
export class DisplayScoreComponent {
    @Input() firstPlayerScore: number;
    @Input() secondPlayerScore: number;
    @Input() isMultiplayer: boolean;
    constructor(public gameService: GameService, public gameData: GameDataService) {}

    get differencesLeft(): number | undefined {
        if (this.gameData.nbOfPlayers === 1) {
            return this.gameService.totalDifferences;
        } else {
            return Math.ceil(this.gameService.totalDifferences / 2);
        }
    }

    differencesFound(score: number): number {
        if (this.gameData.nbOfPlayers === 1) {
            this.gameService.differencesFoundTotal = this.gameService.differencesFound;
            return this.gameService.differencesFound;
        } else {
            this.gameService.differencesFoundTotal = score;
            return score;
        }
    }

    isLimitedTimeMode(): boolean {
        return this.gameData.gameMode === GameMode.LimitedTimeSolo || this.gameData.gameMode === GameMode.LimitedTimeCoop;
    }
}
