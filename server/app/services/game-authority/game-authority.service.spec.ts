import { TEST } from '@app/class-mocks.spec';
import ClassicSingleplayer from '@app/class/game-logic/classic-singleplayer/classic-singleplayer';
import Classic1v1 from '@app/class/game-logic/classic1v1/classic1v1';
import { GameConnectionData } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Socket } from 'socket.io';
import GameAuthorityService from './game-authority.service';

jest.mock('@app/class/game-logic/classic-singleplayer/classic-singleplayer', () => ({
    default: jest.fn().mockImplementation(() => TEST.CLASSIC_SINGLEPLAYER.MOCK),
}));
jest.mock('@app/class/game-logic/classic1v1/classic1v1', () => ({
    default: jest.fn().mockImplementation(() => TEST.CLASSIC_1V1.MOCK),
}));
jest.mock('@app/class/game-logic/limited-time-coop/limited-time-coop', () => ({
    default: jest.fn().mockImplementation(() => TEST.LIMITED_TIME_COOP.MOCK),
}));
jest.mock('@app/class/game-logic/limited-time-singleplayer/limited-time-singleplayer', () => ({
    default: jest.fn().mockImplementation(() => TEST.LIMITED_TIME_SOLO.MOCK),
}));
jest.mock('@app/gateways/emission-filter', () => ({
    default: jest.fn().mockImplementation(() => ({
        toClient: jest.fn(),
        toServer: jest.fn(),
        broadcast: jest.fn(),
        toLobby: jest.fn(),
        event: undefined,
    })),
}));

namespace GameAuthorityServiceSpy {
    export const joinPendingGame = jest.fn();
    export const joinRealPendingGame = GameAuthorityService.joinPendingGame;
    export const isPlaying = jest.fn();
    export const isReallyPlaying = GameAuthorityService.isPlaying;
}

namespace GameArrayManagerSpy {
    export const isPlayingInPending = jest.spyOn(GameAuthorityService.getPendingGames, 'isPlaying');
    export const isPlayingInOngoing = jest.spyOn(GameAuthorityService.getOngoingGames, 'isPlaying');
    export const removePendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'removeGame');
    export const addPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'addGame');
    export const removeOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'removeGame');
    export const addOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'addGame');
    export const removePlayerFromPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'removePlayerById');
    export const removePlayerFromOngoingGame = jest.spyOn(GameAuthorityService.getOngoingGames, 'removePlayerById');
    export const forEachPendingGame = jest.spyOn(GameAuthorityService.getPendingGames, 'forEach');

    export const mock = (spy: jest.SpyInstance, returnValue = undefined): jest.Mock => {
        const func = jest.fn().mockReturnValue(returnValue);
        spy.mockImplementation(func);
        return func;
    };
}

describe('GameAuthorityService', () => {
    let connectionData: GameConnectionData;

    afterEach(() => {
        jest.clearAllMocks();
        GameAuthorityService.getOngoingGames.empty();
        GameAuthorityService.getPendingGames.empty();
        GameAuthorityService.joinableGames = [];
        TEST.reset();
    });

    beforeEach(() => {
        connectionData = {
            gameMode: GameMode.ClassicSolo,
            cardId: 'cardId',
            user: {
                name: 'user',
                client: {
                    id: 'socketId',
                } as Socket,
            },
        };
    });

    describe('getOngoingGames', () => {
        it('should return a GameArrayManager', () => {
            expect(typeof GameAuthorityService.getOngoingGames).toEqual('object');
        });
    });

    describe('getPendingGames', () => {
        it('should return a GameArrayManager', () => {
            expect(typeof GameAuthorityService.getPendingGames).toEqual('object');
        });
    });

    describe('connect', () => {
        afterEach(() => {
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinRealPendingGame;
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isReallyPlaying;
        });

        it('should return if the player is already in game', async () => {
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame;
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(true);
            await GameAuthorityService.connect(connectionData);
            expect(GameAuthorityServiceSpy.joinPendingGame).not.toBeCalled();
        });

        it('should add player to an existing game', async () => {
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame.mockReturnValueOnce(true);
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(false);
            await GameAuthorityService.connect(connectionData);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.initialize).not.toBeCalled();
        });

        it('should create a new ClassicSolo game', async () => {
            connectionData.gameMode = GameMode.ClassicSolo;
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame.mockReturnValueOnce(false);
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(false);
            await GameAuthorityService.connect(connectionData);
            expect(TEST.CLASSIC_SINGLEPLAYER.MOCK.initialize).toHaveBeenCalled();
        });

        it('should create a new Classic1v1 game, update the joinableGames array and finally send the updated array to the clients', async () => {
            connectionData.gameMode = GameMode.Classic1v1;
            TEST.CLASSIC_1V1.MOCK.initialize.mockResolvedValueOnce(true);
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame.mockReturnValueOnce(false);
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(false);
            await GameAuthorityService.connect(connectionData);
            expect(OutputFilterGateway.sendJoinableGames.toServer).toHaveBeenCalled();
            expect(TEST.CLASSIC_1V1.MOCK.initialize).toHaveBeenCalled();
        });

        it('should create a new LimitedTimeCoop game', async () => {
            connectionData.gameMode = GameMode.LimitedTimeCoop;
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame.mockReturnValueOnce(false);
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(false);
            await GameAuthorityService.connect(connectionData);
            expect(TEST.LIMITED_TIME_COOP.MOCK.initialize).toHaveBeenCalled();
        });

        it('should create a new LimitedTimeSolo game', async () => {
            connectionData.gameMode = GameMode.LimitedTimeSolo;
            GameAuthorityService.joinPendingGame = GameAuthorityServiceSpy.joinPendingGame.mockReturnValueOnce(false);
            GameAuthorityService.isPlaying = GameAuthorityServiceSpy.isPlaying.mockReturnValueOnce(false);
            await GameAuthorityService.connect(connectionData);
            expect(TEST.LIMITED_TIME_SOLO.MOCK.initialize).toHaveBeenCalled();
        });
    });

    describe('startGame', () => {
        let aog;

        beforeAll(() => {
            aog = GameArrayManagerSpy.mock(GameArrayManagerSpy.addOngoingGame);
        });

        afterAll(() => {
            GameArrayManagerSpy.addOngoingGame.mockRestore();
        });

        it('should remove a game from the pendingGames, add it to the ongoing games and remove the game from availableGames', async () => {
            GameArrayManagerSpy.removePendingGame.mockReturnValueOnce(new Classic1v1(undefined));
            GameAuthorityService.joinableGames.push('cardId');
            GameAuthorityService.startGame('fakeId', 'cardId');
            expect(GameArrayManagerSpy.removePendingGame).toBeCalled();
            expect(aog).toBeCalled();
            expect(GameAuthorityService.joinableGames).toHaveLength(0);
        });

        it('should not try to add a game to the ongoing list if none was removed from the pending list', () => {
            GameArrayManagerSpy.removePendingGame.mockReturnValueOnce(undefined);
            GameAuthorityService.startGame('fakeId', 'cardId');
            expect(GameArrayManagerSpy.removePendingGame).toBeCalled();
            expect(aog).not.toBeCalled();
        });
    });

    describe('isPlaying', () => {
        describe('return true', () => {
            it('if a player is found in the ongoingGames', () => {
                GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInOngoing, true);
                GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInPending, false);
                expect(GameAuthorityService.isPlaying(undefined)).toBeTruthy();
            });

            it('if a player is found in the pendingGame', () => {
                GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInOngoing, false);
                GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInPending, true);
                expect(GameAuthorityService.isPlaying(undefined)).toBeTruthy();
            });
        });

        it('should return false if the player was not found in ongoingGames or PendingGames', () => {
            GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInOngoing, false);
            GameArrayManagerSpy.mock(GameArrayManagerSpy.isPlayingInPending, false);
            expect(GameAuthorityService.isPlaying(undefined)).toBeFalsy();
        });
    });

    describe('removePlayer', () => {
        let removePlayerFromOngoingGame;
        let removePlayerFromPendingGame;

        beforeAll(() => {
            removePlayerFromOngoingGame = GameArrayManagerSpy.mock(GameArrayManagerSpy.removePlayerFromOngoingGame);
            removePlayerFromPendingGame = GameArrayManagerSpy.mock(GameArrayManagerSpy.removePlayerFromPendingGame);
        });

        afterAll(() => {
            GameArrayManagerSpy.removePlayerFromOngoingGame.mockRestore();
            GameArrayManagerSpy.removePlayerFromPendingGame.mockRestore();
        });

        it('should check to remove a player from all pending and ongoing games', async () => {
            GameAuthorityService.removePlayer('fakeId');
            expect(removePlayerFromOngoingGame).toBeCalledWith('fakeId');
            expect(removePlayerFromPendingGame).toBeCalledWith('fakeId');
        });
    });

    describe('joinPendingGame', () => {
        beforeEach(() => {
            TEST.CLASSIC_1V1.MOCK.getCardId = connectionData.cardId;
            TEST.CLASSIC_1V1.MOCK.join.mockReturnValue(true);
            connectionData.gameMode = GameMode.Classic1v1;
        });

        it('should verify the gameMode before looking for a compatible game', async () => {
            connectionData.gameMode = GameMode.ClassicSolo;
            expect(GameAuthorityService.joinPendingGame(connectionData)).toBeFalsy();
            connectionData.gameMode = GameMode.LimitedTimeSolo;
            expect(GameAuthorityService.joinPendingGame(connectionData)).toBeFalsy();
        });

        it('should find a compatible Classic 1v1 game and add and the player to it', async () => {
            GameAuthorityService.getPendingGames.addGame(new ClassicSingleplayer(undefined));
            GameAuthorityService.getPendingGames.addGame(new Classic1v1(undefined));
            expect(GameAuthorityService.joinPendingGame(connectionData)).toBeTruthy();
        });

        it('should not find a compatible game and return false', async () => {
            connectionData.gameMode = GameMode.LimitedTimeCoop;
            GameAuthorityService.getPendingGames.addGame(new Classic1v1(undefined));
            expect(GameAuthorityService.joinPendingGame(connectionData)).toBeFalsy();
        });
    });
});
