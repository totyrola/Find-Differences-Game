import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@app/constants/images-constants';
import { Coordinates } from '@common/interfaces/general/coordinates';
import { AbstractTool } from './abstract-tool';

export class Rectangle extends AbstractTool {
    private squareActive: boolean = false;
    private firstCornerCoord: Coordinates;
    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };

    onMouseDown(coord: Coordinates, initialForeground: string): void {
        super.onMouseDown(coord, initialForeground);
        this.firstCornerCoord = coord;
    }

    onMouseUp(): void {
        this.squareActive = false;
    }

    onMouseMove(coord: Coordinates, context: CanvasRenderingContext2D): void {
        this.makeRectangle(coord, context);
        this.previousCoord = coord;
    }

    onKeyDown(key: string, context: CanvasRenderingContext2D): void {
        if (key === 'Shift') {
            this.squareActive = true;
            this.makeRectangle(this.previousCoord, context);
        }
    }

    onKeyUp(key: string, context: CanvasRenderingContext2D): void {
        if (key === 'Shift') {
            this.squareActive = false;
            this.makeRectangle(this.previousCoord, context);
        }
    }

    private async makeRectangle(coord: Coordinates, context: CanvasRenderingContext2D) {
        await this.drawService.clearCanvas(this.canvasSize, context, this.initialForeground);
        context.fillStyle = AbstractTool.color;
        this.drawService.fillRectangle(this.firstCornerCoord, this.calculateDimensions(this.firstCornerCoord, coord), context);
    }

    private calculateDimensions(start: Coordinates, end: Coordinates): Coordinates {
        const width = end.x - start.x;
        const height = end.y - start.y;
        if (!this.squareActive) {
            return { x: width, y: height };
        } else {
            if (Math.abs(width) < Math.abs(height)) {
                return { x: width, y: this.changeModule(height, width) };
            } else {
                return { x: this.changeModule(width, height), y: height };
            }
        }
    }

    private changeModule(initialNumber: number, module: number): number {
        return (initialNumber / Math.abs(initialNumber)) * Math.abs(module);
    }
}
