import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GameListManagerService } from '@app/services/divers/game-list-manager.service';
import SpyObj = jasmine.SpyObj;

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let component: AppComponent;
    let gameListSpy: SpyObj<GameListManagerService>;

    beforeEach(async () => {
        gameListSpy = jasmine.createSpyObj('GameListManagerService', ['init']);
        await TestBed.configureTestingModule({
            imports: [AppRoutingModule, HttpClientTestingModule],
            declarations: [AppComponent],
            providers: [{ provide: GameListManagerService, useValue: gameListSpy }],
        }).compileComponents();
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    });

    it('should create the app', () => {
        expect(component).toBeTruthy();
    });
    it('should initialize game list manager service on init', () => {
        component.ngOnInit();
        expect(gameListSpy.init).toHaveBeenCalled();
    });
});
