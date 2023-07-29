import { Coordinates } from '@common/interfaces/general/coordinates';
import { AbstractTool } from './abstract-tool';

export class Pencil extends AbstractTool {
    onMouseMove(coord: Coordinates, context: CanvasRenderingContext2D): void {
        context.strokeStyle = AbstractTool.color;
        context.lineWidth = AbstractTool.size;
        context.lineCap = 'round';
        this.drawService.drawLine(this.previousCoord, coord, context);
        this.previousCoord = coord;
    }
}
