import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SocketTestHelper } from '@app/classes/test-helpers/socket-test-helper';
import { PaperButtonComponent } from '@app/components/general/paper-button/paper-button.component';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { FromServer, ToServer } from '@common/socket-event-constants';
import { AwaitingPlayersModalComponent } from './awaiting-players-modal.component';

describe('AwaitingPlayersModalComponent', () => {
    let component: AwaitingPlayersModalComponent;
    let fixture: ComponentFixture<AwaitingPlayersModalComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AwaitingPlayersModalComponent>>;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        socketHelper = new SocketTestHelper();
        await TestBed.configureTestingModule({
            declarations: [AwaitingPlayersModalComponent, PaperButtonComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: SocketClientService, useValue: socketHelper },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AwaitingPlayersModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should call close method of dialogRef and set hasLeft to true when closeDialog', () => {
        spyOn(socketHelper, 'send');
        component.closeDialog();
        expect(dialogRefSpy.close).toHaveBeenCalled();
        expect(socketHelper.send).toHaveBeenCalledWith(ToServer.LEAVE_GAME, component.data.gameId);
    });

    it('should remove listeners when destroyed', () => {
        spyOn(socketHelper, 'removeListener');
        component.ngOnDestroy();
        expect(socketHelper.removeListener).toHaveBeenCalledWith(FromServer.RESPONSE_TO_JOIN_GAME_REQUEST);
    });

    describe('validatePlayer', () => {
        const waitingPlayer1 = {
            name: 'name1',
            id: 'id1',
        };
        const waitingPlayer2 = {
            name: 'name2',
            id: 'id2',
        };
        let canJoin: boolean;

        it('should send a message to the server to accept a player', () => {
            spyOn(socketHelper, 'send');
            component.data.waitingPlayers = [waitingPlayer1, waitingPlayer2];
            canJoin = true;
            component.validatePlayer(canJoin, waitingPlayer2.id, waitingPlayer2.name);
            expect(component.data.waitingPlayers).toEqual([waitingPlayer2, waitingPlayer2]);
            expect(socketHelper.send).toHaveBeenCalledWith(ToServer.PLAYER_VALIDATION, {
                playerId: waitingPlayer2.id,
                gameId: undefined,
                canJoin,
            });
        });

        it('should send a message to the server to refuse a player', () => {
            spyOn(socketHelper, 'send');
            component.data.waitingPlayers = [waitingPlayer1, waitingPlayer2];
            canJoin = false;
            component.validatePlayer(canJoin, waitingPlayer1.id, waitingPlayer1.name);
            expect(component.data.waitingPlayers).toEqual([waitingPlayer1, waitingPlayer2]);
            expect(socketHelper.send).toHaveBeenCalledWith(ToServer.PLAYER_VALIDATION, {
                playerId: waitingPlayer1.id,
                gameId: undefined,
                canJoin,
            });
        });

        it('should not make player join if there is an error', () => {
            spyOn(socketHelper, 'send');
            canJoin = true;
            component.validatePlayer(canJoin, waitingPlayer1.id, waitingPlayer1.name);
            expect(socketHelper.send).toHaveBeenCalledWith(ToServer.PLAYER_VALIDATION, {
                playerId: waitingPlayer1.id,
                gameId: undefined,
                canJoin: false,
            });
        });
    });
});
