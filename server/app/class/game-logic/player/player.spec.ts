import Timer from '@app/class/watch/timer/timer';
import { User } from '@app/gateways/game.gateway.constants';
import { Socket } from 'socket.io';
import Player from './player';

class FakePlayer extends Player {
    get timer() {
        return this.penaltyTimer;
    }
}

jest.mock('@app/class/game-logic/difference-manager/difference-manager');

describe('Player', () => {
    let player: FakePlayer;
    const fakeUser: User = {
        name: 'Ryan',
        client: {
            id: 'abc123',
        } as Socket,
    };
    const lowerPenaltyTime = 4;
    const higherPenaltyTime = 5;
    const spyOnStartTimer = jest.spyOn(Timer.prototype, 'start');
    const onEnd = jest.fn();

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(async () => {
        player = new FakePlayer(fakeUser);
    });

    describe('startPenalty', () => {
        it('should stop the method if the present penalty time is longer than the suggested one and downtime is true', () => {
            player.downTime = true;
            player.timer.set(higherPenaltyTime);
            player.startPenalty(lowerPenaltyTime, onEnd);
            expect(spyOnStartTimer).not.toBeCalled();
            expect(player.downTime).toBeTruthy();
        });

        it('should start the penalty for the player, setting downtime to true for its duration', () => {
            player.downTime = false;
            player.timer.set(lowerPenaltyTime);
            player.startPenalty(higherPenaltyTime, onEnd);
            expect(player.downTime).toBeTruthy();
            jest.runAllTimers();
            expect(spyOnStartTimer).toBeCalledTimes(1);
            expect(player.downTime).toBeFalsy();
            expect(onEnd).toHaveBeenCalled();
        });
    });
});
