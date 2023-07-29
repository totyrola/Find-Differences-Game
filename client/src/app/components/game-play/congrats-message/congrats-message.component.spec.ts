import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatService } from '@app/services/game-play/chat.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { CongratsMessageComponent } from './congrats-message.component';

describe('CongratsMessageComponent', () => {
    let component: CongratsMessageComponent;
    let fixture: ComponentFixture<CongratsMessageComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CongratsMessageComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;
    let replayServiceSpy: jasmine.SpyObj<ReplayService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        replayServiceSpy = jasmine.createSpyObj('ReplayService', ['restart']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['restart']);

        TestBed.configureTestingModule({
            declarations: [CongratsMessageComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ReplayService, useValue: replayServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CongratsMessageComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
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

    it('should close the dialog and navigate to /home when closePopup is called', () => {
        component.closePopup(false);
        expect(dialogRefSpy.close).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
    });
});
