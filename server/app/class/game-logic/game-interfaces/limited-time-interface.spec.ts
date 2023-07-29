import * as CardExample from '@app/../assets/tests/card/example-card.json';
import { TEST } from '@app/class-mocks.spec';
import FileSystemManager from '@app/class/diverse/file-system-manager/file-system-manager';
import DifferenceManager from '@app/class/game-logic/difference-manager/difference-manager';
import { GAME_VALUES } from '@app/class/game-logic/game-logic.constants';
import Player from '@app/class/game-logic/player/player';
import SinglePlayerGroup from '@app/class/player-groups/solo-player-group/solo-player-group';
import StopWatch from '@app/class/watch/stopwatch/stopwatch';
import { User } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import { ERROR_TOLERANCE } from '@app/model/gateway-dto/game/game.constants';
import { Card } from '@common/interfaces/game-card/card';
import { CardBase64Files } from '@common/interfaces/game-card/card-base64-files';
import { GameplayCard } from '@common/interfaces/game-card/gameplay-card';
import { GameDifferenceImages } from '@common/interfaces/game-play/game-click.dto';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import Game from './game-interface';
import LimitedTime from './limited-time-interface';

jest.mock('@app/class/diverse/file-system-manager/file-system-manager');

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
jest.mock('@app/class/watch/stopwatch/stopwatch', () => ({
    default: jest.fn().mockImplementation(() => TEST.STOPWATCH.MOCK),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LT = LimitedTime as any;

namespace PlayerSpy {
    export const startPenalty = jest.spyOn(Player.prototype, 'startPenalty').mockImplementation(jest.fn());
}

namespace LimitedTimeSpy {
    export const endGame = jest.fn();
    export const getRandomCard = jest.spyOn(LT.prototype, 'getRandomCard');
    export const shiftCards = jest.spyOn(LT.prototype, 'shiftCards');
    export const getPlayerList = jest.spyOn(LT.prototype, 'getPlayerList');
}

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
    export const emit = jest.fn();
}

describe('LimitedTimeInterface', () => {
    let fakeUser: User;
    let fakePlayer: Player;
    let card: Card;
    let game;
    let gameplayCard: GameplayCard;
    let cardFiles: CardBase64Files;

    beforeAll(() => {
        Logger.error = jest.fn();
    });

    beforeEach(async () => {
        fakeUser = {
            name: 'fakeUser',
            client: {
                id: 'id',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
            } as unknown as Socket,
        };
        fakePlayer = new Player(fakeUser);
        card = JSON.parse(JSON.stringify(CardExample));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        game = LimitedTime.prototype;
        jest.clearAllMocks();
        TEST.reset();
        cardFiles = {
            originalImage: undefined,
            modifiedImage: undefined,
        } as CardBase64Files;
        gameplayCard = {
            data: card,
            files: cardFiles,
        };
        game.upcomingCards = [];
        game.mongodbService = TEST.MONGODB_SERVICE.MOCK;
        game.cardIds = ['id'];
        game.endGame = LimitedTimeSpy.endGame;
        TEST.MONGODB_SERVICE.MOCK.getCardById.mockReturnValue(card);
        FileSystemManager.getImages = jest.fn().mockReturnValue(cardFiles);
    });

    describe('fetchInitialCards', () => {
        let spy: jest.SpyInstance;

        beforeAll(() => {
            spy = jest.spyOn(LT.prototype, 'getRandomCard').mockResolvedValue({});
        });

        afterAll(() => {
            spy.mockRestore();
        });

        it('should save two cards synchronously and three cards asynchronously', async () => {
            TEST.MONGODB_SERVICE.MOCK.getAllCardIds.mockResolvedValue(['1', '2', '3', '4', '5']);
            expect(await game.fetchInitialCards()).toBeTruthy();
            expect(spy).toHaveBeenCalledTimes(2);
            expect(TEST.MONGODB_SERVICE.MOCK.getAllCardIds).toHaveBeenCalled();
        });

        it('should generate an error and return false', async () => {
            TEST.MONGODB_SERVICE.MOCK.getAllCardIds.mockResolvedValue(undefined);
            expect(await game.fetchInitialCards()).toBeFalsy();
            expect(spy).not.toHaveBeenCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.getAllCardIds).toHaveBeenCalled();
        });
    });

    describe('verifyClick', () => {
        beforeEach(async () => {
            game.isOngoing = true;
            game.playerGroup = new SinglePlayerGroup(fakeUser);
            game.card = card;
            game.gameWatch = new StopWatch();
            game.gameValues = GAME_VALUES;
            game.differenceManager = new DifferenceManager(
                {
                    differences: [],
                    differenceNbr: 0,
                } as Card,
                undefined,
                undefined,
            );
            game.findPlayer(fakeUser.client.id).differenceManager = game.differenceManager;
            LimitedTimeSpy.shiftCards.mockImplementation(jest.fn());
        });

        it('should call the parent function', async () => {
            const spyOnParentVerifyClick = jest.spyOn(Game.prototype, 'verifyClick').mockReturnValueOnce(true);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeTruthy();
            expect(spyOnParentVerifyClick).toBeCalledTimes(1);
        });

        it('should send a message to the player if a difference was found and stop the game if all of them are', async () => {
            TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce({} as GameDifferenceImages);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeTruthy();
            expect(OutputFilterGateway.sendClickResponseMessage.toClient).toHaveBeenCalled();
            expect(OutputFilterGateway.sendOtherClick.broadcast).toHaveBeenCalled();
            expect(PlayerSpy.startPenalty).not.toBeCalled();
            expect(LimitedTimeSpy.shiftCards).toHaveBeenCalled();
        });

        it('should send a message to the player if a difference was not found and set a penalty', async () => {
            TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce(undefined);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeFalsy();
            expect(OutputFilterGateway.sendClickResponseMessage.toClient).toBeCalledTimes(1);
            expect(PlayerSpy.startPenalty).toBeCalledTimes(1);
            expect(OutputFilterGateway.sendOtherClick.broadcast).toHaveBeenCalled();
        });
    });

    describe('getRandomCard', () => {
        it('should find and return a card', async () => {
            expect(await game.getRandomCard()).toEqual(gameplayCard);
        });

        it('should return undefined if there are no cardIds left', async () => {
            game.cardIds = [];
            await expect(game.getRandomCard()).resolves.toEqual(undefined);
        });

        it('should try to fetch a card ERROR_TOLERANCE times before rejecting the promise', async () => {
            game.cardIds = ['1', '2', '3', '4', '5'];
            TEST.MONGODB_SERVICE.MOCK.getCardById.mockRejectedValue(undefined);
            await expect(game.getRandomCard()).rejects.toEqual('Failed to fetch a card');
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toBeCalledTimes(ERROR_TOLERANCE);
        });
    });

    describe('shiftCards', () => {
        beforeEach(() => {
            LimitedTimeSpy.shiftCards.mockRestore();
            game.upcomingCards = [gameplayCard, gameplayCard];
        });

        it('should end the game if there are no upcoming cards left', () => {
            game.upcomingCards = [];
            game.shiftCards();
            expect(LimitedTimeSpy.endGame).toHaveBeenCalled();
        });

        it('should shift the cards', async () => {
            const spy = jest.spyOn(LT.prototype, 'getRandomCard');
            game.shiftCards();
            expect(LimitedTimeSpy.endGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendNextCard.toLobby).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it('should fail to get a random cards', async () => {
            const spy = jest.spyOn(LT.prototype, 'getRandomCard').mockRejectedValueOnce('error');
            await game.shiftCards();
            expect(OutputFilterGateway.sendNextCard.toLobby).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });
    });
});
