import { FAKE_GAMES } from '@app/constants/game-selection-test-constants';
import { Game } from './game';

describe('Game', () => {
    it('should create an instance', () => {
        expect(new Game(FAKE_GAMES[0])).toBeTruthy();
    });
});
