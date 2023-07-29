import { Coordinates } from '@common/interfaces/general/coordinates';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';

export abstract class AbstractTool {
    static size: number;
    static color: string;

    protected previousCoord: Coordinates;
    protected initialForeground: string;

    constructor(protected drawService: DrawService) {}

    onMouseDown(coord: Coordinates, initialForeground: string): void {
        this.previousCoord = coord;
        this.initialForeground = initialForeground;
    }

    onMouseUp?(): void;

    onKeyDown?(key: string, context: CanvasRenderingContext2D): void;

    onKeyUp?(key: string, context: CanvasRenderingContext2D): void;

    abstract onMouseMove(coord: Coordinates, context: CanvasRenderingContext2D): void;
}
