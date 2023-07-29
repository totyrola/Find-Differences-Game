/* eslint-disable max-lines */
import { TEST } from '@app/class-mocks.spec';
import DifferenceManager from '@app/class/game-logic/difference-manager/difference-manager';
import Player from '@app/class/game-logic/player/player';
import PlayerGroup from '@app/class/player-groups/default-player-group/player-group';
import Watch from '@app/class/watch/watch/watch';
import { User } from '@app/gateways/game.gateway.constants';
import { PlayerRecordDocument } from '@app/model/database-schema/player-record.schema';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Hint } from '@common/interfaces/difference-locator-algorithm/hint';
import { Card } from '@common/interfaces/game-card/card';
import { GameDifferenceImages } from '@common/interfaces/game-play/game-click.dto';
import { Socket } from 'socket.io';
import Game from './game-interface';

class FakeGame extends Game {
    constructor(player: Player) {
        super(undefined);
        this.gameValues = {
            penaltyTime: 0,
            gainedTime: 0,
            timerTime: 0,
        };
        this.gameWatch = TEST.WATCH.SOLID_MOCK as unknown as Watch;
        this.gameMode = GameMode.ClassicSolo;
        this.playerGroup = new PlayerGroup(1, 3);
        this.playerGroup.joinPlayer(player);
        this.id = player.client.id;
        this.cardId = 'cardId';
    }

    get getPlayerNumber() {
        return this.playerGroup.getPlayerNbr;
    }

    set setLobby(value: PlayerGroup) {
        this.playerGroup = value;
    }

    set setOngoing(value: boolean) {
        this.isOngoing = value;
    }

    set setGameMode(value: GameMode) {
        this.gameMode = value;
    }

    set setCardId(value: string) {
        this.cardId = value;
    }

    set setCard(card: Card) {
        this.card = card;
    }

    join(user: User): boolean {
        return this.playerGroup.joinUser(user);
    }

    async removePlayer(playerId: string): Promise<boolean> {
        return this.playerGroup.leave(playerId, true) !== undefined;
    }
}

jest.mock('@app/class/watch/timer/timer', () => ({
    default: jest.fn().mockImplementation(() => TEST.WATCH.SOLID_MOCK),
}));

namespace DifferenceManagerSpy {
    export const findDifference = jest.spyOn(DifferenceManager.prototype, 'findDifference');
}

namespace PlayerGroupSpy {
    export const getPlayer = jest.spyOn(PlayerGroup.prototype, 'getPlayer');
    export const getLobbyId = jest.spyOn(PlayerGroup.prototype, 'getLobbyId', 'get');
    export const forEachPlayer = jest.spyOn(PlayerGroup.prototype, 'forEachPlayer');
}

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
    export const emit = jest.fn();
    export const to = jest.fn();
}

describe('Game', () => {
    let game: FakeGame;
    let fakeUser: User;
    let fakePlayer: Player;
    const cb = jest.fn();

    beforeEach(() => {
        fakeUser = {
            name: 'fakeUser',
            client: {
                id: 'id',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
                emit: SocketSpy.emit,
                to: SocketSpy.to,
            } as unknown as Socket,
        };
        fakePlayer = new Player(fakeUser);
        fakePlayer.differenceManager = new DifferenceManager(
            {
                differences: [],
                differenceNbr: 0,
            } as Card,
            undefined,
            undefined,
        );
        game = new FakeGame(fakePlayer);
    });

    afterEach(() => {
        TEST.reset();
        jest.clearAllMocks();
    });

    describe('getCardId', () => {
        it('should return the cardId', () => {
            expect(game.getCardId).toEqual('cardId');
        });
    });

    describe('host', () => {
        it('should return the host', () => {
            expect(game.host).toBe(fakePlayer);
        });

        it('should return undefined', () => {
            game.setLobby = undefined;
            expect(game.host).toBeUndefined();
        });
    });

    describe('getGameMode', () => {
        it('should return the gameMode', () => {
            expect(game.getGameMode).toEqual(GameMode.ClassicSolo);
        });
    });

    describe('getId', () => {
        it('should return the Id', () => {
            expect(game.getId).toEqual('id');
        });
    });

    describe('getIsOngoing', () => {
        it('should return true if is ongoing and false if not', () => {
            game.setOngoing = true;
            expect(game.getIsOngoing).toBeTruthy();
            game.setOngoing = false;
            expect(game.getIsOngoing).toBeFalsy();
        });
    });

    describe('verifyClick', () => {
        it('should return if the game is not ongoing', async () => {
            game.setOngoing = false;
            game.verifyClick(fakePlayer.client.id, undefined, cb);
            expect(PlayerGroupSpy.forEachPlayer).not.toHaveBeenCalled();
        });

        it('should look for a difference if the found player is not on downtime and call cb', async () => {
            game.setOngoing = true;
            DifferenceManagerSpy.findDifference.mockReturnValueOnce(undefined);
            game.verifyClick(fakePlayer.client.id, undefined, cb);
            expect(PlayerGroupSpy.forEachPlayer).toHaveBeenCalled();
            expect(DifferenceManagerSpy.findDifference).toHaveBeenCalled();
            expect(cb).toHaveBeenCalled();
        });

        it('should return true if a difference was found', async () => {
            game.setOngoing = true;
            cb.mockResolvedValue(true);
            DifferenceManagerSpy.findDifference.mockReturnValue({} as GameDifferenceImages);
            expect(game.verifyClick(fakePlayer.client.id, undefined, cb)).toBeTruthy();
            expect(PlayerGroupSpy.forEachPlayer).toHaveBeenCalled();
            expect(DifferenceManagerSpy.findDifference).toHaveBeenCalled();
            expect(cb).toHaveBeenCalled();
        });

        it('should return false if a difference was not found', async () => {
            game.setOngoing = true;
            cb.mockReturnValue(false);
            DifferenceManagerSpy.findDifference.mockReturnValue(undefined);
            expect(game.verifyClick(fakePlayer.client.id, undefined, cb)).toBeFalsy();
            expect(PlayerGroupSpy.forEachPlayer).toHaveBeenCalled();
            expect(DifferenceManagerSpy.findDifference).toHaveBeenCalled();
            expect(cb).toHaveBeenCalled();
        });
    });

    describe('getLoggyIds', () => {
        it('should return the lobby id in an array', () => {
            expect(game.getLobbyIds()).toEqual([fakePlayer.client.id + 'L']);
        });
    });

    describe('findPlayer', () => {
        it('should call getPlayer on lobby', () => {
            PlayerGroupSpy.getPlayer.mockReturnValueOnce(fakePlayer);
            expect(game.findPlayer(fakePlayer.client.id)).toBe(fakePlayer);
            expect(PlayerGroupSpy.getPlayer).toBeCalledWith(fakePlayer.client.id);
        });
    });

    describe('getPlayerList', () => {
        let secondPlayer: Player;
        let thirdPlayer: Player;
        let expectedResult: PlayerRecordDocument[];

        beforeAll(() => {
            secondPlayer = new Player({
                name: 'fakeUser2',
                client: {
                    id: 'id2',
                    leave: SocketSpy.leave,
                    join: SocketSpy.join,
                    emit: SocketSpy.emit,
                    to: SocketSpy.to,
                } as unknown as Socket,
            });
            thirdPlayer = new Player({
                name: 'fakeUser3',
                client: {
                    id: 'id3',
                    leave: SocketSpy.leave,
                    join: SocketSpy.join,
                    emit: SocketSpy.emit,
                    to: SocketSpy.to,
                } as unknown as Socket,
            });
        });

        it('should return a list of player describing their names, if they are a winner and if they are a deserter', async () => {
            expectedResult = [
                {
                    name: fakePlayer.name,
                    winner: false,
                    deserter: false,
                } as PlayerRecordDocument,
                {
                    name: thirdPlayer.name,
                    winner: true,
                    deserter: false,
                } as PlayerRecordDocument,
                {
                    name: secondPlayer.name,
                    winner: false,
                    deserter: true,
                } as PlayerRecordDocument,
            ];
            game.join(secondPlayer);
            game.join(thirdPlayer);
            await game.removePlayer(secondPlayer.client.id);
            expect(game.getPlayerList([thirdPlayer])).toEqual(expectedResult);
        });

        it('should return a list of player ', async () => {
            expectedResult = [
                {
                    name: fakePlayer.name,
                    winner: true,
                    deserter: false,
                } as PlayerRecordDocument,
                {
                    name: thirdPlayer.name,
                    winner: true,
                    deserter: false,
                } as PlayerRecordDocument,
                {
                    name: secondPlayer.name,
                    winner: false,
                    deserter: true,
                } as PlayerRecordDocument,
            ];
            game.join(secondPlayer);
            game.join(thirdPlayer);
            await game.removePlayer(secondPlayer.client.id);
            expect(game.getPlayerList([])).toEqual(expectedResult);
        });
    });

    describe('getHint', () => {
        it('should send the returned hint to the player', () => {
            const spyOnFindPlayer = jest.spyOn(FakeGame.prototype, 'findPlayer').mockReturnValueOnce(fakePlayer);
            const hint = game.getHint(fakePlayer.client.id);
            expect(hint).toEqual(undefined);
            expect(spyOnFindPlayer).toBeCalledWith(fakePlayer.client.id);
        });

        it('should return if no player with the corresponding id was found', () => {
            const spyOnFindPlayer = jest.spyOn(FakeGame.prototype, 'findPlayer').mockReturnValueOnce(undefined);
            const hint = game.getHint(fakePlayer.client.id);
            expect(hint).toEqual(undefined);
            expect(spyOnFindPlayer).toBeCalledWith(fakePlayer.client.id);
        });

        it('should return if the player has no difference manager', () => {
            const spyOnFindPlayer = jest.spyOn(FakeGame.prototype, 'findPlayer').mockReturnValueOnce(fakePlayer);
            fakePlayer.differenceManager = undefined;
            const hint = game.getHint(fakePlayer.client.id);
            expect(hint).toEqual(undefined);
            expect(spyOnFindPlayer).toBeCalledWith(fakePlayer.client.id);
        });

        describe('time manager', () => {
            beforeEach(() => {
                jest.spyOn(DifferenceManager.prototype, 'hint', 'get').mockReturnValueOnce({} as Hint);
                jest.spyOn(FakeGame.prototype, 'findPlayer').mockReturnValueOnce(fakePlayer);
            });

            it('should add time if the game mode is ClassicSolo', () => {
                game.setGameMode = GameMode.ClassicSolo;
                game.getHint(fakePlayer.client.id);
                expect(TEST.WATCH.SOLID_MOCK.add).toHaveBeenCalled();
            });

            it('should remove time if the game mode is LimitedTimeSolo', () => {
                game.setGameMode = GameMode.LimitedTimeSolo;
                game.getHint(fakePlayer.client.id);
                expect(TEST.WATCH.SOLID_MOCK.remove).toHaveBeenCalled();
            });

            it('should not modify the time', () => {
                game.setGameMode = GameMode.Classic1v1;
                game.getHint(fakePlayer.client.id);
                expect(TEST.WATCH.SOLID_MOCK.add).not.toHaveBeenCalled();
                expect(TEST.WATCH.SOLID_MOCK.remove).not.toHaveBeenCalled();
            });

            it('should not modify the time', () => {
                game.setGameMode = GameMode.LimitedTimeCoop;
                game.getHint(fakePlayer.client.id);
                expect(TEST.WATCH.SOLID_MOCK.add).not.toHaveBeenCalled();
                expect(TEST.WATCH.SOLID_MOCK.remove).not.toHaveBeenCalled();
            });
        });
    });
});
