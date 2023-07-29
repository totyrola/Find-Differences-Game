import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router, RouterModule, RouterState } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UserNameDialogComponent } from '@app/components/config-selection/user-name-dialog/user-name-dialog.component';
// eslint-disable-next-line max-len
import { TimedSelectionModalComponent } from '@app/components/config-selection/timed-selection-modal/timed-selection-modal.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { Subject } from 'rxjs';
import SpyObj = jasmine.SpyObj;

@Component({ selector: 'app-post-it', template: '' })
class PostItStubComponent {
    @Input() title: string;
    @Input() color: string;
}

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let socketSpy: SpyObj<SocketClientService>;
    let routerSpy: SpyObj<Router>;
    let routerStateSpy: SpyObj<RouterState>;
    let gameListSpy: SpyObj<GameListManagerService>;
    let fakeObservable: Subject<string | undefined>;
    let dialogRefSpy: SpyObj<MatDialogRef<UserNameDialogComponent>>;

    beforeEach(async () => {
        fakeObservable = new Subject<string | undefined>();
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        gameListSpy = jasmine.createSpyObj('GameListManagerService', ['init']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        socketSpy = jasmine.createSpyObj('SocketClientService', ['connect']);
        routerStateSpy = jasmine.createSpyObj('RouterState', {}, ['root']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl'], { routerState: routerStateSpy });
        await TestBed.configureTestingModule({
            imports: [RouterModule, RouterTestingModule, MatDialogModule],
            declarations: [MainPageComponent, PostItStubComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: SocketClientService, useValue: socketSpy },
                { provide: GameListManagerService, useValue: gameListSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        dialogSpy.open.and.returnValue(dialogRefSpy);
        dialogRefSpy.afterClosed.and.returnValue(fakeObservable.asObservable());
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should initialize gameListManagerService', () => {
        component.ngOnInit();
        expect(gameListSpy.init).toHaveBeenCalled();
    });
    it('should open a username dialog window', () => {
        component.requestUsername();
        expect(dialogSpy.open).toHaveBeenCalled();
        expect(dialogSpy.open.calls.mostRecent().args[0]).toEqual(UserNameDialogComponent);
    });
    it('should open ModeSelectionLimitedTimeModal dialog if username confirmed', () => {
        component.requestUsername();
        fakeObservable.next('fakeName');
        expect(dialogSpy.open.calls.mostRecent().args[0]).toEqual(TimedSelectionModalComponent);
    });
    it('should open ModeSelectionLimitedTimeModal dialog if username selection canceled', () => {
        component.requestUsername();
        fakeObservable.next(undefined);
        expect(dialogSpy.open.calls.mostRecent().args[0]).toEqual(UserNameDialogComponent);
    });
});
