import { EventEmitter, Injectable } from '@angular/core';
import { PlayAreaComponent } from '@app/components/game-play/play-area/play-area.component';
import { NUMBER_FALSE_HINTS, TOTAL_NUMBER_HINTS } from '@app/constants/game-constants';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@app/constants/images-constants';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { Hint } from '@common/interfaces/difference-locator-algorithm/hint';
import { DifferenceImages } from '@common/interfaces/game-play/difference-images';
import { FromServer } from '@common/socket-event-constants';
import { ReplayService } from './replay.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    canCheat: boolean = true;
    differencesFound: number = 0;
    totalDifferences: number;
    differencesFoundTotal: number;
    hintsLeft: number;
    totalHints: number;
    lastClickArea: PlayAreaComponent;

    differenceFoundEvent: EventEmitter<DifferenceImages> = new EventEmitter<{
        differenceNaturalOverlay: string;
        differenceFlashOverlay: string;
    }>();
    cheatEvent: EventEmitter<(string | undefined)[]> = new EventEmitter<(string | undefined)[]>();
    removeCheatEvent: EventEmitter<number> = new EventEmitter<number>();
    hintEvent: EventEmitter<Hint> = new EventEmitter<Hint>();

    private isCheating: boolean = false;
    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };

    constructor(private socketService: SocketClientService, private replayService: ReplayService) {
        this.reset();
        this.socketService.on(FromServer.HINT, this.receiveHint.bind(this));
        this.socketService.on(FromServer.CHEAT_INDEX, this.removeCheatIndex.bind(this));
    }

    get cheating() {
        return this.isCheating;
    }

    set cheating(value: boolean) {
        if (this.canCheat) {
            this.replayService.doAndStore(() => (this.isCheating = value));
        }
    }

    showErrorMessage() {
        this.lastClickArea.showErrorMessage();
    }

    reset() {
        this.cheating = false;
        this.differencesFound = 0;
        this.hintsLeft = TOTAL_NUMBER_HINTS;
        this.totalHints = TOTAL_NUMBER_HINTS;
    }

    incrementDifferencesFound(differenceImages: DifferenceImages) {
        this.flashDifferences(differenceImages);
        this.differencesFound++;
    }

    flashDifferences(differenceImages: DifferenceImages) {
        this.differenceFoundEvent.emit(differenceImages);
    }

    cheat(cheatImages: (string | undefined)[]) {
        this.cheatEvent.emit(cheatImages);
    }

    removeCheatIndex(index: number) {
        this.removeCheatEvent.emit(index);
    }

    private receiveHint(hint: Hint): void {
        const hints = [];
        hints.push(hint);
        if (this.hintsLeft === 0) {
            for (let i = 0; i < NUMBER_FALSE_HINTS; i++) {
                hints.push(this.createFalseHint(hint, hints));
            }
        }
        hints.forEach((h) => this.hintEvent.emit(h));
    }

    private random(lowest: number, highest: number): number {
        return lowest + Math.random() * (highest - lowest);
    }

    private isOverlapping(zone1: Hint, zone2: Hint): boolean {
        return zone1.end.x >= zone2.start.x && zone1.start.x <= zone2.end.x && zone1.start.y <= zone2.end.y && zone1.end.y >= zone2.start.y;
    }

    private createFalseHint(hint: Hint, hintList: Hint[]): Hint {
        const dimensions = { x: hint.end.x - hint.start.x, y: hint.end.y - hint.start.y };
        let falseHint: Hint;
        do {
            const x = this.random(0, this.canvasSize.x - dimensions.x);
            const y = this.random(0, this.canvasSize.y - dimensions.y);
            falseHint = { start: { x, y }, end: { x: x + dimensions.x, y: y + dimensions.y } };
        } while (hintList.reduce((acc, h) => acc || this.isOverlapping(falseHint, h), false));
        return falseHint;
    }
}
