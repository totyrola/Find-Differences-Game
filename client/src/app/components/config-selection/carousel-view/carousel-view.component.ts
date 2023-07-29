import { Component, Input } from '@angular/core';
import { Game } from '@app/classes/game-play/game';
import { CARDS_MAX_CAPACITY } from '@app/constants/game-selection-constants';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { Difficulty } from '@common/enums/game-play/difficulty';

@Component({
    selector: 'app-carousel-view',
    templateUrl: './carousel-view.component.html',
    styleUrls: ['./carousel-view.component.scss'],
})
export class CarouselViewComponent {
    @Input() buttonNames: [string, string, string] = ['', '', ''];
    private startIndex: number = 0;

    constructor(public gameListManager: GameListManagerService) {}

    getDifficulty(value: Difficulty): string {
        let difficulty: string;
        switch (value) {
            case Difficulty.Easy:
                difficulty = 'facile';
                break;
            case Difficulty.Hard:
                difficulty = 'difficile';
                break;
            default:
                difficulty = 'moyen';
        }
        return difficulty;
    }

    getDisplayedItems(): Game[] {
        if (this.canGoRight() || this.canGoLeft()) {
            const displayedGames = this.gameListManager.games.slice(this.startIndex, this.startIndex + CARDS_MAX_CAPACITY);
            if (displayedGames.length === 0) this.goLeft();
            return displayedGames;
        }
        return this.gameListManager.games;
    }

    canGoRight(): boolean {
        return this.startIndex + CARDS_MAX_CAPACITY < this.gameListManager.games.length;
    }

    canGoLeft(): boolean {
        return this.startIndex - CARDS_MAX_CAPACITY >= 0;
    }

    goLeft() {
        this.startIndex -= 4;
        this.getDisplayedItems();
    }

    goRight() {
        this.startIndex += 4;
        this.getDisplayedItems();
    }
}
