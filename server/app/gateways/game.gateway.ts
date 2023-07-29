import Classic1v1 from '@app/class/game-logic/classic1v1/classic1v1';
import { ChatMessageFilter } from '@app/model/gateway-dto/game/chat-message.dto';
import { GameClickFilter } from '@app/model/gateway-dto/game/game-click.dto';
import { GameConnectionRequestFilter } from '@app/model/gateway-dto/game/game-connection-request.dto';
import { GameValuesInputFilter } from '@app/model/gateway-dto/game/game-values.dto';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { GameMode } from '@common/enums/game-play/game-mode';
import { ChatMessageOutputDto } from '@common/interfaces/game-play/chat-message.dto';
import { PlayerValidationDto } from '@common/interfaces/game-play/game-player-validation.dto';
import * as Events from '@common/socket-event-constants';
import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GATEWAY_PORT, GameConnectionData } from './game.gateway.constants';
import OutputFilterGateway from './output-filters.gateway';

@WebSocketGateway(GATEWAY_PORT)
export default class GameGateway implements OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer() server: Server;

    constructor(private mongoDBService: MongoDBService) {
        GameAuthorityService.mongoDBService = this.mongoDBService;
    }

    @SubscribeMessage(Events.ToServer.IS_PLAYING)
    isPlaying(client: Socket) {
        const result = GameAuthorityService.getOngoingGames.findGameByPlayerId(client.id) !== undefined;
        OutputFilterGateway.sendPlayerStatus.toClient(client, result);
    }

    /**
     * Verifies the identity of the client , then verifies if his click hit a difference or not and
     * finally informs him and everyone in his game of the result.
     *
     * @param client - The socket of the client who sent the event
     * @param input - The coordinates of the click on the game canvas by the client
     */
    @SubscribeMessage(Events.ToServer.CLICK)
    verifyClick(client: Socket, input: GameClickFilter) {
        const game = GameAuthorityService.getOngoingGames.findGame(input.gameId);
        if (!game) return;
        const player = game.findPlayer(client.id);
        if (!player || player.downTime === true) return;
        game.verifyClick(client.id, { x: input.x, y: input.y });
    }

    /**
     * Verifies the identity of the client, than sends the message to the other players in his game.
     *
     * @param client - The socket of the client who sent the event
     * @param input - the message sent by the client to the other players in his game
     */
    @SubscribeMessage(Events.ToServer.CHAT_MESSAGE)
    sendChatMessage(client: Socket, input: ChatMessageFilter) {
        const game = GameAuthorityService.getOngoingGames.findGame(input.gameId);
        const player = game?.findPlayer(client.id);
        if (!player) return;
        for (const lobbyId of game.getLobbyIds())
            OutputFilterGateway.sendChatMessage.broadcast(
                client,
                {
                    sender: player.name,
                    message: input.message,
                } as ChatMessageOutputDto,
                lobbyId,
            );
    }
    /**
     * Parses the data sent by the client to a minimalist format and attempts to connect him to a
     * game.
     *
     * @param client - The socket of the client who sent the event
     * @param input - The necessary information for the client to connect to a game
     */
    @SubscribeMessage(Events.ToServer.REQUEST_TO_PLAY)
    joinGame(client: Socket, input: GameConnectionRequestFilter) {
        Logger.log('Attempting to connect client: ' + client.id);
        const data: GameConnectionData = {
            gameMode: input.gameMode,
            cardId: input.cardId,
            user: {
                name: input.playerName,
                client,
            },
        };
        GameAuthorityService.connect(data);
    }

    /**
     * Verifies the identity of the client, than kicks a player from a waiting lobby or makes him
     * join a game depending on the host's decision
     *
     * @param client - The socket of the client who sent the event
     * @param input - The necessary information to accept or reject a player from a game
     */
    @SubscribeMessage(Events.ToServer.PLAYER_VALIDATION)
    async validatePlayer(client: Socket, input: PlayerValidationDto) {
        const game = GameAuthorityService.getPendingGames.findGame(input.gameId);
        if (!game || game.getGameMode !== GameMode.Classic1v1 || game.host?.client.id !== client.id) return;
        if (!input.canJoin) (game as Classic1v1).kickWaitingPlayer(input.playerId);
        else game.startGame(input.playerId);
    }

    /**
     * Starts by verifying the identity of the player before sending him the data, then sends him an array
     * with the length of the available differences and the yet to find differences with their appropriate
     * indexes.
     *
     * @param client - The socket of the client who sent the event
     * @param gameId - The id of the game in which the client plays
     */
    @SubscribeMessage(Events.ToServer.CHEAT)
    async sendCheatFlashes(client: Socket, gameId: string) {
        const game = GameAuthorityService.getOngoingGames.findGame(gameId);
        const player = game?.findPlayer(client.id);
        const flashes = player?.differenceManager?.cheatFlashImages;
        if (flashes) OutputFilterGateway.sendAllCheatFlashImages.toClient(client, flashes);
    }

    /**
     * Attempts to remove the client from a game, and thus looks for a corresponding game in the ongoing and
     * pending games list and try's to remove him
     *
     * @param client - The socket of the client who sent the event
     * @param gameId - The id of the game in which the client plays
     */
    @SubscribeMessage(Events.ToServer.LEAVE_GAME)
    async leaveGame(client: Socket, gameId: string) {
        const removedPlayer = await GameAuthorityService.getPendingGames.findGame(gameId)?.removePlayer(client.id);
        if (!removedPlayer) await GameAuthorityService.getOngoingGames.findGame(gameId)?.removePlayer(client.id);
    }

    @SubscribeMessage(Events.ToServer.SET_GAME_VALUES)
    async setGameValues(client: Socket, gameValues: GameValuesInputFilter) {
        if (gameValues.gainedTime !== undefined) GameAuthorityService.gameValues.gainedTime = gameValues.gainedTime;
        if (gameValues.penaltyTime !== undefined) GameAuthorityService.gameValues.penaltyTime = gameValues.penaltyTime;
        if (gameValues.timerTime !== undefined) GameAuthorityService.gameValues.timerTime = gameValues.timerTime;
    }

    @SubscribeMessage(Events.ToServer.GET_GAME_VALUES)
    async sendGameValues(client: Socket) {
        OutputFilterGateway.sendGameValues.toClient(client, GameAuthorityService.gameValues);
    }

    /**
     * Attempts to find an ongoing game with the corresponding Id and sends the client a hint if he is
     * in the game
     *
     * @param client - The socket of the client who sent the event
     * @param gameId - The id of the game in which the client plays
     */
    @SubscribeMessage(Events.ToServer.HINT)
    getHint(client: Socket, gameId: string) {
        const hint = GameAuthorityService.getOngoingGames.findGame(gameId)?.getHint(client.id);
        if (hint) OutputFilterGateway.sendHint.toClient(client, hint);
    }

    /**
     * Sends a list of joinable games to the client
     *
     * @param client - The socket of the client who sent the event
     */
    @SubscribeMessage(Events.ToServer.JOINABLE_GAME_CARDS)
    getJoinableGames(client: Socket) {
        OutputFilterGateway.sendJoinableGames.toClient(client, GameAuthorityService.joinableGames);
    }

    handleConnection(client: Socket) {
        Logger.log('A client has connected: ' + client.id);
    }

    handleDisconnect(client: Socket) {
        GameAuthorityService.removePlayer(client.id);
        Logger.log('A client has disconnected: ' + client.id);
    }
}
