import * as CardExample from '@app/../assets/tests/card/example-card.json';
import { TEST } from '@app/class-mocks.spec';
import BestTimesModifier from '@app/class/diverse/best-times-modifier/best-times-modifier';
import FileSystemManager from '@app/class/diverse/file-system-manager/file-system-manager';
import ClassicSingleplayer from '@app/class/game-logic/classic-singleplayer/classic-singleplayer';
import DifferenceManager from '@app/class/game-logic/difference-manager/difference-manager';
import Game from '@app/class/game-logic/game-interfaces/game-interface';
import Player from '@app/class/game-logic/player/player';
import PlayerGroup from '@app/class/player-groups/default-player-group/player-group';
import SinglePlayerGroup from '@app/class/player-groups/solo-player-group/solo-player-group';
import StopWatch from '@app/class/watch/stopwatch/stopwatch';
import { GameConnectionData, User } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameConnectionAttemptResponseType } from '@common/enums/game-play/game-connection-attempt-response-type';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Card } from '@common/interfaces/game-card/card';
import { GameDifferenceImages } from '@common/interfaces/game-play/game-click.dto';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';

jest.mock('@app/gateways/emission-filter', () => ({
    default: jest.fn().mockImplementation(() => ({
        toClient: jest.fn(),
        toServer: jest.fn(),
        broadcast: jest.fn(),
        toLobby: jest.fn(),
        event: undefined,
    })),
}));

namespace PlayerSpy {
    export const startPenalty = jest.spyOn(Player.prototype, 'startPenalty').mockImplementation(jest.fn());
}

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
    export const emit = jest.fn();
}

namespace BestTimesModifierSpy {
    export const updateBestTimes = jest.fn();
    export const updateRealBestTimes = BestTimesModifier.updateBestTimes;
}

namespace StopWatchSpy {
    export const start = jest.spyOn(StopWatch.prototype, 'start').mockImplementation(jest.fn());
    export const pause = jest.spyOn(StopWatch.prototype, 'pause').mockImplementation(jest.fn());
    export const getTime = jest.spyOn(StopWatch.prototype, 'getTime', 'get');
}

namespace GameAuthorityServiceSpy {
    export const removeOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'removeGame');
    export const addOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'addGame');
}

namespace ClassicSingleplayerSpy {
    export const startGame = jest.spyOn(ClassicSingleplayer.prototype, 'startGame');
    export const getPlayerList = jest.spyOn(ClassicSingleplayer.prototype, 'getPlayerList');
    export const endGame = jest.spyOn(ClassicSingleplayer.prototype, 'endGame');
}

namespace PlayerGroupSpy {
    export const empty = jest.spyOn(PlayerGroup.prototype, 'empty');
    export const leave = jest.spyOn(PlayerGroup.prototype, 'leave');
}

namespace LoggerSpy {
    export const error = jest.fn();
}

jest.mock('@app/class/game-logic/difference-manager/difference-manager', () => ({
    default: jest.fn().mockImplementation(() => TEST.DIFFERENCE_MANAGER.MOCK),
}));

describe('ClassicSingleplayer', () => {
    let fakeUser: User;
    let fakePlayer: Player;
    let card: Card;
    let game;
    let mongoDBService: MongoDBService;
    let gameConnectionData: GameConnectionData;
    const getImages = jest.fn();
    const getRealImages = FileSystemManager.getImages;

    afterAll(() => {
        FileSystemManager.getImages = getRealImages;
    });

    beforeAll(() => {
        Logger.error = LoggerSpy.error;
        FileSystemManager.getImages = getImages;
    });

    beforeEach(async () => {
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
            name: 'fakeUser',
            client: {
                id: 'id',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
            } as unknown as Socket,
        };
        fakePlayer = new Player(fakeUser);
        gameConnectionData = {
            gameMode: GameMode.ClassicSolo,
            cardId: CardExample.id,
            user: fakeUser,
        };
        card = JSON.parse(JSON.stringify(CardExample));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        game = new ClassicSingleplayer(mongoDBService) as any;
        jest.clearAllMocks();
        getImages.mockRestore();
        TEST.reset();
        TEST.MONGODB_SERVICE.MOCK.getCardById.mockReturnValue(card);
    });

    describe('initialize', () => {
        it('should receive card and initialize the game', async () => {
            const fakeCardFiles = {
                id: game.getCardId,
                originalImage: undefined,
                modifiedImage: undefined,
                differencesBase64Files: [],
            };
            getImages.mockReturnValue(fakeCardFiles);
            ClassicSingleplayerSpy.startGame.mockImplementationOnce(jest.fn());
            await game.initialize(gameConnectionData);
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Starting,
                startingIn: 0,
                modifiedImage: undefined,
                originalImage: undefined,
                gameId: gameConnectionData.user.client.id,
                gameName: 'Game 1',
                difficulty: CardExample.difficulty,
                time: 0,
                differenceNbr: CardExample.differenceNbr,
                playerNbr: 1,
                gameValues: game.gameValues,
                hostName: 'fakeUser',
            });
            expect(getImages).toHaveBeenCalledTimes(1);
            expect(GameAuthorityServiceSpy.addOngoingGame).toHaveBeenCalledWith(game);
            expect(ClassicSingleplayerSpy.startGame).toHaveBeenCalledTimes(1);
        });

        it('should not receive card and cancel the game', async () => {
            TEST.MONGODB_SERVICE.MOCK.getCardById.mockRejectedValueOnce(undefined);
            await game.initialize(gameConnectionData);
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(GameAuthorityServiceSpy.addOngoingGame).not.toHaveBeenCalled();
            expect(ClassicSingleplayerSpy.startGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toBeCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Cancelled,
            });
        });

        it('should receive card but fail to retrieve the cardFiles and cancel the game', async () => {
            getImages.mockReturnValue(undefined);
            await game.initialize(gameConnectionData);
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(GameAuthorityServiceSpy.addOngoingGame).not.toHaveBeenCalled();
            expect(ClassicSingleplayerSpy.startGame).not.toHaveBeenCalled();
            expect(getImages).toHaveBeenCalledTimes(1);
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toBeCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Cancelled,
                gameId: fakePlayer.client.id,
            });
        });
    });

    describe('startGame', () => {
        it('should set isOngoing to true', () => {
            expect(game.isOngoing).toBeFalsy();
            game.startGame();
            expect(StopWatchSpy.start).toHaveBeenCalledTimes(1);
            expect(game.isOngoing).toBeTruthy();
        });
    });

    describe('endGame', () => {
        beforeEach(async () => {
            game.startGame();
            game.playerGroup = new SinglePlayerGroup(fakeUser);
            game.card = CardExample;
        });

        beforeAll(() => {
            BestTimesModifier.updateBestTimes = BestTimesModifierSpy.updateBestTimes;
        });

        afterAll(() => {
            BestTimesModifier.updateBestTimes = BestTimesModifierSpy.updateRealBestTimes;
        });

        it('should end the game properly if the game is ongoing', async () => {
            TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValueOnce(jest.fn());
            TEST.MONGODB_SERVICE.MOCK.modifyCard.mockResolvedValueOnce(undefined);
            game.isOngoing = true;
            PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
            BestTimesModifierSpy.updateBestTimes.mockReturnValueOnce(true);
            ClassicSingleplayerSpy.getPlayerList.mockReturnValueOnce(undefined);
            await game.endGame(fakePlayer);
            expect(GameAuthorityServiceSpy.removeOngoingGame).toBeCalledWith(game.getId);
            expect(BestTimesModifierSpy.updateBestTimes).toBeCalledTimes(1);
            expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).toBeCalledTimes(1);
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).toBeCalledTimes(1);
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).toBeCalledTimes(1);
            expect(PlayerGroupSpy.empty).toBeCalledTimes(1);
        });

        it('should end the game properly if the game is ongoing but there is no winner', async () => {
            TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValueOnce(jest.fn());
            game.isOngoing = true;
            PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
            ClassicSingleplayerSpy.getPlayerList.mockReturnValueOnce(undefined);
            await game.endGame();
            expect(GameAuthorityServiceSpy.removeOngoingGame).toBeCalledWith(game.getId);
            expect(BestTimesModifierSpy.updateBestTimes).not.toBeCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).not.toBeCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).toBeCalledTimes(1);
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).not.toBeCalled();
            expect(PlayerGroupSpy.empty).toBeCalledTimes(1);
        });

        it('should end the game properly if the game is not ongoing', async () => {
            game.isOngoing = false;
            PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
            await game.endGame(fakePlayer);
            expect(GameAuthorityServiceSpy.removeOngoingGame).toBeCalledWith(game.getId);
            expect(BestTimesModifierSpy.updateBestTimes).not.toBeCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).not.toBeCalled();
            expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).not.toBeCalled();
            expect(OutputFilterGateway.sendEndgameMessage.toLobby).not.toBeCalled();
            expect(PlayerGroupSpy.empty).toBeCalledTimes(1);
        });

        it('should show on the console if the mongoose service failed to save the best times to the DB', async () => {
            TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockRejectedValueOnce(undefined);
            TEST.MONGODB_SERVICE.MOCK.modifyCard.mockRejectedValueOnce(undefined);
            game.isOngoing = true;
            PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
            BestTimesModifierSpy.updateBestTimes.mockReturnValueOnce(true);
            ClassicSingleplayerSpy.getPlayerList.mockReturnValue(undefined);
            await game.endGame(fakePlayer);
            expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).toBeCalledTimes(1);
            expect(PlayerGroupSpy.empty).toBeCalledTimes(1);
        });
    });

    describe('removePlayer', () => {
        beforeEach(async () => {
            game.startGame();
            game.playerGroup = new SinglePlayerGroup(fakeUser);
            game.card = CardExample;
        });

        it('should call endgame if a player was successfully removed', async () => {
            ClassicSingleplayerSpy.endGame.mockImplementationOnce(jest.fn());
            PlayerGroupSpy.leave.mockReturnValueOnce(fakePlayer);
            expect(await game.removePlayer(fakePlayer.client.id)).toBeTruthy();
            expect(PlayerGroupSpy.leave).toHaveBeenCalledWith(fakePlayer.client.id, true);
            expect(ClassicSingleplayerSpy.endGame).toHaveBeenCalledWith();
        });

        it('should not call endgame if no player was removed', async () => {
            PlayerGroupSpy.leave.mockReturnValueOnce(undefined);
            expect(await game.removePlayer(fakePlayer.client.id)).toBeFalsy();
            expect(PlayerGroupSpy.leave).toBeCalledWith(fakePlayer.client.id, true);
            expect(ClassicSingleplayerSpy.endGame).not.toHaveBeenCalled();
        });
    });

    describe('verifyClick', () => {
        beforeEach(async () => {
            game.startGame();
            game.playerGroup = new SinglePlayerGroup(fakeUser);
            game.card = CardExample;
            game.findPlayer(fakeUser.client.id).differenceManager = new DifferenceManager(
                {
                    differences: [],
                    differenceNbr: 0,
                } as Card,
                undefined,
                undefined,
            );
        });

        it('should call the parent function', async () => {
            const spyOnParentVerifyClick = jest.spyOn(Game.prototype, 'verifyClick').mockReturnValueOnce(true);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeTruthy();
            expect(spyOnParentVerifyClick).toBeCalledTimes(1);
        });

        it('should send a message to the player if a difference was found and stop the game if all of them are', async () => {
            ClassicSingleplayerSpy.endGame.mockImplementationOnce(jest.fn());
            TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce({} as GameDifferenceImages);
            TEST.DIFFERENCE_MANAGER.MOCK.foundAllDifferences.mockReturnValueOnce(true);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeTruthy();
            expect(OutputFilterGateway.sendClickResponseMessage.toClient).toBeCalledTimes(1);
            expect(TEST.DIFFERENCE_MANAGER.MOCK.foundAllDifferences).toBeCalledTimes(1);
            expect(ClassicSingleplayerSpy.endGame).toBeCalledTimes(1);
            expect(PlayerSpy.startPenalty).not.toBeCalled();
        });

        it('should send a message to the player if a difference was not found and set a penalty', async () => {
            TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce(undefined);
            expect(game.verifyClick(fakePlayer.client.id, undefined)).toBeFalsy();
            expect(OutputFilterGateway.sendClickResponseMessage.toClient).toBeCalledTimes(1);
            expect(PlayerSpy.startPenalty).toBeCalledTimes(1);
        });
    });
});
