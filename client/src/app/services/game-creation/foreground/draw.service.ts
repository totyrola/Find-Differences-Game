import { Injectable } from '@angular/core';
import { ImageFileService } from '@app/services/divers/image-file.service';
import { Coordinates } from '@common/interfaces/general/coordinates';

@Injectable({
    providedIn: 'root',
})
export class DrawService {
    constructor(private imageFileService: ImageFileService) {}

    drawLine(start: Coordinates, end: Coordinates, context: CanvasRenderingContext2D): void {
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
    }

    fillSquare(center: Coordinates, edgeSize: number, context: CanvasRenderingContext2D): void {
        context.fillRect(center.x - edgeSize / 2, center.y - edgeSize / 2, edgeSize, edgeSize);
    }

    fillRectangle(corner: Coordinates, dimensions: Coordinates, context: CanvasRenderingContext2D): void {
        context.fillRect(corner.x, corner.y, dimensions.x, dimensions.y);
    }

    outlineRectangle(corner: Coordinates, dimensions: Coordinates, context: CanvasRenderingContext2D): void {
        context.strokeRect(corner.x, corner.y, dimensions.x, dimensions.y);
    }

    fillShape(corners: Coordinates[], context: CanvasRenderingContext2D): void {
        const firstCorner = corners.pop();
        if (firstCorner) {
            context.beginPath();
            context.moveTo(firstCorner.x, firstCorner.y);
            corners.forEach((corner) => {
                context.lineTo(corner.x, corner.y);
            });
            context.lineTo(firstCorner.x, firstCorner.y);
            context.fill();
        }
    }

    async clearCanvas(canvasDimensions: Coordinates, context: CanvasRenderingContext2D, initialForeground?: string): Promise<void> {
        if (initialForeground) {
            const foregroundImage = await this.imageFileService.loadImage(initialForeground);
            context.clearRect(0, 0, canvasDimensions.x, canvasDimensions.y);
            this.drawImage(foregroundImage, context);
        } else {
            context.clearRect(0, 0, canvasDimensions.x, canvasDimensions.y);
        }
    }

    drawImage(image: HTMLImageElement, context: CanvasRenderingContext2D, corner: Coordinates = { x: 0, y: 0 }): void {
        context.drawImage(image, corner.x, corner.y);
    }
}
