/* eslint-disable max-lines */
import Player from '@app/class/game-logic/player/player';
import { User } from '@app/gateways/game.gateway.constants';
import { Socket } from 'socket.io';
import PlayerGroup from './player-group';

class FakeLobby extends PlayerGroup {
    get playerArray() {
        return this.players;
    }

    get deserterArray() {
        return this.deserters;
    }

    set setPlayerNbr(value: number) {
        this.playerNbr = value;
    }

    set setPlayers(players: Player[]) {
        this.players = players;
    }

    set setValidity(valid: boolean) {
        this.valid = valid;
    }

    set setId(id: string) {
        this.id = id;
    }

    addRawPlayer(player: Player, validate = false) {
        this.players.push(player);
        this.playerNbr++;
        if (validate) super.validate();
    }

    addPlayer(player: Player, validate = false) {
        return super.addPlayer(player, validate);
    }

    addUser(user: User, verification?: boolean): Player | undefined {
        return super.addUser(user, verification);
    }

    removePlayer(clientId: string): Player {
        return super.removePlayer(clientId);
    }

    validate() {
        super.validate();
    }
}

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
}

describe('Lobby', () => {
    let lobby: FakeLobby;
    const minPlayerNbr = 1;
    const maxPlayerNbr = 1;
    let fakeUser: User;
    let fakePlayer: Player;
    let secondFakeUser: User;
    let secondFakePlayer: Player;
    const onJoin = jest.fn();

    beforeEach(() => {
        fakeUser = {
            name: 'fakeUser',
            client: {
                id: 'id',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
            } as unknown as Socket,
        };
        fakePlayer = new Player(fakeUser);
        secondFakeUser = {
            name: 'fakeUser2',
            client: {
                id: 'secondId',
                leave: SocketSpy.leave,
                join: SocketSpy.join,
            } as unknown as Socket,
        };
        secondFakePlayer = new Player(secondFakeUser);
        lobby = new FakeLobby(minPlayerNbr, maxPlayerNbr);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getHost', () => {
        it('should return undefined if the lobby is empty', () => {
            expect(lobby.host).toBeUndefined();
        });

        it('should return the host', () => {
            lobby.addRawPlayer(fakePlayer);
            expect(lobby.host).toEqual(fakePlayer);
        });
    });

    describe('getPlayerNbr', () => {
        it('should return the number of players in in the lobby', () => {
            const playerNbr = 10;
            lobby.setPlayerNbr = playerNbr;
            expect(lobby.getPlayerNbr).toEqual(playerNbr);
        });
    });

    describe('isValid', () => {
        it('should return the valid boolean of the lobby', () => {
            lobby.setValidity = true;
            expect(lobby.isValid).toBeTruthy();
        });
    });

    describe('getId', () => {
        it('should return the lobby of the id', () => {
            const id = 'fakeId';
            lobby.setId = id;
            expect(lobby.getLobbyId).toEqual(id);
        });
    });

    describe('joinUser', () => {
        it('should create a player and call joinPlayer', () => {
            const spyOnJoinPlayer = jest.spyOn(PlayerGroup.prototype, 'joinPlayer').mockReturnValueOnce(true);
            expect(lobby.joinUser(fakeUser, onJoin)).toBeTruthy();
            expect(spyOnJoinPlayer).toHaveBeenCalledWith(fakePlayer, onJoin);
        });
    });

    describe('joinPlayer', () => {
        let spyOnAddPlayer;

        beforeAll(() => {
            spyOnAddPlayer = jest.spyOn(FakeLobby.prototype, 'addPlayer');
        });

        afterAll(() => {
            spyOnAddPlayer.mockRestore();
        });

        it('should set the id of the lobby on join if there are no players in the lobby and return true', () => {
            spyOnAddPlayer.mockReturnValue(fakePlayer);
            const returnValue = lobby.joinPlayer(fakePlayer, onJoin);
            expect(spyOnAddPlayer).toBeCalledWith(fakePlayer);
            expect(lobby.getLobbyId).toEqual(fakePlayer.client.id + 'L');
            expect(onJoin).toBeCalledWith(fakePlayer);
            expect(returnValue).toBeTruthy();
        });

        it('should not set the id of the lobby if there are already players present and return false', () => {
            lobby.setPlayerNbr = 1;
            const id = 'id';
            lobby.setId = id;
            spyOnAddPlayer.mockReturnValue(undefined);
            const returnValue = lobby.joinPlayer(fakePlayer, onJoin);
            expect(spyOnAddPlayer).toBeCalledWith(fakePlayer);
            expect(lobby.getLobbyId).toEqual(id);
            expect(onJoin).not.toBeCalled();
            expect(returnValue).toBeFalsy();
        });
    });

    describe('leave', () => {
        let spyOnRemovePlayer;
        let spyOnValidate;

        beforeAll(() => {
            spyOnRemovePlayer = jest.spyOn(FakeLobby.prototype, 'removePlayer');
            spyOnValidate = jest.spyOn(FakeLobby.prototype, 'validate');
        });

        afterAll(() => {
            spyOnRemovePlayer.mockRestore();
            spyOnValidate.mockRestore();
        });

        it('should call validate and return true if removePlayer return true', () => {
            spyOnRemovePlayer.mockReturnValue(true);
            const returnValue = lobby.leave(fakeUser.client.id, false);
            expect(spyOnValidate).toBeCalled();
            expect(returnValue).toBeTruthy();
        });

        it('should add the player to the deserters array if deserter is set to true', () => {
            spyOnRemovePlayer.mockReturnValue(true);
            const returnValue = lobby.leave(fakeUser.client.id, true);
            expect(spyOnValidate).toBeCalled();
            expect(returnValue).toBeTruthy();
            expect(lobby.getDeserters).toHaveLength(1);
        });

        it('should not call validate and return false if removePlayer return false', () => {
            spyOnRemovePlayer.mockReturnValue(undefined);
            const returnValue = lobby.leave(fakeUser.client.id, false);
            expect(spyOnValidate).not.toBeCalled();
            expect(returnValue).toBeFalsy();
        });
    });

    describe('transferPlayerTo', () => {
        it('should remove a user by id and make it join another lobby', () => {
            lobby.addRawPlayer(fakePlayer);
            const spyOnRemovePlayer = jest.spyOn(FakeLobby.prototype, 'removePlayer').mockReturnValueOnce(fakePlayer);
            const spyOnJoinPlayer = jest.spyOn(FakeLobby.prototype, 'joinPlayer').mockReturnValueOnce(true);
            const secondLobby = new FakeLobby(minPlayerNbr, maxPlayerNbr);
            expect(lobby.transferPlayerTo(fakePlayer.client.id, secondLobby)).toBeTruthy();
            expect(spyOnRemovePlayer).toBeCalledWith(fakePlayer.client.id);
            expect(spyOnJoinPlayer).toBeCalledWith(fakePlayer);
        });
    });

    describe('getPlayer', () => {
        it('should return the player in the lobby', () => {
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.getPlayer(fakePlayer.client.id);
            expect(returnValue).toEqual(fakePlayer);
        });
    });

    describe('getPlayerByIndex', () => {
        it('should return the player by index', () => {
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.getPlayerByIndex(0);
            expect(returnValue).toEqual(fakePlayer);
        });

        it('should return undefined if the index is under 0', () => {
            const badIndex = -1;
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.getPlayerByIndex(badIndex);
            expect(returnValue).toBeUndefined();
        });

        it('should return undefined if the index is over the amount of existing players - 1', () => {
            const badIndex = 1;
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.getPlayerByIndex(badIndex);
            expect(returnValue).toBeUndefined();
        });
    });

    describe('isPlayerPresent', () => {
        it('should return true if the player is found in the lobby', () => {
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.isPlayerPresent(fakePlayer.client.id);
            expect(returnValue).toBeTruthy();
        });

        it('should return false if the player is not found in the lobby', () => {
            const badId = 'badId';
            lobby.addRawPlayer(fakePlayer);
            const returnValue = lobby.isPlayerPresent(badId);
            expect(returnValue).toBeFalsy();
        });
    });

    describe('empty', () => {
        it('should kick all players from the room and reset data', () => {
            const spyOnValidate = jest.spyOn(FakeLobby.prototype, 'validate');
            lobby.addRawPlayer(fakePlayer);
            lobby.setId = fakePlayer.client.id;
            lobby.empty();
            expect(SocketSpy.leave).toHaveBeenCalledWith(fakePlayer.client.id);
            expect(lobby.playerArray).toHaveLength(0);
            expect(lobby.deserterArray).toHaveLength(0);
            expect(lobby.getLobbyId).toBeUndefined();
            expect(lobby.getPlayerNbr).toEqual(0);
            expect(spyOnValidate).toHaveBeenCalledTimes(1);
        });
    });

    describe('forEachPlayer', () => {
        it('should run a function on each players', () => {
            const func = jest.fn().mockImplementation((player: Player) => {
                expect(player).toBe(fakePlayer);
            });

            lobby.addRawPlayer(fakePlayer);
            lobby.forEachPlayer(func);
            expect(func).toBeCalledWith(fakePlayer);
        });
    });

    describe('validate', () => {
        it('should set valid to false if there are not enough or too many players in the lobby', () => {
            lobby.setPlayerNbr = 10;
            lobby.validate();
            expect(lobby.isValid).toBeFalsy();
            lobby.setPlayerNbr = 0;
            lobby.validate();
            expect(lobby.isValid).toBeFalsy();
        });

        it('should set valid to true if there are the right amount of players in the lobby', () => {
            lobby.setPlayerNbr = 1;
            lobby.validate();
            expect(lobby.isValid).toBeTruthy();
        });
    });

    describe('addUser', () => {
        it('should create a player and call addPlayer', () => {
            const spyOnAddPlayer = jest.spyOn(FakeLobby.prototype, 'addPlayer').mockReturnValueOnce(fakePlayer);
            expect(lobby.addUser(fakeUser)).toBe(fakePlayer);
            expect(spyOnAddPlayer).toHaveBeenCalledWith(fakePlayer, true);
        });
    });

    describe('addPlayer', () => {
        let spyOnIsPlayerPresent;
        let spyOnValidate;

        beforeAll(() => {
            spyOnIsPlayerPresent = jest.spyOn(FakeLobby.prototype, 'isPlayerPresent');
            spyOnValidate = jest.spyOn(FakeLobby.prototype, 'validate');
        });

        it('if verification is true, return undefined if the player is already present and/or the lobby has already reached max capacity', () => {
            spyOnIsPlayerPresent.mockReturnValueOnce(false);
            lobby.setPlayerNbr = 1;
            expect(lobby.addPlayer(fakePlayer, true)).toBeUndefined();

            lobby.setPlayerNbr = 0;
            spyOnIsPlayerPresent.mockReturnValueOnce(true);
            expect(lobby.addPlayer(fakePlayer, true)).toBeUndefined();

            spyOnIsPlayerPresent.mockReturnValueOnce(true);
            lobby.setPlayerNbr = 1;
            expect(lobby.addPlayer(fakePlayer, true)).toBeUndefined();
            expect(spyOnValidate).not.toBeCalled();

            spyOnIsPlayerPresent.mockReturnValueOnce(false);
            lobby.setPlayerNbr = 0;
            expect(lobby.addPlayer(fakePlayer, true)).toEqual(fakePlayer);
            expect(spyOnValidate).toBeCalledTimes(1);
        });

        it('should add the player to the lobby', () => {
            expect(lobby.addPlayer(fakePlayer, false)).toEqual(fakePlayer);
            expect(lobby.getPlayerNbr).toEqual(1);
            expect(lobby.isValid).toBeTruthy();
            expect(lobby.playerArray.length).toEqual(1);
            expect(spyOnValidate).toBeCalledTimes(1);
            expect(SocketSpy.join).toBeCalledTimes(1);
        });
    });

    describe('removePlayer', () => {
        let spyOnValidate;

        beforeAll(() => {
            spyOnValidate = jest.spyOn(FakeLobby.prototype, 'validate');
        });

        it('should change the room id if the host is removed', () => {
            lobby.addRawPlayer(fakePlayer);
            lobby.addRawPlayer(secondFakePlayer);
            expect(lobby.removePlayer(fakePlayer.client.id)).toBeTruthy();
            expect(lobby.getPlayerNbr).toEqual(1);
            expect(lobby.isValid).toBeTruthy();
            expect(lobby.playerArray.length).toEqual(1);
            expect(SocketSpy.leave).toBeCalled();
            expect(spyOnValidate).toBeCalledTimes(1);
            expect(lobby.getLobbyId).toEqual('secondIdL');
        });

        it('should remove the player by his id', () => {
            lobby.addRawPlayer(fakePlayer);
            expect(lobby.removePlayer(fakePlayer.client.id)).toBeTruthy();
            expect(lobby.getPlayerNbr).toEqual(0);
            expect(lobby.isValid).toBeFalsy();
            expect(lobby.playerArray.length).toEqual(0);
            expect(SocketSpy.leave).toBeCalledTimes(1);
            expect(spyOnValidate).toBeCalledTimes(1);
        });

        it('should not remove a player if no id corresponds', () => {
            const fakeId = 'fid';
            lobby.addRawPlayer(fakePlayer, true);
            expect(lobby.removePlayer(fakeId)).toBeFalsy();
            expect(lobby.getPlayerNbr).toEqual(1);
            expect(lobby.isValid).toBeTruthy();
            expect(lobby.playerArray.length).toEqual(1);
            expect(SocketSpy.leave).not.toBeCalled();
            expect(spyOnValidate).not.toBeCalled();
        });
    });
});
