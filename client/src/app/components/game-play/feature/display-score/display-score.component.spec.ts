import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayScoreComponent } from './display-score.component';

describe('DisplayScoreComponent', () => {
    let component: DisplayScoreComponent;
    let fixture: ComponentFixture<DisplayScoreComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DisplayScoreComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DisplayScoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('get differencesFound should return score when nbOPlayers = 2', () => {
        component.firstPlayerScore = 2;
        component.secondPlayerScore = 3;
        component.gameData.nbOfPlayers = 2;
        expect(component.differencesFound(component.firstPlayerScore)).toEqual(component.firstPlayerScore);
        expect(component.differencesFound(component.secondPlayerScore)).toEqual(component.secondPlayerScore);
    });
    it('get differencesFound should return gameService.differencesFound when nbOPlayers = 1', () => {
        component.gameService.differencesFound = 1;
        component.gameData.nbOfPlayers = 1;
        expect(component.differencesFound(component.firstPlayerScore)).toEqual(component.gameService.differencesFound);
    });
    it('get differencesLeft should return Math.ceil(gameService.totalDifferences / 2) when nbOPlayers = 2', () => {
        component.gameService.totalDifferences = 2;
        component.gameData.nbOfPlayers = 2;
        expect(component.differencesLeft).toEqual(1);
    });
    it('get differencesLeft should return gameService.totalDifferences when nbOPlayers = 1', () => {
        component.gameService.totalDifferences = 1;
        component.gameData.nbOfPlayers = 1;
        expect(component.differencesLeft).toEqual(1);
    });
});
