import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ERROR_HEIGHT, ERROR_WIDTH, HINT_DURATION, PENALITY_DURATION } from '@app/constants/game-constants';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@app/constants/images-constants';
import { DelayService } from '@app/services/divers/delay.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { GameDataService } from '@app/services/game-play/game-data.service';
import { GameService } from '@app/services/game-play/game.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { Hint } from '@common/interfaces/game-play/hint';
import { Coordinates } from '@common/interfaces/general/coordinates';
import { ToServer } from '@common/socket-event-constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit, OnDestroy {
    @Input() name: string;
    @Input() isModified: boolean;
    @Input() backgroundImageUrl: string;
    @ViewChild('canvas') canvas: ElementRef;
    errorIsVisible: boolean = false;
    errorX: number;
    errorY: number;
    errorWidth: number = ERROR_WIDTH;
    errorHeight: number = ERROR_HEIGHT;

    private gameId: string;
    private clickCoordinates: Coordinates;
    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };
    private displayedHints: Hint[] = [];

    private componentDestroyed$: Subject<void> = new Subject<void>();

    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketClientService,
        private gameData: GameDataService,
        private gameService: GameService,
        private drawService: DrawService,
        private replayService: ReplayService,
        private delayService: DelayService,
    ) {
        this.gameId = this.gameData.gameID;
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    ngOnInit(): void {
        this.gameService.hintEvent.pipe(takeUntil(this.componentDestroyed$)).subscribe(this.addHint.bind(this));
        this.replayService.replayEvent.subscribe(this.reset.bind(this));
    }

    ngOnDestroy(): void {
        this.componentDestroyed$.next();
        this.componentDestroyed$.complete();
    }

    mouseHitDetect(event: MouseEvent): void {
        const mousePosition = { x: event.offsetX, y: event.offsetY };
        this.replayService.doAndStore(() => this.setClickCoordinates(mousePosition));
        this.requestServerCheck(mousePosition);
    }

    async showErrorMessage(): Promise<void> {
        this.errorX = this.calculateErrorCoordinate(this.clickCoordinates.x, this.errorWidth, this.width);
        this.errorY = this.calculateErrorCoordinate(this.clickCoordinates.y, this.errorHeight, this.height);
        this.errorIsVisible = true;
        await this.delayService.wait(PENALITY_DURATION);
        this.errorIsVisible = false;
    }

    private setClickCoordinates(coordinates: Coordinates) {
        this.clickCoordinates = coordinates;
    }

    private async addHint(hint: Hint): Promise<void> {
        this.replayService.store(async () => this.addHint(hint));
        this.displayedHints.push(hint);
        this.displayHints();
        await this.delayService.wait(HINT_DURATION);
        this.hideHint();
    }

    private displayHints(): void {
        const context = this.canvas.nativeElement.getContext('2d');
        this.drawService.clearCanvas(this.canvasSize, context);
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.strokeStyle = 'yellow';
        context.lineWidth = 3;
        this.displayedHints.forEach((hint) => {
            const dimensions = { x: hint.end.x - hint.start.x, y: hint.end.y - hint.start.y };
            this.drawService.fillRectangle(hint.start, dimensions, context);
            this.drawService.outlineRectangle(hint.start, dimensions, context);
        });
    }

    private hideHint(): void {
        this.displayedHints.shift();
        this.displayHints();
    }

    private requestServerCheck(coordinates: Coordinates): void {
        const clickMessage = {
            gameId: this.gameId,
            x: coordinates.x,
            y: coordinates.y,
        };
        this.replayService.doAndStore(() => this.setLastClickArea());
        this.socketService.send(ToServer.CLICK, clickMessage);
    }

    private setLastClickArea(): void {
        this.gameService.lastClickArea = this;
    }

    private calculateErrorCoordinate(clickCoordinate: number, messageDimension: number, boundary: number): number {
        if (clickCoordinate - messageDimension / 2 < 0) {
            return 0;
        } else if (clickCoordinate + messageDimension / 2 > boundary) {
            return boundary - messageDimension;
        } else {
            return clickCoordinate - messageDimension / 2;
        }
    }

    private reset() {
        this.errorIsVisible = false;
        this.displayedHints = [];
    }
}
