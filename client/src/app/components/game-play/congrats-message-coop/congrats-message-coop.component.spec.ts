/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatService } from '@app/services/game-play/chat.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { EndgameOutputDto } from '@common/interfaces/game-play/game-endgame.dto';
import { CongratsMessageCoopComponent } from './congrats-message-coop.component';

describe('CongratsMessageComponent', () => {
    let component: CongratsMessageCoopComponent;
    let fixture: ComponentFixture<CongratsMessageCoopComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CongratsMessageCoopComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;
    let replayServiceSpy: jasmine.SpyObj<ReplayService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        replayServiceSpy = jasmine.createSpyObj('ReplayService', ['restart']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['getGameData']);

        TestBed.configureTestingModule({
            declarations: [CongratsMessageCoopComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: ReplayService, useValue: replayServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CongratsMessageCoopComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should set winner and isWinner properties correctly when winner is player 1', () => {
        const endgameData: EndgameOutputDto = {
            players: [
                { name: 'Player 1', winner: true, deserter: false },
                { name: 'Player 2', winner: false, deserter: false },
            ],
        };
        component.data = { message: endgameData, replayIsAvailable: true };
        component.ngOnInit();
        expect(component.winner).toEqual(endgameData.players[0]);
        expect(component.isWinner).toBeFalse();
    });

    it('should set winner and isWinner properties correctly when winner is player 2', () => {
        const endgameData: EndgameOutputDto = {
            players: [
                { name: 'Player 1', winner: false, deserter: false },
                { name: 'Player 2', winner: true, deserter: false },
            ],
        };
        component.data = { message: endgameData, replayIsAvailable: true };
        component.ngOnInit();
        expect(component.winner).toEqual(endgameData.players[1]);
        expect(component.isWinner).toBeFalse();
    });

    it('should close the dialog and navigate to /home when closePopup is called', () => {
        component.closePopup(false);
        expect(dialogRefSpy.close).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('should call replayService.replay if replay is true', () => {
        component.closePopup(true);

        expect(replayServiceSpy.restart).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should navigate to /home if replay is false', () => {
        component.closePopup(false);

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
        expect(replayServiceSpy.restart).not.toHaveBeenCalled();
    });
});
