import { User } from '@app/gateways/game.gateway.constants';
import { Socket } from 'socket.io';
import DuoPlayerGroup from './duo-player-group';

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
}

describe('MultiplayerLobby', () => {
    let fakeUser: User;
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should instantiate', () => {
        const playerGroup = new DuoPlayerGroup(fakeUser, onJoin);
        expect(playerGroup.getLobbyId).toEqual(fakeUser.client.id + 'L');
        expect(onJoin).toBeCalledTimes(1);
    });
});
