import { TestBed } from '@angular/core/testing';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { Coordinates } from '@common/interfaces/general/coordinates';
import { AbstractTool } from './abstract-tool';
import SpyObj = jasmine.SpyObj;

class DummyTool extends AbstractTool {
    // eslint-disable-next-line no-unused-vars
    onMouseMove(coord: Coordinates, context: CanvasRenderingContext2D): void {
        // Dummy method
    }
}

describe('AbstractTool', () => {
    let tool: AbstractTool;
    let drawServiceSpy: SpyObj<DrawService>;

    beforeEach(() => {
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['fillSquare', 'fillShape']);
        TestBed.configureTestingModule({});
        tool = new DummyTool(drawServiceSpy);
    });

    it('should be created', () => {
        expect(tool).toBeTruthy();
    });

    it('should save the previousCoord and the initialForeground on mouse down', () => {
        tool['previousCoord'] = { x: 0, y: 0 };
        tool['initialForeground'] = '';
        const previousCoord = { x: 1, y: 2 };
        const initialForeground = 'test';
        tool.onMouseDown(previousCoord, initialForeground);
        expect(tool['previousCoord']).toEqual(previousCoord);
        expect(tool['initialForeground']).toEqual(initialForeground);
    });
});
