import { Coordinates } from '@common/interfaces/general/coordinates';
import { AbstractTool } from './abstract-tool';

export class Eraser extends AbstractTool {
    onMouseMove(coord: Coordinates, context: CanvasRenderingContext2D): void {
        this.erase(this.previousCoord, coord, context);
        this.previousCoord = coord;
    }

    private erase(start: Coordinates, end: Coordinates, context: CanvasRenderingContext2D): void {
        context.globalCompositeOperation = 'destination-out';
        this.drawService.fillSquare(start, AbstractTool.size, context);
        this.drawService.fillSquare(end, AbstractTool.size, context);
        this.drawService.fillShape(this.parallelogramCorners(start, end, AbstractTool.size), context);
        context.globalCompositeOperation = 'source-over';
    }

    private parallelogramCorners(start: Coordinates, end: Coordinates, edgeSize: number): Coordinates[] {
        const sign = this.signFromDirection(start, end);
        return [
            { x: start.x - (sign * edgeSize) / 2, y: start.y + edgeSize / 2 },
            { x: start.x + (sign * edgeSize) / 2, y: start.y - edgeSize / 2 },
            { x: end.x + (sign * edgeSize) / 2, y: end.y - edgeSize / 2 },
            { x: end.x - (sign * edgeSize) / 2, y: end.y + edgeSize / 2 },
        ];
    }

    private signFromDirection(start: Coordinates, end: Coordinates) {
        const SAME_DIRECTION_SIGN = 1;
        const OPPOSITE_DIRECTION_SIGN = -1;
        return this.xyAreInSameDirection(start, end) ? SAME_DIRECTION_SIGN : OPPOSITE_DIRECTION_SIGN;
    }

    private xyAreInSameDirection(start: Coordinates, end: Coordinates): boolean {
        return this.sign(end.x - start.x) === this.sign(end.y - start.y);
    }

    private sign(n: number): number {
        if (n) {
            return n / Math.abs(n);
        } else {
            return 1;
        }
    }
}
