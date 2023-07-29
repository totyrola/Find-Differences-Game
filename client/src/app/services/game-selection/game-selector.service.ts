import { Injectable } from '@angular/core';
import { GameSelection } from '@app/interfaces/game-card/game-selection';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameSelectorService {
    selectionValue: Subject<GameSelection> = new Subject<{ buttonName: string; id: string }>();

    setSelectionValue(buttonName: string, id: string) {
        this.selectionValue.next({ buttonName, id } as GameSelection);
    }
}
