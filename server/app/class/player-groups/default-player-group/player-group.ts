import Player from '@app/class/game-logic/player/player';
import { User } from '@app/gateways/game.gateway.constants';

export default class PlayerGroup {
    protected playerNbr = 0;
    protected players: Player[] = [];
    protected deserters: Player[] = [];
    protected id: string;
    protected valid: boolean;

    constructor(private minPlayerNbr: number, private maxPlayerNbr: number) {}

    get getDeserters() {
        return this.deserters;
    }

    get getPlayerNbr(): number {
        return this.playerNbr;
    }

    get isValid(): boolean {
        return this.valid;
    }

    get getLobbyId(): string {
        return this.id;
    }

    get host() {
        if (this.players.length) return this.players[0];
        return undefined;
    }

    joinUser(user: User, onJoin?: (player: Player) => void): boolean {
        const newPlayer = new Player(user);
        return this.joinPlayer(newPlayer, onJoin);
    }

    joinPlayer(player: Player, onJoin?: (player: Player) => void): boolean {
        if (this.playerNbr === 0) {
            this.id = player.client.id + 'L';
        }
        const addedPlayer = this.addPlayer(player);
        if (addedPlayer) {
            if (onJoin) onJoin(addedPlayer);
            return true;
        }
        return false;
    }

    leave(clientId: string, deserter: boolean): Player {
        const foundPlayer = this.removePlayer(clientId);
        if (foundPlayer) {
            if (deserter) this.deserters.push(foundPlayer);
            this.validate();
        }
        return foundPlayer;
    }

    transferPlayerTo(playerId: string, otherLobby: PlayerGroup): boolean {
        const removedPlayer = this.removePlayer(playerId);
        let addedPlayer = false;
        if (removedPlayer) addedPlayer = otherLobby.joinPlayer(removedPlayer);
        return addedPlayer;
    }

    getPlayer(clientId: string): Player | undefined {
        return this.players.find((player) => player.client.id === clientId);
    }

    getPlayerByIndex(index: number): Player | undefined {
        if (index > this.playerNbr || index < 0) return undefined;
        return this.players[index];
    }

    isPlayerPresent(clientId: string): boolean {
        return this.players.some((player) => player.client.id === clientId);
    }

    empty() {
        for (const player of this.players) player.client.leave(this.id);
        this.id = undefined;
        this.players = [];
        this.deserters = [];
        this.playerNbr = 0;
        this.validate();
    }

    forEachPlayer(func: (player: Player) => boolean) {
        for (const player of this.players) if (func(player)) return true;
        return false;
    }

    protected validate(): void {
        const notEnoughPlayers = this.playerNbr < this.minPlayerNbr;
        const tooMuchPlayers = this.playerNbr > this.maxPlayerNbr;
        this.valid = !notEnoughPlayers && !tooMuchPlayers;
    }

    protected addUser(user: User, verification = true): Player {
        const newPlayer = new Player(user);
        return this.addPlayer(newPlayer, verification);
    }

    protected addPlayer(player: Player, verification = true): Player | undefined {
        if (verification) {
            const isAlreadyPresent = this.isPlayerPresent(player.client.id);
            const fullLobby = this.maxPlayerNbr < this.playerNbr + 1;
            if (isAlreadyPresent || fullLobby) return undefined;
        }

        player.client.join(this.id);
        this.players.push(player);
        this.playerNbr++;
        this.validate();
        return player;
    }

    protected removePlayer(clientId: string): Player {
        for (let i = 0; i < this.playerNbr; i++) {
            const player = this.players[i];
            if (player.client.id === clientId) {
                player.client.leave(this.id);
                this.players.splice(i, 1);
                this.playerNbr--;
                this.validate();
                if (i === 0 && this.players.length >= 1) {
                    const newId = this.players[0].client.id + 'L';
                    this.players.forEach((p: Player) => {
                        p.client.leave(this.id);
                        p.client.join(newId);
                    });
                    this.id = newId;
                }
                return player;
            }
        }
        return undefined;
    }
}
