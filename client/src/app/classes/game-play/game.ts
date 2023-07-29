import { BestTimes } from '@common/interfaces/game-card/best-times';
import { CardPreview } from '@common/interfaces/game-card/card-preview';

export class Game {
    cardId: string;
    name: string;
    difficulty: number;
    classicSoloBestTimes: BestTimes;
    classic1v1BestTimes: BestTimes;
    originalImage: string;
    gameStatus: boolean;

    constructor(game: CardPreview, status: boolean = false) {
        this.cardId = game.id;
        this.name = game.name;
        this.difficulty = game.difficulty;
        this.classicSoloBestTimes = game.classicSoloBestTimes;
        this.classic1v1BestTimes = game.classic1v1BestTimes;
        this.originalImage = game.originalImage;
        this.gameStatus = status;
    }
}
