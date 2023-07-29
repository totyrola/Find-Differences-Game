/* eslint-disable max-lines */
import * as CardExample from '@app/../assets/tests/card/example-card.json';
import { TEST } from '@app/class-mocks.spec';
import BestTimesModifier from '@app/class/diverse/best-times-modifier/best-times-modifier';
import FileSystemManager from '@app/class/diverse/file-system-manager/file-system-manager';
import DifferenceManager from '@app/class/game-logic/difference-manager/difference-manager';
import Game from '@app/class/game-logic/game-interfaces/game-interface';
import Player from '@app/class/game-logic/player/player';
import PlayerGroup from '@app/class/player-groups/default-player-group/player-group';
import DuoPlayerGroup from '@app/class/player-groups/duo-player-group/duo-player-group';
import StopWatch from '@app/class/watch/stopwatch/stopwatch';
import { GameConnectionData, User } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameConnectionAttemptResponseType } from '@common/enums/game-play/game-connection-attempt-response-type';
import { GameMode } from '@common/enums/game-play/game-mode';
import { PlayerConnectionStatus } from '@common/enums/game-play/player-connection-status';
import { Card } from '@common/interfaces/game-card/card';
import { CardBase64Files } from '@common/interfaces/game-card/card-base64-files';
import { GameDifferenceImages } from '@common/interfaces/game-play/game-click.dto';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import Classic1v1 from './classic1v1';

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

namespace PlayerSpy {
    export const startPenalty = jest.spyOn(Player.prototype, 'startPenalty').mockImplementation(jest.fn());
}

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
    export const emit = jest.fn();
    export const to = jest.fn().mockImplementation(() => ({
        emit: jest.fn(),
    }));
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
    export const removePendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'removeGame');
    export const addPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'addGame');
    export const startGame = jest.fn();
    export const startRealGame = GameAuthorityService.startGame;
}

namespace ClassicSingleplayerSpy {
    export const startGame = jest.spyOn(Classic1v1.prototype, 'startGame');
    export const getPlayerList = jest.spyOn(Classic1v1.prototype, 'getPlayerList');
    export const endGame = jest.spyOn(Classic1v1.prototype, 'endGame');
}

namespace PlayerGroupSpy {
    export const empty = jest.spyOn(PlayerGroup.prototype, 'empty');
    export const leave = jest.spyOn(PlayerGroup.prototype, 'leave');
    export const joinUser = jest.spyOn(PlayerGroup.prototype, 'joinUser');
    export const transferPlayerTo = jest.spyOn(PlayerGroup.prototype, 'transferPlayerTo');
    export const forEachPlayer = jest.spyOn(PlayerGroup.prototype, 'forEachPlayer');
    export const host = jest.spyOn(PlayerGroup.prototype, 'host', 'get');
}

namespace LoggerSpy {
    export const error = jest.fn();
}

describe('Classic1v1', () => {
    let fakeUser1: User;
    let fakePlayer1: Player;
    let fakeUser2: User;
    let fakePlayer2: Player;
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
        fakeUser1 = {
            name: 'fakeUser1',
            client: {
                id: 'id1',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
                to: SocketSpy.to,
            } as unknown as Socket,
        };
        fakePlayer1 = new Player(fakeUser1);
        fakeUser2 = {
            name: 'fakeUser2',
            client: {
                id: 'id2',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
                to: SocketSpy.to,
            } as unknown as Socket,
        };
        fakePlayer2 = new Player(fakeUser2);
        gameConnectionData = {
            gameMode: GameMode.Classic1v1,
            cardId: CardExample.id,
            user: fakeUser1,
        };
        card = JSON.parse(JSON.stringify(CardExample));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        game = new Classic1v1(mongoDBService) as any;
        game.waitingLobby = new PlayerGroup(1, 2);
        jest.clearAllMocks();
        TEST.reset();
        getImages.mockRestore();
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
            expect(await game.initialize(gameConnectionData)).toBeTruthy();
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Pending,
                gameId: gameConnectionData.user.client.id,
                playerNbr: 1,
            });
            expect(getImages).toHaveBeenCalledTimes(1);
            expect(GameAuthorityServiceSpy.addPendingGame).toHaveBeenCalledWith(game);
        });

        it('should not receive card and cancel the game', async () => {
            TEST.MONGODB_SERVICE.MOCK.getCardById.mockRejectedValueOnce(undefined);
            expect(await game.initialize(gameConnectionData)).toBeFalsy();
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(GameAuthorityServiceSpy.addPendingGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toBeCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Cancelled,
            });
        });

        it('should receive card but fail to retrieve the cardFiles and cancel the game', async () => {
            getImages.mockReturnValue(undefined);
            expect(await game.initialize(gameConnectionData)).toBeFalsy();
            expect(TEST.MONGODB_SERVICE.MOCK.getCardById).toHaveBeenCalledWith(gameConnectionData.cardId);
            expect(GameAuthorityServiceSpy.addPendingGame).not.toHaveBeenCalled();
            expect(getImages).toHaveBeenCalledTimes(1);
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toBeCalledWith(gameConnectionData.user.client, {
                responseType: GameConnectionAttemptResponseType.Cancelled,
                gameId: fakeUser1.client.id,
            });
        });
    });

    describe('kickWaitingPlayer', () => {
        it('should kick a player from the waitingLobby and return the removed players client', () => {
            PlayerGroupSpy.host.mockReturnValueOnce(fakePlayer1);
            PlayerGroupSpy.leave.mockReturnValueOnce(fakePlayer2);
            game.playerGroup = new PlayerGroup(1, 1);
            game.kickWaitingPlayer(undefined);
            expect(PlayerGroupSpy.leave).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toHaveBeenCalledWith(fakePlayer2.client, {
                responseType: GameConnectionAttemptResponseType.Rejected,
                gameId: undefined,
            });
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).toHaveBeenCalledWith(fakePlayer1.client, {
                playerConnectionStatus: PlayerConnectionStatus.Left,
                user: {
                    name: fakePlayer2.name,
                    id: fakePlayer2.client.id,
                },
            });
        });

        it('should not send a message if no players were removed', () => {
            PlayerGroupSpy.leave.mockReturnValueOnce(undefined);
            game.kickWaitingPlayer(fakeUser1.client.id);
            expect(PlayerGroupSpy.leave).toHaveBeenCalled();
        });
    });

    describe('join', () => {
        beforeEach(async () => {
            const lobby = new DuoPlayerGroup(fakeUser1);
            game.card = CardExample;
            game.playerGroup = lobby;
            game.isOngoing = false;
            jest.clearAllMocks();
        });

        it('should return false if the game is ongoing', () => {
            game.isOngoing = true;
            expect(game.join(fakeUser1)).toBeFalsy();
            expect(PlayerGroupSpy.joinUser).not.toHaveBeenCalled();
        });

        it('should return true if a player joined the waiting lobby as well as ask the host to validate him', () => {
            PlayerGroupSpy.joinUser.mockReturnValueOnce(true);
            expect(game.join(fakeUser2)).toBeTruthy();
            expect(PlayerGroupSpy.joinUser).toHaveBeenCalled();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).toHaveBeenCalledWith(fakeUser1.client, {
                playerConnectionStatus: PlayerConnectionStatus.AttemptingToJoin,
                user: {
                    name: fakeUser2.name,
                    id: fakeUser2.client.id,
                },
            });
        });

        it('should return false if a player failed to join the waiting lobby', () => {
            PlayerGroupSpy.joinUser.mockReturnValueOnce(false);
            expect(game.join(fakeUser2)).toBeFalsy();
            expect(PlayerGroupSpy.joinUser).toHaveBeenCalled();
            expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).not.toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        beforeEach(() => {
            game.isOngoing = false;
            const lobby = new DuoPlayerGroup(fakeUser1);
            game.card = CardExample;
            game.playerGroup = lobby;
            game.cardFiles = {
                modifiedImages: '',
                originalImages: '',
            } as unknown as CardBase64Files;
        });

        beforeAll(() => {
            GameAuthorityService.startGame = GameAuthorityServiceSpy.startGame;
        });

        afterAll(() => {
            GameAuthorityService.startGame = GameAuthorityServiceSpy.startRealGame;
        });

        it('should not start the game if transferring the chosen player from the waiting lobby to the main one fails', () => {
            PlayerGroupSpy.transferPlayerTo.mockReturnValueOnce(false);
            game.startGame(fakePlayer2.client.id);
            expect(PlayerGroupSpy.forEachPlayer).not.toHaveBeenCalled();
        });

        it('should successfully start the game', () => {
            PlayerGroupSpy.transferPlayerTo.mockReturnValueOnce(true);
            game.waitingLobby.joinUser(fakeUser2);
            game.startGame(fakePlayer2.client.id);
            expect(PlayerGroupSpy.forEachPlayer).toHaveBeenCalledTimes(2);
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toClient).toBeCalledWith(fakeUser2.client, {
                responseType: GameConnectionAttemptResponseType.Rejected,
            });
            expect(GameAuthorityServiceSpy.startGame).toHaveBeenCalled();
            expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toLobby).toHaveBeenCalled();
            expect(StopWatchSpy.start).toHaveBeenCalled();
        });
    });

    describe('after start', () => {
        beforeEach(async () => {
            game.isOngoing = true;
            const lobby = new DuoPlayerGroup(fakeUser1);
            game.card = card;
            game.playerGroup = lobby;
            lobby.forEachPlayer((player: Player) => {
                player.differenceManager = new DifferenceManager(CardExample, undefined, 0);
                return false;
            });
            game.gameWatch = new StopWatch();
            game.gameWatch.start();
        });

        describe('endGame', () => {
            beforeAll(() => {
                BestTimesModifier.updateBestTimes = BestTimesModifierSpy.updateBestTimes;
            });

            afterAll(() => {
                BestTimesModifier.updateBestTimes = BestTimesModifierSpy.updateRealBestTimes;
            });

            it('should end the game properly if the game is ongoing and there is no winner', async () => {
                TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockResolvedValueOnce(jest.fn());
                PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
                ClassicSingleplayerSpy.getPlayerList.mockReturnValueOnce(undefined);
                await game.endGame();
                expect(GameAuthorityServiceSpy.removeOngoingGame).toBeCalledWith(game.getId);
                expect(BestTimesModifierSpy.updateBestTimes).not.toHaveBeenCalled();
                expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).not.toHaveBeenCalled();
                expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).toBeCalledTimes(1);
                expect(OutputFilterGateway.sendEndgameMessage.toLobby).toBeCalledTimes(1);
                expect(PlayerGroupSpy.empty).toBeCalledTimes(2);
            });

            it('should end the game properly if the game is not ongoing', async () => {
                game.isOngoing = false;
                PlayerGroupSpy.empty.mockImplementationOnce(jest.fn());
                await game.endGame(fakePlayer1);
                expect(GameAuthorityServiceSpy.removePendingGame).toBeCalledWith(game.getId);
                expect(BestTimesModifierSpy.updateBestTimes).not.toBeCalled();
                expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).not.toBeCalled();
                expect(TEST.MONGODB_SERVICE.MOCK.addPlayerRecord).not.toBeCalled();
                expect(OutputFilterGateway.sendEndgameMessage.toLobby).not.toBeCalled();
                expect(OutputFilterGateway.sendConnectionAttemptResponseMessage.toLobby).toBeCalledTimes(2);
                expect(PlayerGroupSpy.empty).toBeCalledTimes(2);
            });

            it('should show on the console if the mongoose service failed to save the best times to the DB', async () => {
                TEST.MONGODB_SERVICE.MOCK.addPlayerRecord.mockRejectedValueOnce(jest.fn());
                TEST.MONGODB_SERVICE.MOCK.modifyCard.mockRejectedValueOnce(undefined);
                BestTimesModifierSpy.updateBestTimes.mockReturnValueOnce(true);
                ClassicSingleplayerSpy.getPlayerList.mockReturnValueOnce(undefined);
                await game.endGame(fakePlayer1);
                expect(TEST.MONGODB_SERVICE.MOCK.modifyCard).toBeCalledTimes(1);
            });
        });

        describe('removePlayer', () => {
            it('should call endgame if a player was successfully removed', async () => {
                ClassicSingleplayerSpy.endGame.mockImplementationOnce(jest.fn());
                PlayerGroupSpy.leave.mockReturnValueOnce(fakePlayer1);
                expect(await game.removePlayer(fakePlayer1.client.id)).toBeTruthy();
                expect(OutputFilterGateway.sendDeserterMessage.toLobby).toHaveBeenLastCalledWith(game.playerGroup.getLobbyId, fakePlayer1.name);
                expect(PlayerGroupSpy.leave).toHaveBeenCalledWith(fakePlayer1.client.id, true);
                expect(ClassicSingleplayerSpy.endGame).toHaveBeenCalledWith();
            });

            it('should not call endgame if no player was removed and remove from the waitingLobby if the game has not started', async () => {
                game.isOngoing = false;
                PlayerGroupSpy.leave.mockReturnValueOnce(undefined).mockReturnValueOnce(fakePlayer1);
                expect(await game.removePlayer(fakePlayer1.client.id)).toBeTruthy();
                expect(PlayerGroupSpy.leave).toBeCalledWith(fakePlayer1.client.id, false);
                expect(PlayerGroupSpy.leave).toBeCalledTimes(2);
                expect(OutputFilterGateway.sendPlayerConnectionMessage.toClient).toBeCalledWith(fakePlayer1.client, {
                    playerConnectionStatus: PlayerConnectionStatus.Left,
                    user: {
                        name: fakePlayer1.name,
                        id: fakePlayer1.client.id,
                    },
                });
                expect(ClassicSingleplayerSpy.endGame).not.toHaveBeenCalled();
            });

            it('should not call endgame if no player was removed and return false if the game is ongoing', async () => {
                PlayerGroupSpy.leave.mockReturnValueOnce(undefined);
                expect(await game.removePlayer(fakePlayer1.client.id)).toBeFalsy();
                expect(PlayerGroupSpy.leave).toBeCalledWith(fakePlayer1.client.id, true);
                expect(PlayerGroupSpy.leave).toBeCalledTimes(1);
                expect(ClassicSingleplayerSpy.endGame).not.toHaveBeenCalled();
            });
        });

        describe('verifyClick', () => {
            it('should call the parent function', async () => {
                const spyOnParentVerifyClick = jest.spyOn(Game.prototype, 'verifyClick').mockReturnValueOnce(true);
                expect(game.verifyClick(fakeUser1.client.id, undefined)).toBeTruthy();
                expect(spyOnParentVerifyClick).toBeCalledTimes(1);
            });

            it('should send a message to the player if a difference was found and stop the game if half of them are', async () => {
                ClassicSingleplayerSpy.endGame.mockImplementationOnce(jest.fn());
                TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce({} as GameDifferenceImages);
                TEST.DIFFERENCE_MANAGER.MOCK.getFoundDifferenceNbr = card.differenceNbr;
                TEST.DIFFERENCE_MANAGER.MOCK.originalDifferenceAmount = card.differenceNbr;
                expect(game.verifyClick(fakeUser1.client.id, undefined)).toBeTruthy();
                expect(OutputFilterGateway.sendClickResponseMessage.toClient).toBeCalledTimes(1);
                expect(ClassicSingleplayerSpy.endGame).toBeCalledTimes(1);
                expect(PlayerSpy.startPenalty).not.toBeCalled();
            });

            it('should send a message to the player if a difference was not found and set a penalty', async () => {
                TEST.DIFFERENCE_MANAGER.MOCK.findDifference.mockReturnValueOnce(undefined);
                expect(await game.verifyClick(fakePlayer1.client.id, undefined)).toBeFalsy();
                expect(OutputFilterGateway.sendClickResponseMessage.toClient).toBeCalledTimes(1);
                expect(PlayerSpy.startPenalty).toBeCalledTimes(1);
            });
        });
    });
});
