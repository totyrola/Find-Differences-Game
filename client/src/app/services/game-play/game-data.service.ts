import { Injectable } from '@angular/core';
import { GameMode } from '@common/enums/game-play/game-mode';
import { GameValues } from '@common/interfaces/game-play/game-values';

@Injectable({
    providedIn: 'root',
})
export class GameDataService {
    timeToStart: number;
    modifiedPicture: string;
    chronometerTime: number = 0;
    gameID: string;
    nbOfPlayers: number;
    originalPicture: string;
    differenceNbr: number;
    difficulty: string;
    name: string;
    gameMode: GameMode;
    gameName: string;
    name2ndPlayer: string;
    chronoTime: number;
    gameValues: GameValues;
}
