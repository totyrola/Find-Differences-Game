/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GameClickResponseType } from '@common/enums/game-play/game-click-response-type';
import { GameConnectionAttemptResponseType } from '@common/enums/game-play/game-connection-attempt-response-type';
import { GameMode } from '@common/enums/game-play/game-mode';
import { SimpleUser } from '@common/interfaces/game-play/simple-user';
import {
    CARDID_LENGTH,
    GAMEID_LENGTH,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    MAX_CHAT_MESSAGE_LENGTH,
    MIN_CHAT_MESSAGE_LENGTH,
    NAME_MAX_LENGTH,
    NAME_MIN_LENGTH,
} from './game.constants';

describe('Constants and Enums', () => {
    it('should have the correct values for MIN_CHAT_MESSAGE_LENGTH and MAX_CHAT_MESSAGE_LENGTH', () => {
        expect(MIN_CHAT_MESSAGE_LENGTH).toBe(1);
        expect(MAX_CHAT_MESSAGE_LENGTH).toBe(100);
    });

    it('should have the correct values for CARDID_LENGTH and GAMEID_LENGTH', () => {
        expect(CARDID_LENGTH).toBe(20);
        expect(GAMEID_LENGTH).toBe(20);
    });

    it('should have the correct values for IMAGE_HEIGHT and IMAGE_WIDTH', () => {
        expect(IMAGE_HEIGHT).toBe(480);
        expect(IMAGE_WIDTH).toBe(640);
    });

    it('should have the correct values for NAME_MAX_LENGTH and NAME_MIN_LENGTH', () => {
        expect(NAME_MAX_LENGTH).toBe(15);
        expect(NAME_MIN_LENGTH).toBe(3);
    });

    it('should have the correct values for GameClickResponseType', () => {
        expect(GameClickResponseType.Valid).toBe(0);
        expect(GameClickResponseType.Invalid).toBe(1);
    });

    it('should have the correct values for GameConnectionAttemptResponseType', () => {
        expect(GameConnectionAttemptResponseType.Starting).toBe(0);
        expect(GameConnectionAttemptResponseType.Pending).toBe(1);
        expect(GameConnectionAttemptResponseType.Cancelled).toBe(2);
    });

    it('should have the correct values for GameMode', () => {
        expect(GameMode.Classic1v1).toBe(0);
        expect(GameMode.ClassicSolo).toBe(1);
        expect(GameMode.LimitedTimeCoop).toBe(2);
        expect(GameMode.LimitedTimeSolo).toBe(3);
    });

    it('should have the correct structure for SimpleUser', () => {
        const user: SimpleUser = { name: 'John', id: '123' };
        expect(user).toEqual({ name: 'John', id: '123' });
    });
});
