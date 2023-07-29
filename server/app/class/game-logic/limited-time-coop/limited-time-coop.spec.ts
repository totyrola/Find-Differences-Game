/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import * as CardExample from '@app/../assets/tests/card/example-card.json';
import { TEST } from '@app/class-mocks.spec';
import LimitedTime from '@app/class/game-logic/game-interfaces/limited-time-interface';
import Player from '@app/class/game-logic/player/player';
import DuoPlayerGroup from '@app/class/player-groups/duo-player-group/duo-player-group';
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
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import LimitedTimeCoop from './limited-time-coop';

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
jest.mock('@app/class/player-groups/duo-player-group/duo-player-group', () => ({
    default: jest.fn().mockImplementation(() => TEST.DUO_LOBBY.MOCK),
}));

const LT = LimitedTimeCoop as any;

// LIMITED TIME INTERFACE
jest.spyOn(LT.prototype, 'getPlayerList').mockImplementation(TEST.LIMITED_TIME.MOCK.getPlayerList);
jest.spyOn(LT.prototype, 'shiftCards').mockImplementation(TEST.LIMITED_TIME.MOCK.shiftCards);
jest.spyOn(LT.prototype, 'getRandomCard').mockImplementation(TEST.LIMITED_TIME.MOCK.getRandomCard);
jest.spyOn(LimitedTime.prototype, 'fetchInitialCards').mockImplementation(TEST.LIMITED_TIME.MOCK.initialize);

// LIMITED TIME COOP
namespace LimitedTimeCoopSpy {
    export const startGame = jest.spyOn(LT.prototype, 'startGame');
    export const endGame = jest.spyOn(LT.prototype, 'endGame');
}

namespace GameAuthorityServiceSpy {
    export const removeOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'removeGame').mockImplementation();
    export const removePendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'removeGame').mockImplementation();
    export const addPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'addGame').mockImplementation();
    export const startGame = jest.fn();
    export const startRealGame = GameAuthorityService.startGame;
}

describe('Classic1v1', () => {
    let fakeUser: User;
    let fakePlayer: Player;
    let card: Card;
    let game;
    let cardFiles: CardBase64Files;
    let mongoDBService: MongoDBService;
    let gameConnectionData: GameConnectionData;
    let gameplayCard: GameplayCard;

    beforeEach(async () => {
        TEST.reset();
        TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValue(1);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: MongoDBService,
                    useValue: TEST.MONGODB_SERVICE.MOCK,
                },
            ],
        }).compile();
        mongoDBService = module.get<MongoDBService>(MongoDBService);
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
        game = new LimitedTimeCoop(mongoDBService);
        game.playerGroup = new DuoPlayerGroup(fakeUser);
        game.card = card;
        game.cardFiles = cardFiles;
        gameplayCard = {
            data: card,
            files: cardFiles,
        };
        game.gameWatch = new Timer();
        game.stopwatch = new StopWatch();
        TEST.DUO_LOBBY.MOCK.host = fakePlayer;
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        beforeEach(() => {
            TEST.MONGODB_SERVICE.MOCK.getAllCardIds.mockResolvedValue(['1', '2', '3', '4', '5']);
            TEST.LIMITED_TIME.MOCK.getRandomCard.mockResolvedValue(card);
        });

        it('should receive card and initialize the game', async () => {
            TEST.LIMITED_TIME.MOCK.initialize.mockResolvedValue(true);
            expect(await game.initialize(gameConnectionData)).toBeTruthy();
            expect(TEST.LIMITED_TIME.MOCK.shiftCards).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.addPendingGame).toHaveBeenCalled();
        });

        it('should fail to initialize a game', async () => {
            TEST.LIMITED_TIME.MOCK.initialize.mockResolvedValue(false);
            expect(await game.initialize(gameConnectionData)).toBeFalsy();
            expect(TEST.LIMITED_TIME.MOCK.shiftCards).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.addPendingGame).not.toHaveBeenCalled();
        });
    });

    describe('join', () => {
        beforeEach(async () => {
            TEST.DUO_LOBBY.MOCK.joinUser.mockReturnValue(true);
            LimitedTimeCoopSpy.startGame.mockImplementation(TEST.LIMITED_TIME_COOP.MOCK.startGame);
            game.isOngoing = false;
        });

        afterAll(() => {
            LimitedTimeCoopSpy.startGame.mockRestore();
        });

        it('should return false if the game is ongoing', () => {
            game.isOngoing = true;
            expect(game.join(fakeUser)).toBeFalsy();
            expect(TEST.DUO_LOBBY.MOCK.joinUser).not.toHaveBeenCalled();
        });

        it('should return false if the lobby did not let him join', () => {
            TEST.DUO_LOBBY.MOCK.joinUser.mockReturnValue(false);
            expect(game.join(fakeUser)).toBeFalsy();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).not.toHaveBeenCalled();
        });

        it('should make a player join', () => {
            expect(game.join(fakeUser)).toBeTruthy();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).toHaveBeenCalled();
            expect(TEST.LIMITED_TIME_COOP.MOCK.startGame).toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        beforeEach(() => {
            TEST.DUO_LOBBY.MOCK.forEachPlayer.mockImplementation((cb) => cb(fakePlayer));
            game.upcomingCards = [gameplayCard];
        });

        beforeAll(() => {
            GameAuthorityService.startGame = GameAuthorityServiceSpy.startGame;
        });

        afterAll(() => {
            GameAuthorityService.startGame = GameAuthorityServiceSpy.startRealGame;
        });

        it('should start the game', () => {
            game.startGame();
            expect(GameAuthorityServiceSpy.startGame).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toLobby).toHaveBeenCalled();
            expect(TEST.STOPWATCH.MOCK.start).toHaveBeenCalled();
            expect(TEST.TIMER.MOCK.set).toHaveBeenCalled();
            expect(game.isOngoing).toBeTruthy();
            (game.gameWatch as any).eachInterval();
            (game.gameWatch as any).onEnd();
        });
    });

    describe('removePlayer', () => {
        beforeAll(() => {
            LimitedTimeCoopSpy.endGame.mockImplementation(TEST.LIMITED_TIME_COOP.MOCK.endGame);
        });

        afterAll(() => {
            LimitedTimeCoopSpy.endGame.mockRestore();
        });

        it('should fail to remove a player', async () => {
            TEST.DUO_LOBBY.MOCK.leave.mockReturnValue(undefined);
            expect(await game.removePlayer()).toBeFalsy();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toLobby).not.toHaveBeenCalled();
        });

        it('should remove a player and end the game', async () => {
            TEST.DUO_LOBBY.MOCK.getPlayerNbr = 0;
            TEST.DUO_LOBBY.MOCK.leave.mockReturnValue(fakePlayer);
            expect(await game.removePlayer()).toBeTruthy();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toLobby).toHaveBeenCalled();
            expect(TEST.LIMITED_TIME_COOP.MOCK.endGame).toHaveBeenCalled();
        });
    });

    describe('endGame', () => {
        it('should end the game properly if the game is ongoing', async () => {
            game.isOngoing = true;
            TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValue(undefined);
            await game.endGame();
            expect(GameAuthorityServiceSpy.removeOngoingGame).toHaveBeenCalled();
            expect(game.isOngoing).toBeFalsy();
            expect(TEST.LIMITED_TIME_COOP.MOCK.getPlayerList).toHaveBeenCalled();
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).toHaveBeenCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).toHaveBeenCalled();
            expect(TEST.DUO_LOBBY.MOCK.empty).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.removePendingGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toLobby).not.toHaveBeenCalled();
        });

        it('should end the game properly if the game is not ongoing', async () => {
            await game.endGame();
            expect(GameAuthorityServiceSpy.removeOngoingGame).not.toHaveBeenCalled();
            expect(game.isOngoing).toBeFalsy();
            expect(TEST.LIMITED_TIME_COOP.MOCK.getPlayerList).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).not.toHaveBeenCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).not.toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.removePendingGame).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toLobby).toHaveBeenCalled();
            expect(TEST.DUO_LOBBY.MOCK.empty).toHaveBeenCalled();
        });

        it('should fail to save the records', async () => {
            game.isOngoing = true;
            await game.endGame();
        });
    });
});
