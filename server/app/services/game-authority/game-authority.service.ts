import GameArrayManager from '@app/class/diverse/game-array-manager/game-array-manager';
import ClassicSingleplayer from '@app/class/game-logic/classic-singleplayer/classic-singleplayer';
import Classic1v1 from '@app/class/game-logic/classic1v1/classic1v1';
import Game from '@app/class/game-logic/game-interfaces/game-interface';
import { GAME_VALUES } from '@app/class/game-logic/game-logic.constants';
import LimitedTimeCoop from '@app/class/game-logic/limited-time-coop/limited-time-coop';
import LimitedTimeSolo from '@app/class/game-logic/limited-time-singleplayer/limited-time-singleplayer';
import GameGateway from '@app/gateways/game.gateway';
import { GameConnectionData } from '@app/gateways/game.gateway.constants';
import OutputFilterGateway from '@app/gateways/output-filters.gateway';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { GameValues } from '@common/interfaces/game-play/game-values';

export default class GameAuthorityService {
    static mongoDBService: MongoDBService;
    static gameGateway: GameGateway;
    static joinableGames: string[] = [];
    static gameValues: GameValues = GAME_VALUES;
    private static ongoingGames = new GameArrayManager();
    private static pendingGames = new GameArrayManager();

    static get getOngoingGames(): GameArrayManager {
        return this.ongoingGames;
    }

    static get getPendingGames(): GameArrayManager {
        return this.pendingGames;
    }

    static async connect(connectionData: GameConnectionData) {
        if (this.isPlaying(connectionData.user.client.id)) return;
        if (this.joinPendingGame(connectionData)) return;
        switch (connectionData.gameMode) {
            case GameMode.Classic1v1: {
                const successfullyAdded = await new Classic1v1(this.mongoDBService).initialize(connectionData);
                if (successfullyAdded) {
                    this.joinableGames.push(connectionData.cardId);
                    OutputFilterGateway.sendJoinableGames.toServer(this.joinableGames);
                }
                break;
            }
            case GameMode.ClassicSolo: {
                await new ClassicSingleplayer(this.mongoDBService).initialize(connectionData);
                break;
            }
            case GameMode.LimitedTimeCoop: {
                await new LimitedTimeCoop(this.mongoDBService).initialize(connectionData);
                break;
            }
            case GameMode.LimitedTimeSolo: {
                await new LimitedTimeSolo(this.mongoDBService).initialize(connectionData);
                break;
            }
        }
    }

    static removeJoinableGames(cardId: string) {
        for (let i = 0; i < this.joinableGames.length; i++)
            if (this.joinableGames[i] === cardId) {
                this.joinableGames.splice(i, 1);
                OutputFilterGateway.sendJoinableGames.toServer(this.joinableGames);
            }
    }

    static startGame(gameId: string, cardId: string): void {
        const startingGame = this.pendingGames.removeGame(gameId);
        if (startingGame !== undefined) {
            this.removeJoinableGames(cardId);
            this.ongoingGames.addGame(startingGame);
        }
    }

    static isPlaying(playerId: string) {
        return this.ongoingGames.isPlaying(playerId) || this.pendingGames.isPlaying(playerId);
    }

    static removePlayer(playerId: string) {
        this.ongoingGames.removePlayerById(playerId);
        this.pendingGames.removePlayerById(playerId);
    }

    static joinPendingGame(data: GameConnectionData): boolean {
        let func: (game: Game) => boolean;
        switch (data.gameMode) {
            case GameMode.ClassicSolo:
                return false;

            case GameMode.LimitedTimeSolo:
                return false;

            case GameMode.Classic1v1:
                func = (game: Game): boolean => {
                    if (game.getGameMode === data.gameMode && data.cardId === game.getCardId) if (game.join(data.user)) return true;
                    return false;
                };
                break;

            case GameMode.LimitedTimeCoop:
                func = (game: Game): boolean => {
                    if (game.getGameMode === data.gameMode) if (game.join(data.user)) return true;
                    return false;
                };
                break;
        }
        const hasJoined = this.pendingGames.forEach(func);
        return hasJoined;
    }
}
