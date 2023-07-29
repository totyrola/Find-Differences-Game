import { User } from '@app/gateways/game.gateway.constants';
import { Socket } from 'socket.io';
import SinglePlayerGroup from './solo-player-group';

namespace SocketSpy {
    export const leave = jest.fn();
    export const join = jest.fn();
}

describe('SinglePlayerGroup', () => {
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
        new SinglePlayerGroup(fakeUser, onJoin);
        expect(onJoin).toBeCalledTimes(1);
    });
});
