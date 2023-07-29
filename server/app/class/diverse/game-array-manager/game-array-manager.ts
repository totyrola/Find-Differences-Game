import Game from '@app/class/game-logic/game-interfaces/game-interface';

export default class GameArrayManager {
    private games: Game[] = [];

    get getGameAmount() {
        return this.games.length;
    }

    addGame(game: Game) {
        this.games.push(game);
    }

    findGame(gameId: string): Game | undefined {
        for (const game of this.games) if (game.getId === gameId) return game;
        return undefined;
    }

    removeGame(gameId: string): Game | undefined {
        const removedGame = this.findGame(gameId);
        if (removedGame) this.games = this.games.filter((game) => game.getId !== gameId);
        return removedGame;
    }

    forEach(func: (game: Game) => boolean): boolean {
        for (const game of this.games) {
            const methodResult = func(game);
            if (methodResult) return true;
        }
        return false;
    }

    findGameByPlayerId(playerId: string): Game | undefined {
        for (const game of this.games) if (game.findPlayer(playerId)) return game;
        return undefined;
    }

    async removePlayerById(playerId: string): Promise<boolean> {
        for (const game of this.games) if (await game.removePlayer(playerId)) return true;
        return false;
    }

    isPlaying(playerId: string) {
        for (const game of this.games) if (game.findPlayer(playerId)) return true;
        return false;
    }

    empty() {
        this.games = [];
    }
}
