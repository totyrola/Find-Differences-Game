import { CanvasTestHelper } from '@app/classes/test-helpers/canvas-test-helper';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { AbstractTool } from './abstract-tool';
import { Pencil } from './pencil';
import SpyObj = jasmine.SpyObj;

describe('Pencil', () => {
    let pencil: Pencil;
    let drawServiceSpy: SpyObj<DrawService>;
    let ctxStub: CanvasRenderingContext2D;

    beforeEach(() => {
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['drawLine']);
        ctxStub = CanvasTestHelper.createCanvas(1, 1).getContext('2d') as CanvasRenderingContext2D;
        pencil = new Pencil(drawServiceSpy);
    });

    it('should be created', () => {
        expect(pencil).toBeTruthy();
    });

    it('onMouseMove should change the strokeStyle', () => {
        const coord = { x: 1, y: 2 };
        const color = '#123456';
        AbstractTool.color = color;
        pencil.onMouseMove(coord, ctxStub);
        expect(ctxStub.strokeStyle).toEqual(color);
    });

    it('onMouseMove should change the lineWidth', () => {
        const coord = { x: 1, y: 2 };
        const lineWidth = 10;
        AbstractTool.size = lineWidth;
        pencil.onMouseMove(coord, ctxStub);
        expect(ctxStub.lineWidth).toEqual(lineWidth);
    });

    it('onMouseMove should change the lineCap', () => {
        const coord = { x: 1, y: 2 };
        pencil.onMouseMove(coord, ctxStub);
        expect(ctxStub.lineCap).toEqual('round');
    });

    it('onMouseMove should call drawLine of DrawService', () => {
        const previousCoord = { x: -1, y: 0 };
        const coord = { x: 1, y: 2 };
        pencil['previousCoord'] = previousCoord;
        pencil.onMouseMove(coord, ctxStub);
        expect(drawServiceSpy.drawLine).toHaveBeenCalledWith(previousCoord, coord, ctxStub);
    });

    it('onMouseMove should update the previous coord', () => {
        const previousCoord = { x: -1, y: 0 };
        const coord = { x: 1, y: 2 };
        pencil['previousCoord'] = previousCoord;
        pencil.onMouseMove(coord, ctxStub);
        expect(pencil['previousCoord']).toEqual(coord);
    });
});
