import { validate } from 'class-validator';
import { ChatMessageFilter } from './chat-message.dto';
import * as LongText from './long-text.json';

describe('ChatMessageFilter', () => {
    let dto;

    beforeEach(() => {
        dto = new ChatMessageFilter();
        dto.message = 'valid message';
        dto.gameId = 'valid-id-bla-bla-bla';
    });

    afterEach(async () => {
        expect(await validate(dto)).toHaveLength(1);
    });

    it('should fail text validation (too short)', () => {
        dto.message = '';
    });

    it('should fail text validation (too long)', () => {
        dto.message = LongText;
    });

    it('should fail text validation (undefined)', () => {
        dto.message = undefined;
    });

    it('should fail text validation (number)', () => {
        dto.message = 2;
    });

    it('should fail gameId validation (too short)', () => {
        dto.gameId = 'bad id';
    });

    it('should fail gameId validation (too long)', () => {
        dto.gameId = LongText;
    });

    it('should fail gameId validation (undefined)', () => {
        dto.gameId = undefined;
    });

    it('should fail gameId validation (number)', () => {
        dto.gameId = 2;
    });
});
