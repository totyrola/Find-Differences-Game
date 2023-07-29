/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/classes/game-play/game';
import { SocketTestHelper } from '@app/classes/test-helpers/socket-test-helper';
import { FAKE_BEST_TIMES, FAKE_GAMES } from '@app/constants/game-selection-test-constants';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { Card } from '@common/interfaces/game-card/card';
import { CardPreview } from '@common/interfaces/game-card/card-preview';
import * as Events from '@common/socket-event-constants';
import { SocketClientService } from './socket-client.service';

describe('GameListManagerService', () => {
    let service: GameListManagerService;
    let socketTestHelper: SocketTestHelper;

    beforeEach(() => {
        socketTestHelper = new SocketTestHelper();
        TestBed.configureTestingModule({ providers: [{ provide: SocketClientService, useValue: socketTestHelper }] });
        service = TestBed.inject(GameListManagerService);
        service.games = [];
        FAKE_GAMES.forEach((game: CardPreview) => {
            service.games.push(new Game(game));
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should update local game`s list when receiving all_game_cards event', () => {
        const expectedResult = service.games;
        service.games = [];
        expect(expectedResult).not.toEqual([]);
        service.init();
        socketTestHelper.peerSideEmit(Events.FromServer.ALL_GAME_CARDS, FAKE_GAMES);
        expect(service.games).toEqual(expectedResult);
    });
    it('should add new game to local game`s list when receiving game_card event', () => {
        const expectedResult = [service.games[0]];
        service.games = [];
        expect(expectedResult).not.toEqual([]);
        service.init();
        socketTestHelper.peerSideEmit(Events.FromServer.GAME_CARD, FAKE_GAMES[0]);
        expect(service.games).toEqual(expectedResult);
    });
    it('should resquest joinable games list when receiving all_game_cards event', () => {
        spyOn(socketTestHelper, 'send');
        const expectedResult = service.games;
        service.games = [];
        expect(expectedResult).not.toEqual([]);
        service.init();
        socketTestHelper.peerSideEmit(Events.FromServer.ALL_GAME_CARDS, FAKE_GAMES);
        expect(service.games).toEqual(expectedResult);
        expect(socketTestHelper.send).toHaveBeenCalledWith(Events.FromServer.JOINABLE_GAME_CARDS.name);
    });
    it('should remove game from games list and send delete_card event', () => {
        spyOn(socketTestHelper, 'send');
        const removedGameId = FAKE_GAMES[0].id;
        service.deleteGame(removedGameId);
        expect(
            service.games.find((game) => {
                return game.cardId === removedGameId;
            }),
        ).toBeUndefined();
        expect(socketTestHelper.send).toHaveBeenCalledWith(Events.ToServer.DELETE_CARD, FAKE_GAMES[0].id);
    });
    it('should empty games list and send delete_all_cards event', () => {
        spyOn(socketTestHelper, 'send');
        service.deleteAllGames();
        expect(service.games).toEqual([]);
        expect(socketTestHelper.send).toHaveBeenCalledWith(Events.ToServer.DELETE_ALL_CARDS);
    });
    it('should reset best times', () => {
        spyOn(socketTestHelper, 'send');
        const cardId = '10';
        service.resetBestTimes(cardId);
        expect(socketTestHelper.send).toHaveBeenCalledWith(Events.ToServer.RESET_BEST_TIMES, cardId);
    });
    it('should reset all best times', () => {
        spyOn(socketTestHelper, 'send');
        service.resetAllBestTimes();
        expect(socketTestHelper.send).toHaveBeenCalledWith(Events.ToServer.RESET_ALL_BEST_TIMES);
    });
    it('should update all game scores', () => {
        const fakeScore = {
            id: '1',
            classicSoloBestTimes: FAKE_BEST_TIMES,
            classic1v1BestTimes: FAKE_BEST_TIMES,
        };
        const newScores = [fakeScore, fakeScore, fakeScore];
        const updateGameScoreSpy = spyOn<any>(service, 'updateGameScore');
        service['updateAllGameScore'](newScores as unknown as Card[]);
        expect(updateGameScoreSpy).toHaveBeenCalledTimes(newScores.length);
    });
    it('should update the games status', () => {
        const NB_FAKE_GAMES = 5;
        const fakeGames = [];
        const fakeJoinableGames = ['1', '2', '4'];
        for (let i = 0; i < NB_FAKE_GAMES; i++) {
            fakeGames.push({
                cardId: '' + i,
                name: 'test',
                difficulty: 1,
                classicSoloBestTimes: FAKE_BEST_TIMES,
                classic1v1BestTimes: FAKE_BEST_TIMES,
                originalImage: '',
                gameStatus: false,
            });
        }
        service.games = fakeGames;
        service['updateGameStatus'](fakeJoinableGames);
        for (const game of fakeGames) {
            if (fakeJoinableGames.find((fakeJoinableGame) => game.cardId === fakeJoinableGame)) {
                expect(game.gameStatus).toBeTruthy();
            } else {
                expect(game.gameStatus).toBeFalsy();
            }
        }
    });
    it('should update the games score board', () => {
        const fakeNewScore = {
            firstPlace: { name: 'Albert', time: { minutes: 5, seconds: 22 } },
            secondPlace: FAKE_BEST_TIMES.secondPlace,
            thirdPlace: FAKE_BEST_TIMES.thirdPlace,
        };
        service['updateGameScore']({
            id: service.games[0].cardId,
            classicSoloBestTimes: fakeNewScore,
            classic1v1BestTimes: FAKE_BEST_TIMES,
        } as Card);
        expect(service.games[0].classicSoloBestTimes).toEqual(fakeNewScore);
    });
});
