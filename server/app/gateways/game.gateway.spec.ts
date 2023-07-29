/* eslint-disable max-lines */
import { TEST } from '@app/class-mocks.spec';
import ClassicSingleplayer from '@app/class/game-logic/classic-singleplayer/classic-singleplayer';
import Classic1v1 from '@app/class/game-logic/classic1v1/classic1v1';
import DifferenceManager from '@app/class/game-logic/difference-manager/difference-manager';
import Game from '@app/class/game-logic/game-interfaces/game-interface';
import Player from '@app/class/game-logic/player/player';
import { GameClickFilter } from '@app/model/gateway-dto/game/game-click.dto';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Hint } from '@common/interfaces/difference-locator-algorithm/hint';
import { Card } from '@common/interfaces/game-card/card';
import { CardPreview } from '@common/interfaces/game-card/card-preview';
import { PlayerValidationDto } from '@common/interfaces/game-play/game-player-validation.dto';
import { GameValues } from '@common/interfaces/game-play/game-values';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import GameGateway from './game.gateway';
import { User } from './game.gateway.constants';
import OutputFilterGateway from './output-filters.gateway';

jest.mock('@app/class/game-logic/classic-singleplayer/classic-singleplayer', () => ({
    default: jest.fn().mockImplementation(() => TEST.CLASSIC_SINGLEPLAYER.MOCK),
}));
jest.mock('@app/class/game-logic/classic1v1/classic1v1', () => ({
    default: jest.fn().mockImplementation(() => TEST.CLASSIC_1V1.MOCK),
}));
jest.mock('@app/class/game-logic/difference-manager/difference-manager', () => ({
    default: jest.fn().mockImplementation(() => TEST.DIFFERENCE_MANAGER.MOCK),
}));
jest.mock('@app/class/algorithms/difference-locator/difference-locator');
jest.mock('./output-filters.gateway.ts');

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
    export const emit = jest.fn();
}

namespace GameAuthorityServiceSpy {
    export const findOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'findGame');
    export const findPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'findGame');
    export const getPendingGames = jest.fn();
    export const removePlayer = jest.fn();
    export const connect = jest.fn();
}

namespace LoggerSpy {
    export const error = jest.fn();
    export const log = jest.fn();
}

namespace MongoDBServiceSpy {
    export const addCard = jest.fn();
    export const getAllCardPreviews = jest.fn();
    export const getAllCards = jest.fn();
    export const removeAllCards = jest.fn();
    export const removeCardById = jest.fn();
}

describe('GameGateway', () => {
    let mockClassic1v1Game: Classic1v1;
    let mockClassicSoloGame: ClassicSingleplayer;
    let fakePlayer: Player;
    let gateway: GameGateway;
    let mongoDBService: MongoDBService;
    let differenceManager: DifferenceManager;
    let mockCards: CardPreview[];
    let fakeUser: User;
    let fakeUser2: User;
    let fakePlayer2: Player;

    beforeAll(() => {
        Logger.error = LoggerSpy.error;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                {
                    provide: MongoDBService,
                    useValue: MongoDBServiceSpy,
                },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        mongoDBService = module.get<MongoDBService>(MongoDBService);
        mockClassicSoloGame = new ClassicSingleplayer(mongoDBService);
        mockClassic1v1Game = new Classic1v1(mongoDBService);
        differenceManager = new DifferenceManager(
            {
                differences: [],
                differenceNbr: 0,
            } as Card,
            undefined,
            0,
        );
        mockCards = [
            {
                name: 'Mock Card 1',
                id: 'id1',
            } as unknown as CardPreview,
            {
                name: 'Mock Card 2',
                id: 'id2',
            } as unknown as CardPreview,
        ];
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
        fakeUser2 = {
            name: 'fakeUser2',
            client: {
                id: 'id2',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
            } as unknown as Socket,
        };
        fakePlayer2 = new Player(fakeUser2);
        MongoDBServiceSpy.getAllCardPreviews.mockResolvedValue(mockCards);
    });

    afterEach(() => {
        TEST.reset();
        jest.clearAllMocks();
    });

    describe('isPlaying', () => {
        it('should send the result', () => {
            gateway.isPlaying(fakeUser.client);
            expect(OutputFilterGateway.sendPlayerStatus.toClient).toHaveBeenCalled();
        });
    });

    describe('verifyClick', () => {
        let fakeClick: GameClickFilter;

        beforeEach(() => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(mockClassicSoloGame);
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue({ downTime: false } as unknown as Player);
            fakeClick = {
                gameId: 'fakeId',
                x: 10,
                y: 10,
            };
        });

        it('should stop if no game was found', async () => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(undefined);
            gateway.verifyClick(fakeUser.client, fakeClick);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.verifyClick).not.toBeCalled();
        });

        it('should stop if no player with the passed socket id was found in the game', async () => {
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue(undefined);
            gateway.verifyClick(fakeUser.client, fakeClick);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.verifyClick).not.toBeCalled();
        });

        it('should stop the player is in downtime', async () => {
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue({ downTime: true } as unknown as Player);
            gateway.verifyClick(fakeUser.client, fakeClick);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.verifyClick).not.toBeCalled();
        });

        it('should verify the click when the game and the player have been identified', async () => {
            gateway.verifyClick(fakeUser.client, fakeClick);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.verifyClick).toBeCalled();
        });
    });

    describe('sendChatMessage', () => {
        let message: string;
        let gameId: string;
        let lobbyId: string;

        beforeEach(() => {
            message = 'message';
            gameId = 'gameId';
            lobbyId = fakePlayer.client.id + 'L';
            TEST.CLASSIC_SINGLEPLAYER.MOCK.getLobbyIds.mockReturnValue([lobbyId]);
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(mockClassicSoloGame);
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue(fakePlayer);
        });

        it('should stop if no game was found', () => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(undefined);
            gateway.sendChatMessage(fakeUser.client, { gameId, message });
            expect(OutputFilterGateway.sendChatMessage.broadcast).not.toHaveBeenCalled();
        });

        it('should stop if no player was found', () => {
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue(undefined);
            gateway.sendChatMessage(fakeUser.client, { gameId, message });
            expect(OutputFilterGateway.sendChatMessage.broadcast).not.toHaveBeenCalled();
        });

        it('should send the event to destined lobbys excluding the client', () => {
            gateway.sendChatMessage(fakeUser.client, { gameId, message });
            expect(OutputFilterGateway.sendChatMessage.broadcast).toHaveBeenCalled();
        });
    });

    describe('joinGame', () => {
        it('should call the connect of GameAuthorityService with a GameConnectionData object', () => {
            GameAuthorityService.connect = GameAuthorityServiceSpy.connect;
            gateway.joinGame(fakeUser.client, {
                gameMode: GameMode.ClassicSolo,
                playerName: fakeUser.name,
                cardId: mockCards[0].id,
            });
            expect(GameAuthorityServiceSpy.connect).toBeCalledWith({
                gameMode: GameMode.ClassicSolo,
                cardId: mockCards[0].id,
                user: {
                    name: fakeUser.name,
                    client: fakeUser.client,
                },
            });
        });
    });

    describe('validatePlayer', () => {
        let playerValidationDto: PlayerValidationDto;

        beforeEach(() => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(mockClassic1v1Game);
            playerValidationDto = {
                gameId: 'fakeId',
                playerId: fakeUser.client.id,
                canJoin: true,
            };
            TEST.CLASSIC_1V1.MOCK.host = fakePlayer;
        });

        it('should return if no game was found', async () => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(undefined);
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.startGame).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).not.toBeCalled();
        });

        it('should return if the found game is not a Classic1v1', async () => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(mockClassicSoloGame);
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.startGame).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).not.toBeCalled();
        });

        it('should return if the returned game has no host', async () => {
            TEST.CLASSIC_1V1.MOCK.host = undefined;
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.startGame).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).not.toBeCalled();
        });

        it('should return if the host of the returned game does not match the clients', async () => {
            TEST.CLASSIC_1V1.MOCK.host = fakePlayer2;
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.startGame).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).not.toBeCalled();
        });

        it('should start the game if the waiting player is accepted', async () => {
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.startGame).toBeCalledWith(fakeUser.client.id);
        });

        it('should kick the waiting player if he is refused', async () => {
            playerValidationDto.canJoin = false;
            gateway.validatePlayer(fakeUser.client, playerValidationDto);
            expect(TEST.CLASSIC_1V1.MOCK.startGame).not.toBeCalled();
            expect(TEST.CLASSIC_1V1.MOCK.kickWaitingPlayer).toBeCalledWith(fakeUser.client.id);
        });
    });

    describe('sendCheatFlashes', () => {
        beforeEach(() => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(mockClassicSoloGame);
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue(fakePlayer);
            TEST.DIFFERENCE_MANAGER.MOCK.cheatFlashImages = [];
            fakePlayer.differenceManager = differenceManager;
        });

        it('should not send flash images because no game was found', async () => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(undefined);
            await gateway.sendCheatFlashes(fakeUser.client, undefined);
            expect(OutputFilterGateway.sendAllCheatFlashImages.toClient).not.toHaveBeenCalled();
        });
        it('should not send flash images because corresponding player was not found in the game', async () => {
            TEST.CLASSIC_SINGLEPLAYER.MOCK.findPlayer.mockReturnValue(undefined);
            await gateway.sendCheatFlashes(fakeUser.client, undefined);
            expect(OutputFilterGateway.sendAllCheatFlashImages.toClient).not.toHaveBeenCalled();
        });
        it('should not send flash images because the players difference manager was not initialized', async () => {
            fakePlayer.differenceManager = undefined;
            await gateway.sendCheatFlashes(fakeUser.client, undefined);
            expect(OutputFilterGateway.sendAllCheatFlashImages.toClient).not.toHaveBeenCalled();
        });
        it('should send flash images', async () => {
            await gateway.sendCheatFlashes(fakeUser.client, undefined);
            expect(OutputFilterGateway.sendAllCheatFlashImages.toClient).toHaveBeenCalled();
        });
    });

    describe('leaveGame', () => {
        beforeEach(() => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(mockClassicSoloGame);
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(mockClassicSoloGame);
            TEST.CLASSIC_SINGLEPLAYER.MOCK.removePlayer.mockResolvedValue(true);
        });

        it('should not find a pending game or an ongoing game', async () => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(undefined);
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValue(undefined);
            await gateway.leaveGame(fakeUser.client, 'gameId');
            expect(GameAuthorityServiceSpy.findPendingGame).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.findOngoingGame).toHaveBeenCalled();
        });

        it('should find a pending game', async () => {
            await gateway.leaveGame(fakeUser.client, 'gameId');
            expect(GameAuthorityServiceSpy.findPendingGame).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.findOngoingGame).not.toHaveBeenCalled();
        });

        it('should find an ongoing game', async () => {
            GameAuthorityServiceSpy.findPendingGame.mockReturnValue(undefined);
            await gateway.leaveGame(fakeUser.client, 'gameId');
            expect(GameAuthorityServiceSpy.findPendingGame).toHaveBeenCalled();
            expect(GameAuthorityServiceSpy.findOngoingGame).toHaveBeenCalled();
        });
    });

    describe('getHint', () => {
        beforeAll(() => {
            TEST.CLASSIC_SINGLEPLAYER.MOCK.getHint.mockReturnValue({} as unknown as Hint);
        });

        it('should not call sendHint if a game was not found', () => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValueOnce(undefined);
            gateway.getHint(fakeUser.client, 'fakeId');
            expect(OutputFilterGateway.sendHint.toClient).not.toHaveBeenCalled();
        });

        it('should call sendHint if a game was found', () => {
            GameAuthorityServiceSpy.findOngoingGame.mockReturnValueOnce({ getHint: () => ({} as Hint) } as unknown as Game);
            gateway.getHint(fakeUser.client, 'fakeId');
            expect(OutputFilterGateway.sendHint.toClient).toHaveBeenCalled();
        });
    });

    describe('getJoinableGames', () => {
        it('should call sendAvailableCardsToPlayer', () => {
            gateway.getJoinableGames(fakeUser.client);
            expect(OutputFilterGateway.sendJoinableGames.toClient).toHaveBeenCalled();
        });
    });

    describe('sendGameValues', () => {
        it('should call sendGameValuesToClient', () => {
            gateway.sendGameValues(fakeUser.client);
            expect(OutputFilterGateway.sendGameValues.toClient).toHaveBeenCalled();
        });
    });

    describe('setGameValues', () => {
        it('should set the game values', async () => {
            await gateway.setGameValues(fakeUser.client, {
                penaltyTime: 0,
                gainedTime: 0,
                timerTime: 0,
            } as GameValues);
            expect(GameAuthorityService.gameValues).toEqual({
                penaltyTime: 0,
                gainedTime: 0,
                timerTime: 0,
            });
        });
    });

    describe('connection handlers', () => {
        Logger.log = LoggerSpy.log;
        GameAuthorityService.removePlayer = GameAuthorityServiceSpy.removePlayer;

        it('should handleConnection', () => {
            gateway.handleConnection(fakeUser.client);
            expect(LoggerSpy.log).toBeCalledWith('A client has connected: ' + fakeUser.client.id);
        });

        it('should handleDisconnect', () => {
            gateway.handleDisconnect(fakeUser.client);
            expect(LoggerSpy.log).toBeCalledWith('A client has disconnected: ' + fakeUser.client.id);
            expect(GameAuthorityServiceSpy.removePlayer).toBeCalledWith(fakeUser.client.id);
        });
    });
});
