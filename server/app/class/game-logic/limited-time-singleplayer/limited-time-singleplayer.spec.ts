/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import * as CardExample from '@app/../assets/tests/card/example-card.json';
import { TEST } from '@app/class-mocks.spec';
import LimitedTime from '@app/class/game-logic/game-interfaces/limited-time-interface';
import Player from '@app/class/game-logic/player/player';
import SinglePlayerGroup from '@app/class/player-groups/solo-player-group/solo-player-group';
import StopWatch from '@app/class/watch/stopwatch/stopwatch';
import Timer from '@app/class/watch/timer/timer';
import { GameConnectionData, User } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Card } from '@common/interfaces/game-card/card';
import { CardBase64Files } from '@common/interfaces/game-card/card-base64-files';
import { GameplayCard } from '@common/interfaces/game-card/gameplay-card';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import LimitedTimeSolo from './limited-time-singleplayer';

jest.mock('@app/gateways/emission-filter', () => ({
    default: jest.fn().mockImplementation(() => ({
        toClient: jest.fn(),
        toServer: jest.fn(),
        broadcast: jest.fn(),
        toLobby: jest.fn(),
        event: undefined,
    })),
}));
jest.mock('@app/class/game-logic/difference-manager/difference-manager', () => ({
    default: jest.fn().mockImplementation(() => TEST.DIFFERENCE_MANAGER.MOCK),
}));
jest.mock('@app/class/watch/timer/timer', () => ({
    default: jest.fn().mockImplementation(() => TEST.TIMER.MOCK),
}));
jest.mock('@app/class/watch/stopwatch/stopwatch', () => ({
    default: jest.fn().mockImplementation(() => TEST.STOPWATCH.MOCK),
}));
jest.mock('@app/class/player-groups/solo-player-group/solo-player-group', () => ({
    default: jest.fn().mockImplementation(() => TEST.SOLO_LOBBY.MOCK),
}));

const LT = LimitedTimeSolo as any;

// LIMITED TIME INTERFACE
jest.spyOn(LT.prototype, 'getPlayerList').mockImplementation(TEST.LIMITED_TIME.MOCK.getPlayerList);
jest.spyOn(LT.prototype, 'shiftCards').mockImplementation(TEST.LIMITED_TIME.MOCK.shiftCards);
jest.spyOn(LT.prototype, 'getRandomCard').mockImplementation(TEST.LIMITED_TIME.MOCK.getRandomCard);
jest.spyOn(LimitedTime.prototype, 'fetchInitialCards').mockImplementation(TEST.LIMITED_TIME.MOCK.initialize);

// LIMITED TIME COOP
namespace LimitedTimeSoloSpy {
    export const startGame = jest.spyOn(LT.prototype, 'startGame');
    export const endGame = jest.spyOn(LT.prototype, 'endGame');
}

namespace GameAuthorityServiceSpy {
    export const removeOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'removeGame').mockImplementation();
    export const removePendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'removeGame').mockImplementation();
    export const addOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'addGame').mockImplementation();
    export const startGame = jest.fn();
    export const startRealGame = GameAuthorityService.startGame;
}

describe('Classic1v1', () => {
    let fakeUser: User;
    let fakePlayer: Player;
    let card: Card;
    let game;
    let cardFiles: CardBase64Files;
    let gameConnectionData: GameConnectionData;
    let gameplayCard: GameplayCard;
    const loggerErrorSpy = jest.fn();

    beforeAll(() => {
        Logger.error = loggerErrorSpy;
    });

    beforeEach(async () => {
        loggerErrorSpy.mockClear();
        TEST.reset();
        TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValue(1);
        fakeUser = {
            name: 'fakeUser1',
            client: {
                id: 'id1',
            } as unknown as Socket,
        };
        fakePlayer = new Player(fakeUser);
        gameConnectionData = {
            gameMode: GameMode.Classic1v1,
            cardId: CardExample.id,
            user: fakeUser,
        };
        card = JSON.parse(JSON.stringify(CardExample));
        cardFiles = {
            originalImage: undefined,
            modifiedImage: undefined,
        } as CardBase64Files;
        game = new LimitedTimeSolo(TEST.MONGODB_SERVICE.MOCK as unknown as MongoDBService);
        game.playerGroup = new SinglePlayerGroup(fakeUser);
        game.card = card;
        game.cardFiles = cardFiles;
        gameplayCard = {
            data: card,
            files: cardFiles,
        };
        game.gameWatch = new Timer();
        game.stopwatch = new StopWatch();
        TEST.SOLO_LOBBY.MOCK.host = fakePlayer;
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        beforeEach(() => {
            TEST.MONGODB_SERVICE.MOCK.getAllCardIds.mockResolvedValue(['1', '2', '3', '4', '5']);
            TEST.LIMITED_TIME.MOCK.getRandomCard.mockResolvedValue(card);
            LimitedTimeSoloSpy.startGame.mockImplementation(TEST.LIMITED_TIME_SOLO.MOCK.startGame);
            game.upcomingCards = [gameplayCard, gameplayCard];
        });

        afterAll(() => {
            LimitedTimeSoloSpy.startGame.mockRestore();
        });

        it('should receive card and initialize the game', async () => {
            TEST.LIMITED_TIME.MOCK.initialize.mockResolvedValue(true);
            expect(await game.initialize(gameConnectionData)).toBeTruthy();
            expect(TEST.LIMITED_TIME.MOCK.shiftCards).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.addOngoingGame).toHaveBeenCalled();
            expect(TEST.LIMITED_TIME_COOP.MOCK.startGame).toHaveBeenCalled();
        });

        it('should fail to initialize a game', async () => {
            TEST.LIMITED_TIME.MOCK.initialize.mockResolvedValue(false);
            expect(await game.initialize(gameConnectionData)).toBeFalsy();
            expect(OutputFilterGateway.sendNextCard.toLobby).not.toHaveBeenCalled();
            expect(TEST.LIMITED_TIME.MOCK.shiftCards).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.addOngoingGame).not.toHaveBeenCalled();
            expect(TEST.LIMITED_TIME_COOP.MOCK.startGame).not.toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        it('should start the game', () => {
            game.startGame();
            expect(TEST.STOPWATCH.MOCK.start).toHaveBeenCalled();
            expect(TEST.TIMER.MOCK.set).toHaveBeenCalled();
            expect(TEST.TIMER.MOCK.start).toHaveBeenCalled();
            expect(game.isOngoing).toBeTruthy();
            (game.gameWatch as any).eachInterval();
            (game.gameWatch as any).onEnd();
        });
    });

    describe('removePlayer', () => {
        beforeAll(() => {
            LimitedTimeSoloSpy.endGame.mockImplementation(TEST.LIMITED_TIME_SOLO.MOCK.endGame);
        });

        afterAll(() => {
            LimitedTimeSoloSpy.endGame.mockRestore();
        });

        it('should fail to remove a player', async () => {
            TEST.SOLO_LOBBY.MOCK.leave.mockReturnValue(undefined);
            expect(await game.removePlayer()).toBeFalsy();
            expect(TEST.LIMITED_TIME_SOLO.MOCK.endGame).not.toHaveBeenCalled();
        });

        it('should remove a player and end the game', async () => {
            TEST.SOLO_LOBBY.MOCK.leave.mockReturnValue(fakePlayer);
            expect(await game.removePlayer()).toBeTruthy();
            expect(TEST.LIMITED_TIME_SOLO.MOCK.endGame).toHaveBeenCalled();
        });
    });

    describe('endGame', () => {
        it('should end the game properly if the game is ongoing', async () => {
            game.isOngoing = true;
            TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValue(undefined);
            await game.endGame();
            expect(GameAuthorityServiceSpy.removeOngoingGame).toHaveBeenCalled();
            expect(game.isOngoing).toBeFalsy();
            expect(TEST.LIMITED_TIME_SOLO.MOCK.getPlayerList).toHaveBeenCalled();
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).toHaveBeenCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).toHaveBeenCalled();
            expect(TEST.SOLO_LOBBY.MOCK.empty).toHaveBeenCalled();
        });

        it('should end the game properly if the game is not ongoing', async () => {
            await game.endGame();
            expect(GameAuthorityServiceSpy.removeOngoingGame).toHaveBeenCalled();
            expect(game.isOngoing).toBeFalsy();
            expect(TEST.LIMITED_TIME_SOLO.MOCK.getPlayerList).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).not.toHaveBeenCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).not.toHaveBeenCalled();
            expect(TEST.SOLO_LOBBY.MOCK.empty).toHaveBeenCalled();
        });

        it('should fail to save the records', async () => {
            game.isOngoing = true;
            await game.endGame();
        });
    });
});
