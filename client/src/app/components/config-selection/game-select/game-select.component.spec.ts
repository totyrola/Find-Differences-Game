/* eslint-disable max-classes-per-file */
import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/classes/game-play/game';
import { PaperButtonComponent } from '@app/components/general/paper-button/paper-button.component';
import { FAKE_GAMES } from '@app/constants/game-selection-test-constants';
import { GameSelectorService } from '@app/services/game-selection/game-selector.service';
import { BestTimes } from '@common/interfaces/game-card/best-times';
import { Subject } from 'rxjs';
import { GameSelectComponent } from './game-select.component';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-top-three', template: '' })
class TopThreeStubComponent {
    @Input() soloScores: BestTimes;
    @Input() vsScores: BestTimes;
}

describe('GameSelectComponent', () => {
    let fakeGame: Game;
    let component: GameSelectComponent;
    let fixture: ComponentFixture<GameSelectComponent>;
    let selectorServiceSpy: SpyObj<GameSelectorService>;
    let fakeSelectionValue: Subject<{ side: string; id: string }>;

    beforeAll(() => {
        fakeGame = new Game(FAKE_GAMES[0]);
    });
    @Pipe({ name: 'safeResourceUrl' })
    class SafeUrlStubPipe implements PipeTransform {
        transform() {
            return '';
        }
    }
    beforeEach(async () => {
        fakeSelectionValue = new Subject<{ side: string; id: string }>();
        selectorServiceSpy = jasmine.createSpyObj('GameSelectorService', ['setSelectionValue'], { selectionValue: fakeSelectionValue });
        await TestBed.configureTestingModule({
            declarations: [GameSelectComponent, TopThreeStubComponent, SafeUrlStubPipe, PaperButtonComponent],
            providers: [{ provide: GameSelectorService, useValue: selectorServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameSelectComponent);
        component = fixture.componentInstance;
        component.game = fakeGame;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('sending selection should set selection value in selector service', () => {
        component.sendSelection('left');
        expect(selectorServiceSpy.setSelectionValue).toHaveBeenCalledWith('left', component.game.cardId);
    });
});
