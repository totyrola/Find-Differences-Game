import { Component } from '@angular/core';
import { GameService } from '@app/services/game-play/game.service';

@Component({
    selector: 'app-display-hints',
    templateUrl: './display-hints.component.html',
    styleUrls: ['./display-hints.component.scss'],
})
export class DisplayHintsComponent {
    constructor(private gameService: GameService) {}

    get numberOfHints(): number {
        return this.gameService.totalHints;
    }

    get numberOfHintsLft(): number {
        return this.gameService.hintsLeft;
    }
}
