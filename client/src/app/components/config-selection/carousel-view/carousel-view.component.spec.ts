/* eslint-disable max-classes-per-file */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/classes/game-play/game';
import { SafeUrlPipe } from '@app/classes/pipes/safe-url-pipe';
import { CARDS_MAX_CAPACITY } from '@app/constants/game-selection-constants';
import { FAKE_GAMES } from '@app/constants/game-selection-test-constants';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { CarouselViewComponent } from './carousel-view.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-arrow-game-selection', template: '' })
class ArrowGameSelectionStubComponent {
    @Input() flip: boolean;
    @Output() buttonClick: EventEmitter<null> = new EventEmitter();
    @Input() activated: boolean;
}

@Component({ selector: 'app-game-select', template: '' })
class GameSelectStubComponent {
    @Input() rightButtonNames: [string, string] = ['', ''];
    @Input() leftButtonName: string = '';
    @Input() game: Game;
    @Input() difficulty: string;
}
describe('CarouselViewComponent', () => {
    const fakeGames: Game[] = [];
    let component: CarouselViewComponent;
    let fixture: ComponentFixture<CarouselViewComponent>;
    let gameListSpy: SpyObj<GameListManagerService>;
    let socketServiceSpy: SpyObj<SocketClientService>;

    beforeAll(() => {
        FAKE_GAMES.forEach((game) => {
            fakeGames.push(new Game(game));
        });
    });

    beforeEach(async () => {
        gameListSpy = jasmine.createSpyObj('gameListSpy', ['init'], { games: [] });
        socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'removeListener']);
        await TestBed.configureTestingModule({
            declarations: [CarouselViewComponent, GameSelectStubComponent, SafeUrlPipe, ArrowGameSelectionStubComponent],
            providers: [
                { provide: GameListManagerService, useValue: gameListSpy },
                { provide: SocketClientService, useValue: socketServiceSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CarouselViewComponent);
        component = fixture.componentInstance;
        fakeGames.forEach((game) => {
            gameListSpy.games.push(game);
        });
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should only return the first 4 games', () => {
        component['startIndex'] = 0;
        const endIndex = 4;
        expect(component.getDisplayedItems()).toEqual(fakeGames.slice(component['startIndex'], endIndex));
    });
    it('should go left when possible if displayed game list was going to be empty', () => {
        spyOn(component, 'goLeft');
        component['startIndex'] = 4;
        gameListSpy.games.pop();
        component.getDisplayedItems();
        expect(component.goLeft).toHaveBeenCalled();
    });
    it('should not go left if displayed game list is not empty', () => {
        spyOn(component, 'goLeft');
        component['startIndex'] = 4;
        component.getDisplayedItems();
        expect(component.goLeft).not.toHaveBeenCalled();
    });
    it('should return all the games', () => {
        component['startIndex'] = 0;
        gameListSpy.games.pop();
        expect(component.getDisplayedItems()).toEqual(gameListSpy.games);
    });
    it('should only return 1 game', () => {
        component['startIndex'] = 4;
        const expectedResult = gameListSpy.games.slice(component['startIndex'], component['startIndex'] + 1);
        expect(component.getDisplayedItems()).toEqual(expectedResult);
    });

    it('should allow to move right', () => {
        component['startIndex'] = 0;
        expect(fakeGames.length).toBeGreaterThan(CARDS_MAX_CAPACITY);
        expect(component.canGoRight()).toEqual(true);
    });

    it('should not allow to move right', () => {
        component['startIndex'] = gameListSpy.games.length - 1;
        expect(component.canGoRight()).toEqual(false);
    });

    it('should allow to move left', () => {
        component['startIndex'] = 4;
        expect(component.canGoLeft()).toEqual(true);
    });

    it('should not allow to move left', () => {
        component['startIndex'] = 0;
        expect(component.canGoLeft()).toEqual(false);
    });

    it('should reduce index by 4', () => {
        component['startIndex'] = 4;
        const expectedIndex = 0;
        component.goLeft();
        expect(component['startIndex']).toEqual(expectedIndex);
    });

    it('should increase index by 4', () => {
        component['startIndex'] = 0;
        const expectedIndex = 4;
        component.goRight();
        expect(component['startIndex']).toEqual(expectedIndex);
    });

    it('should call getDisplayedItems when moving left', () => {
        spyOn(component, 'getDisplayedItems');
        component.goLeft();
        expect(component.getDisplayedItems).toHaveBeenCalled();
    });

    it('should call getDisplayedItems when moving right', () => {
        spyOn(component, 'getDisplayedItems');
        component.goRight();
        expect(component.getDisplayedItems).toHaveBeenCalled();
    });
    it('should return difficulty easy', () => {
        expect(component.getDifficulty(0)).toEqual('facile');
    });

    it('should return difficulty hard', () => {
        expect(component.getDifficulty(1)).toEqual('difficile');
    });
    it('should return difficulty medium', () => {
        expect(component.getDifficulty(2)).toEqual('moyen');
    });
});
