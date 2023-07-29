import { Injectable } from '@angular/core';
import { Game } from '@app/classes/game-play/game';
import { CardPreview } from '@common/interfaces/game-card/card-preview';
import * as Events from '@common/socket-event-constants';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class GameListManagerService {
    games: Game[] = [];
    initialized = false;

    constructor(private socket: SocketClientService) {}

    init() {
        if (!this.initialized) {
            this.socket.on(Events.FromServer.ALL_GAME_CARDS, (games: typeof Events.FromServer.ALL_GAME_CARDS.type) => {
                this.socket.send<void>(Events.ToServer.JOINABLE_GAME_CARDS);
                this.games = [];
                games.forEach((game: CardPreview) => {
                    this.games.push(new Game(game));
                });
            });
            this.socket.on(Events.FromServer.GAME_CARD, (game: CardPreview) => {
                this.games.push(new Game(game));
            });
            this.socket.on(Events.FromServer.FRONTEND_CARD_TIMES, this.updateGameScore.bind(this));
            this.socket.on(Events.FromServer.JOINABLE_GAME_CARDS, this.updateGameStatus.bind(this));
            this.socket.on(Events.FromServer.ALL_FRONTEND_CARD_TIMES, this.updateAllGameScore.bind(this));

            this.socket.send<void>(Events.ToServer.ALL_GAME_CARDS);
            this.initialized = true;
        }
    }

    deleteGame(id: string) {
        this.games.splice(
            this.games.findIndex((game) => {
                return game.cardId === id;
            }),
            1,
        );
        this.socket.send(Events.ToServer.DELETE_CARD, id);
    }

    deleteAllGames() {
        this.games = [];
        this.socket.send(Events.ToServer.DELETE_ALL_CARDS);
    }

    resetBestTimes(cardId: string) {
        this.socket.send(Events.ToServer.RESET_BEST_TIMES, cardId);
    }

    resetAllBestTimes() {
        this.socket.send(Events.ToServer.RESET_ALL_BEST_TIMES);
    }

    private updateGameStatus(joinableGames: typeof Events.FromServer.JOINABLE_GAME_CARDS.type) {
        this.games.forEach((game) => {
            if (
                joinableGames.find((id) => {
                    return game.cardId === id;
                })
            ) {
                game.gameStatus = true;
            } else {
                game.gameStatus = false;
            }
        });
    }

    private updateGameScore(newScore: typeof Events.FromServer.FRONTEND_CARD_TIMES.type) {
        const game = this.games.find((card: Game) => {
            return card.cardId === newScore.id;
        });
        if (game) {
            if (newScore.classicSoloBestTimes) game.classicSoloBestTimes = newScore.classicSoloBestTimes;
            if (newScore.classic1v1BestTimes) game.classic1v1BestTimes = newScore.classic1v1BestTimes;
        }
    }

    private updateAllGameScore(newScores: typeof Events.FromServer.ALL_FRONTEND_CARD_TIMES.type) {
        newScores.forEach((newScore) => this.updateGameScore(newScore));
    }
}
