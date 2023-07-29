/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvasTestHelper } from '@app/classes/test-helpers/canvas-test-helper';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { Eraser } from './eraser';
import SpyObj = jasmine.SpyObj;

describe('Eraser', () => {
    let eraser: Eraser;
    let drawServiceSpy: SpyObj<DrawService>;
    let ctxStub: CanvasRenderingContext2D;

    beforeEach(() => {
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['fillSquare', 'fillShape']);
        ctxStub = CanvasTestHelper.createCanvas(1, 1).getContext('2d') as CanvasRenderingContext2D;
        eraser = new Eraser(drawServiceSpy);
    });

    it('should be created', () => {
        expect(eraser).toBeTruthy();
    });

    it('onMouseMove should update the previous coord', () => {
        spyOn<any>(eraser, 'erase');
        const previousCoord = { x: -1, y: 0 };
        const coord = { x: 1, y: 2 };
        eraser['previousCoord'] = previousCoord;
        eraser.onMouseMove(coord, ctxStub);
        expect(eraser['previousCoord']).toEqual(coord);
    });

    it('onMouseMove should call erase', () => {
        const eraseSpy = spyOn<any>(eraser, 'erase');
        const previousCoord = { x: -1, y: 0 };
        const coord = { x: 1, y: 2 };
        eraser['previousCoord'] = previousCoord;
        eraser.onMouseMove(coord, ctxStub);
        expect(eraseSpy).toHaveBeenCalledWith(previousCoord, coord, ctxStub);
    });

    it('erase should call fillSquare of DrawService', () => {
        eraser['erase']({ x: 0, y: 0 }, { x: 0, y: 0 }, ctxStub);
        expect(drawServiceSpy.fillSquare).toHaveBeenCalled();
    });

    it('erase should call fillShape of DrawService', () => {
        eraser['erase']({ x: 0, y: 0 }, { x: 0, y: 0 }, ctxStub);
        expect(drawServiceSpy.fillShape).toHaveBeenCalled();
    });

    it('sign should return 1 for a positive number', () => {
        const POSITIVE_NUMBER = 3;
        expect(eraser['sign'](POSITIVE_NUMBER)).toEqual(1);
    });

    it('sign should return -1 for a negative number', () => {
        const NEGATIVE_NUMBER = -3;
        const NEGATIVE_SIGN = -1;
        expect(eraser['sign'](NEGATIVE_NUMBER)).toEqual(NEGATIVE_SIGN);
    });

    it('sign should return 1 for a 0', () => {
        expect(eraser['sign'](0)).toEqual(1);
    });

    it('signFromDirection should return 1 for x and y distance in the same direction', () => {
        const SAME_DIRECTION_SIGN = 1;
        spyOn<any>(eraser, 'xyAreInSameDirection').and.returnValue(true);
        expect(eraser['signFromDirection']({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual(SAME_DIRECTION_SIGN);
    });

    it('signFromDirection should return -1 for x and y distance not in the same direction', () => {
        const OPPOSITE_DIRECTION_SIGN = -1;
        spyOn<any>(eraser, 'xyAreInSameDirection').and.returnValue(false);
        expect(eraser['signFromDirection']({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual(OPPOSITE_DIRECTION_SIGN);
    });

    it('xyAreInSameDirection should return true for x and y distance in the same direction', () => {
        expect(eraser['xyAreInSameDirection']({ x: 1, y: 3 }, { x: 6, y: 10 })).toBeTruthy();
        expect(eraser['xyAreInSameDirection']({ x: 1, y: 3 }, { x: -6, y: -10 })).toBeTruthy();
    });

    it('xyAreInSameDirection should return false for x and y distance in the same direction', () => {
        expect(eraser['xyAreInSameDirection']({ x: 1, y: 3 }, { x: -6, y: 10 })).toBeFalsy();
        expect(eraser['xyAreInSameDirection']({ x: 1, y: 3 }, { x: 6, y: -10 })).toBeFalsy();
    });

    it('parallelogramCorners should call signFromDirection', () => {
        const start = { x: 1, y: 3 };
        const end = { x: 6, y: 10 };
        const parallelogramSignSpy = spyOn<any>(eraser, 'signFromDirection');
        eraser['parallelogramCorners'](start, end, 1);
        expect(parallelogramSignSpy).toHaveBeenCalledWith(start, end);
    });

    it('should calculate de corners of the parallelogram connecting the starting and the ending square', () => {
        const start = { x: 1, y: 3 };
        const end = { x: 6, y: 10 };
        const expectedCorners = [
            { x: 7, y: 9 },
            { x: 5, y: 11 },
            { x: 0, y: 4 },
            { x: 2, y: 2 },
        ];
        const edgeSize = 2;
        spyOn<any>(eraser, 'signFromDirection').and.returnValue(1);
        const calculatedCorners = eraser['parallelogramCorners'](start, end, edgeSize);
        expectedCorners.forEach((corner) => expect(calculatedCorners).toContain(corner));
        expect(calculatedCorners.length).toEqual(expectedCorners.length);
    });
});
