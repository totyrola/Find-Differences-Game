import Player from '@app/class/game-logic/player/player';
import PlayerGroup from '@app/class/player-groups/default-player-group/player-group';
import Watch from '@app/class/watch/watch/watch';
import { GameConnectionData, User } from '@app/gateways/game.gateway.constants';
import { PlayerRecordDocument } from '@app/model/database-schema/player-record.schema';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { Hint } from '@common/interfaces/difference-locator-algorithm/hint';
import { Card } from '@common/interfaces/game-card/card';
import { CardBase64Files } from '@common/interfaces/game-card/card-base64-files';
import { GameDifferenceImages } from '@common/interfaces/game-play/game-click.dto';
import { GameValues } from '@common/interfaces/game-play/game-values';
import { Coordinates } from '@common/interfaces/general/coordinates';

export default abstract class Game {
    protected gameMode: GameMode;
    protected gameValues: GameValues;
    protected id: string;
    protected isOngoing = false;
    protected gameWatch: Watch;
    protected startTime: string = Date();
    protected playerGroup: PlayerGroup;
    protected cardId: string;
    protected card: Card;
    protected cardFiles: CardBase64Files;

    constructor(protected mongodbService: MongoDBService) {}

    get host() {
        if (this.playerGroup) return this.playerGroup.host;
        return undefined;
    }

    get getCardId() {
        return this.cardId;
    }

    get getGameMode(): GameMode {
        return this.gameMode;
    }
    get getId() {
        return this.id;
    }

    get getIsOngoing() {
        return this.isOngoing;
    }

    async initialize?(data: GameConnectionData): Promise<boolean>;

    startGame?(clientId?: string): void;

    async endGame?(winner?: Player): Promise<void>;

    join?(user: User): boolean;

    async removePlayer?(playerId: string): Promise<boolean>;

    verifyClick(playerId: string, clickCoordinates: Coordinates, cb?: (found: GameDifferenceImages, player?: Player) => boolean): boolean {
        if (!this.isOngoing) return false;
        return this.playerGroup.forEachPlayer((player: Player) => {
            const matchingId = player.client.id === playerId;
            if (matchingId && !player.downTime) {
                const foundDifferenceValues = player.differenceManager.findDifference(clickCoordinates);
                if (cb(foundDifferenceValues, player)) return true;
            }
        });
    }

    findPlayer(playerId: string): Player | undefined {
        return this.playerGroup.getPlayer(playerId);
    }

    getLobbyIds(): string[] {
        return [this.playerGroup.getLobbyId];
    }

    getPlayerList(winners: Player[]): PlayerRecordDocument[] {
        const players = [];
        const existingWinners = winners.length !== 0;
        this.playerGroup.forEachPlayer((player: Player) => {
            let isAWinner = false;
            if (existingWinners)
                for (const winner of winners) {
                    if (winner)
                        if (winner.client.id === player.client.id) {
                            isAWinner = true;
                            break;
                        }
                }
            else isAWinner = true;
            players.push({
                name: player.name,
                winner: isAWinner,
                deserter: false,
            } as PlayerRecordDocument);
            return false;
        });
        this.playerGroup.getDeserters.forEach((deserter: Player) => {
            players.push({
                name: deserter.name,
                winner: false,
                deserter: true,
            } as PlayerRecordDocument);
        });
        return players;
    }

    getHint(playerId: string): Hint {
        const player = this.findPlayer(playerId);
        if (player) {
            const hint = player.differenceManager?.hint;
            if (hint) {
                switch (this.gameMode) {
                    case GameMode.ClassicSolo:
                        this.gameWatch.add(this.gameValues.penaltyTime);
                        break;
                    case GameMode.Classic1v1:
                        break;
                    case GameMode.LimitedTimeCoop:
                        break;
                    case GameMode.LimitedTimeSolo:
                        this.gameWatch.remove(this.gameValues.penaltyTime);
                        break;
                }
            }
            return hint;
        }
    }
}
