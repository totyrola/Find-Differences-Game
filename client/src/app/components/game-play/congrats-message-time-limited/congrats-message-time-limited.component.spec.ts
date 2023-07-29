import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EndgameOutputDto } from '@common/interfaces/game-play/game-endgame.dto';

import { ChatService } from '@app/services/game-play/chat.service';
import { GameService } from '@app/services/game-play/game.service';
import { CongratsMessageTimeLimitedComponent } from './congrats-message-time-limited.component';
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-post-it', template: '' })
class PostItStubComponent {
    @Input() name: string;
}
describe('CongratsMessageTimeLimitedComponent', () => {
    let component: CongratsMessageTimeLimitedComponent;
    let fixture: ComponentFixture<CongratsMessageTimeLimitedComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<CongratsMessageTimeLimitedComponent>>;
    let mockRouter: jasmine.SpyObj<Router>;
    const mockData = {
        message: {} as EndgameOutputDto,
        replayIsAvailable: true,
    };

    beforeEach(async () => {
        const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

        await TestBed.configureTestingModule({
            declarations: [CongratsMessageTimeLimitedComponent, PostItStubComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
                GameService,
                ChatService,
            ],
        }).compileComponents();

        mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CongratsMessageTimeLimitedComponent>>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CongratsMessageTimeLimitedComponent);
        component = fixture.componentInstance;
        component.totalDifferences = 10;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog and navigate to home on closePopup()', () => {
        component.closePopup();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home');
    });
});
