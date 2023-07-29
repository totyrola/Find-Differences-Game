import { Card } from './interfaces/game-card/card';
import { CardCreationOutputDto } from './interfaces/game-card/card-creation.dto';
import { CardFiles } from './interfaces/game-card/card-files';
import { CardPreview } from './interfaces/game-card/card-preview';
import { CardValidationOutputDto } from './interfaces/game-card/card-validation.dto';
import { ChatMessageOutputDto } from './interfaces/game-play/chat-message.dto';
import { GameClickOutputDto } from './interfaces/game-play/game-click.dto';
import { GameConnectionRequestOutputMessageDto } from './interfaces/game-play/game-connection-request.dto';
import { EndgameOutputDto } from './interfaces/game-play/game-endgame.dto';
import { GameValues } from './interfaces/game-play/game-values';
import { Hint } from './interfaces/game-play/hint';
import { GamePlayerConnectionAttemptRemarkFilter } from './interfaces/gateway-dto/game-player-connection-attempt.remark';
import { Record } from './interfaces/records/record';

export class Event<T> {
    readonly type: T;
    constructor(public readonly name: string) {}
}

export namespace ToServer {
    export const CLICK = 'send_click';
    export const CHAT_MESSAGE = 'send_chat_message';
    export const REQUEST_TO_PLAY = 'request_to_play';
    export const CARD_VALIDATION_REQUEST = 'send_card_validation_request';
    export const CARD_CREATION_REQUEST = 'send_card_creation_request';
    export const PLAYER_VALIDATION = 'validate_player';
    export const CHEAT = 'get_cheats';
    export const LEAVE_GAME = 'leave_game';
    export const HINT = 'hint';
    export const JOINABLE_GAME_CARDS = 'joinable_game_cards';
    export const SET_GAME_VALUES = 'set_game_values';
    export const GET_GAME_VALUES = 'get_game_values';
    export const ALL_GAME_CARDS = 'all_game_cards';
    export const DELETE_ALL_CARDS = 'delete_all_cards';
    export const DELETE_ALL_RECORDS = 'delete_all_records';
    export const DELETE_CARD = 'delete_card';
    export const GET_ALL_RECORDS = 'get_all_records';
    export const RESET_BEST_TIMES = 'reset_best_times';
    export const IS_PLAYING = 'is_playing';
    export const RESET_ALL_BEST_TIMES = 'reset_all_best_times';
}

export namespace FromServer {
    export const IS_PLAYING = new Event<boolean>('is_playing');
    export const FRONTEND_CARD_TIMES = new Event<Card>('frontend_card_times');
    export const ALL_FRONTEND_CARD_TIMES = new Event<Card[]>('all_frontend_card_times');
    export const GAME_CARD = new Event<CardPreview>('game_card');
    export const SPREAD_HISTORY = new Event<Record>('history_received');
    export const PLAYER_STATUS = new Event<GamePlayerConnectionAttemptRemarkFilter>('player_status');
    export const ENDGAME = new Event<EndgameOutputDto>('endgame');
    export const CLICK_PERSONAL = new Event<GameClickOutputDto>('click_personal');
    export const CLICK_ENEMY = new Event<GameClickOutputDto>('click_enemy');
    export const RESPONSE_TO_JOIN_GAME_REQUEST = new Event<GameConnectionRequestOutputMessageDto>('response_to_play_request');
    export const CARD_VALIDATION = new Event<CardValidationOutputDto>('card_validation');
    export const CARD_CREATION = new Event<CardCreationOutputDto>('card_creation');
    export const CHAT_MESSAGE = new Event<ChatMessageOutputDto>('chat_message');
    export const CHEAT = new Event<string[]>('cheat');
    export const HINT = new Event<Hint>('hint');
    export const DESERTER = new Event<string>('deserter');
    export const JOINABLE_GAME_CARDS = new Event<string[]>('joinable_game_cards');
    export const CHEAT_INDEX = new Event<number>('cheat_index');
    export const GAME_VALUES = new Event<GameValues>('game_values');
    export const ALL_GAME_CARDS = new Event<CardPreview[]>('all_game_cards');
    export const CARD_DELETE_RESPONSE = new Event<boolean>('card_delete_response');
    export const GLOBAL_MESSAGE = new Event<string>('global_message');
    export const TIME = new Event<number>('time');
    export const NEXT_CARD = new Event<CardFiles>('next_card');
    export const ALL_RECORDS = new Event<Record[]>('all_records');
    export const RECORD_BEATER = new Event<string>('record_beater');
}
