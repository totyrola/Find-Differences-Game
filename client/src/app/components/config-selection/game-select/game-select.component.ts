import { Component, Input } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Game } from '@app/classes/game-play/game';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';

@Component({
    selector: 'app-game-select',
    templateUrl: './game-select.component.html',
    styleUrls: ['./game-select.component.scss'],
})
export class GameSelectComponent implements SafeResourceUrl {
    @Input() rightButtonNames: [string, string] = ['', ''];
    @Input() leftButtonName: string = '';
    @Input() game: Game;
    @Input() difficulty: string;

    constructor(public selectorService: GameSelectorService) {}

    sendSelection(buttonName: string) {
        this.selectorService.setSelectionValue(buttonName, this.game.cardId);
    }
}
