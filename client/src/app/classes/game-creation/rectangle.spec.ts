/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvasTestHelper } from '@app/classes/test-helpers/canvas-test-helper';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { AbstractTool } from './abstract-tool';
import { Rectangle } from './rectangle';
import SpyObj = jasmine.SpyObj;

describe('Rectangle', () => {
    let rectangle: Rectangle;
    let drawServiceSpy: SpyObj<DrawService>;
    let ctxStub: CanvasRenderingContext2D;

    beforeEach(() => {
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['clearCanvas', 'fillRectangle']);
        ctxStub = CanvasTestHelper.createCanvas(1, 1).getContext('2d') as CanvasRenderingContext2D;
        rectangle = new Rectangle(drawServiceSpy);
    });

    it('should be created', () => {
        expect(rectangle).toBeTruthy();
    });

    it('onMouseMove should update the previous coord', () => {
        spyOn<any>(rectangle, 'makeRectangle');
        const previousCoord = { x: -1, y: 0 };
        const coord = { x: 1, y: 2 };
        rectangle['previousCoord'] = previousCoord;
        rectangle.onMouseMove(coord, ctxStub);
        expect(rectangle['previousCoord']).toEqual(coord);
    });

    it('onMouseMove should call makeRectangle', () => {
        const makeRectangleSpy = spyOn<any>(rectangle, 'makeRectangle');
        const coord = { x: 1, y: 2 };
        rectangle.onMouseMove(coord, ctxStub);
        expect(makeRectangleSpy).toHaveBeenCalledWith(coord, ctxStub);
    });

    it('onMouseUp should make the square inactive', () => {
        rectangle['squareActive'] = true;
        rectangle.onMouseUp();
        expect(rectangle['squareActive']).toEqual(false);
    });

    it('onMouseDown should update the first corner coordinate', () => {
        spyOn(AbstractTool.prototype, 'onMouseDown');
        rectangle['firstCornerCoord'] = { x: 0, y: 0 };
        const coord = { x: 1, y: 2 };
        rectangle.onMouseDown(coord, '');
        expect(rectangle['firstCornerCoord']).toEqual(coord);
    });

    it('onMouseDown should call AbstractToolService.onMouseDown', () => {
        const parentMouseDownSpy = spyOn(AbstractTool.prototype, 'onMouseDown');
        const coord = { x: 1, y: 2 };
        const initialForeground = 'test';
        rectangle.onMouseDown(coord, initialForeground);
        expect(parentMouseDownSpy).toHaveBeenCalledWith(coord, initialForeground);
    });

    it('onKeyDown should make the square active if the key is shift', () => {
        spyOn<any>(rectangle, 'makeRectangle');
        rectangle['squareActive'] = false;
        rectangle.onKeyDown('Shift', ctxStub);
        expect(rectangle['squareActive']).toEqual(true);
    });

    it('onKeyDown should call makeRectangle if the key is shift', () => {
        const makeRectangleSpy = spyOn<any>(rectangle, 'makeRectangle');
        const previousCoord = { x: -1, y: 0 };
        rectangle['previousCoord'] = previousCoord;
        rectangle.onKeyDown('Shift', ctxStub);
        expect(makeRectangleSpy).toHaveBeenCalledWith(previousCoord, ctxStub);
    });

    it('onKeyDown should do nothing the key is not shift', () => {
        spyOn<any>(rectangle, 'makeRectangle');
        rectangle['squareActive'] = false;
        rectangle.onKeyDown('a', ctxStub);
        expect(rectangle['squareActive']).toEqual(false);
    });

    it('onKeyUp should make the square inactive if the key is shift', () => {
        spyOn<any>(rectangle, 'makeRectangle');
        rectangle['squareActive'] = true;
        rectangle.onKeyUp('Shift', ctxStub);
        expect(rectangle['squareActive']).toEqual(false);
    });

    it('onKeyUp should call makeRectangle if the key is shift', () => {
        const makeRectangleSpy = spyOn<any>(rectangle, 'makeRectangle');
        const previousCoord = { x: -1, y: 0 };
        rectangle['previousCoord'] = previousCoord;
        rectangle.onKeyUp('Shift', ctxStub);
        expect(makeRectangleSpy).toHaveBeenCalledWith(previousCoord, ctxStub);
    });

    it('onKeyUp should do nothing the key is not shift', () => {
        spyOn<any>(rectangle, 'makeRectangle');
        rectangle['squareActive'] = true;
        rectangle.onKeyUp('a', ctxStub);
        expect(rectangle['squareActive']).toEqual(true);
    });

    it('changeModule should return a number with the same sign as the original number and with the module given', () => {
        const FIRST_NUMBER = 1;
        const SECOND_NUMBER = 5;
        const THIRD_NUMBER = -3;
        const FIRST_MODULE = 4;
        const SECOND_MODULE = 6;
        const THIRD_MODULE = 10;
        expect(rectangle['changeModule'](FIRST_NUMBER, FIRST_MODULE)).toEqual(FIRST_MODULE);
        expect(rectangle['changeModule'](SECOND_NUMBER, SECOND_MODULE)).toEqual(SECOND_MODULE);
        expect(rectangle['changeModule'](THIRD_NUMBER, THIRD_MODULE)).toEqual(-THIRD_MODULE);
    });

    it('makeRectangle should call clearCanvas', async () => {
        const initialForeground = 'test foreground';
        rectangle['initialForeground'] = initialForeground;
        spyOn<any>(rectangle, 'calculateDimensions');
        await rectangle['makeRectangle']({ x: 0, y: 0 }, ctxStub);
        expect(drawServiceSpy.clearCanvas).toHaveBeenCalledWith(rectangle['canvasSize'], ctxStub, initialForeground);
    });

    it('makeRectangle should call fillRectangle', async () => {
        const calculatedDimensions = { x: 10, y: 20 };
        const firstCornerCoord = { x: 3, y: 4 };
        rectangle['firstCornerCoord'] = firstCornerCoord;
        spyOn<any>(rectangle, 'calculateDimensions').and.returnValue(calculatedDimensions);
        await rectangle['makeRectangle']({ x: 0, y: 0 }, ctxStub);
        expect(drawServiceSpy.fillRectangle).toHaveBeenCalledWith(firstCornerCoord, calculatedDimensions, ctxStub);
    });

    it('makeRectangle should call calculateDimensions', async () => {
        const firstCornerCoord = { x: 3, y: 4 };
        const coord = { x: 1, y: 2 };
        rectangle['firstCornerCoord'] = firstCornerCoord;
        const calculateDimensionsSpy = spyOn<any>(rectangle, 'calculateDimensions');
        await rectangle['makeRectangle'](coord, ctxStub);
        expect(calculateDimensionsSpy).toHaveBeenCalledWith(firstCornerCoord, coord);
    });

    it('makeRectangle should change the fillStyle of the context', async () => {
        const color = '#123456';
        AbstractTool.color = color;
        spyOn<any>(rectangle, 'calculateDimensions');
        await rectangle['makeRectangle']({ x: 0, y: 0 }, ctxStub);
        expect(ctxStub.fillStyle).toEqual(color);
    });

    it('calculateDimensions should return difference of x and y if square is not active', () => {
        spyOn<any>(rectangle, 'changeModule');
        const start = { x: 1, y: 2 };
        const end = { x: -4, y: 10 };
        const width = end.x - start.x;
        const height = end.y - start.y;
        rectangle['squareActive'] = false;
        expect(rectangle['calculateDimensions'](start, end)).toEqual({ x: width, y: height });
    });

    it('calculateDimensions should call changeModule with the width module if square is active and |width| < |height|', () => {
        const changeModuleSpy = spyOn<any>(rectangle, 'changeModule');
        const start = { x: 1, y: 2 };
        const end = { x: -4, y: 10 };
        const width = end.x - start.x;
        const height = end.y - start.y;
        rectangle['squareActive'] = true;
        rectangle['calculateDimensions'](start, end);
        expect(changeModuleSpy).toHaveBeenCalledWith(height, width);
    });

    it('calculateDimensions should call changeModule with the height module if square is active and |height| < |width|', () => {
        const changeModuleSpy = spyOn<any>(rectangle, 'changeModule');
        const start = { x: 20, y: 2 };
        const end = { x: -4, y: 10 };
        const width = end.x - start.x;
        const height = end.y - start.y;
        rectangle['squareActive'] = true;
        rectangle['calculateDimensions'](start, end);
        expect(changeModuleSpy).toHaveBeenCalledWith(width, height);
    });
});
