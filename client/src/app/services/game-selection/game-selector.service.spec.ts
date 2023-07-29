import { TestBed } from '@angular/core/testing';

import { GameSelectorService } from './game-selector.service';

describe('GameSelectorService', () => {
    let service: GameSelectorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameSelectorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call next when setting selection values', () => {
        spyOn(service.selectionValue, 'next');
        service.setSelectionValue('fakeName', 'fakeId');
        expect(service.selectionValue.next).toHaveBeenCalledWith({ buttonName: 'fakeName', id: 'fakeId' });
    });
});
