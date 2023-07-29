import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormatTimePipe } from '@app/classes/pipes/format-time.pipe';
import { SafeUrlPipe } from '@app/classes/pipes/safe-url-pipe';
import { ArrowGameSelectionComponent } from '@app/components/config-selection/arrow-game-selection/arrow-game-selection.component';
import { AwaitingPlayersModalComponent } from '@app/components/config-selection/awaiting-players-modal/awaiting-players-modal.component';
import { CarouselViewComponent } from '@app/components/config-selection/carousel-view/carousel-view.component';
import { GameConstantsComponent } from '@app/components/config-selection/game-constants/game-constants.component';
import { GameSelectComponent } from '@app/components/config-selection/game-select/game-select.component';
import { TopThreeComponent } from '@app/components/config-selection/top-three/top-three.component';
import { UserNameDialogComponent } from '@app/components/config-selection/user-name-dialog/user-name-dialog.component';
import { WarnPlayerModalComponent } from '@app/components/config-selection/warn-player-modal/warn-player-modal.component';
import { DrawingAreaComponent } from '@app/components/game-creation/drawing-area/drawing-area.component';
import { GameCreationDialogComponent } from '@app/components/game-creation/game-creation-dialog/game-creation-dialog.component';
import { ImageEditionZoneComponent } from '@app/components/game-creation/image-edition-zone/image-edition-zone.component';
import { ImagePickerComponent } from '@app/components/game-creation/image-picker/image-picker.component';
import { ToolBarComponent } from '@app/components/game-creation/tool-bar/tool-bar.component';
import { ChronometerContainerComponent } from '@app/components/game-play/chronometer-container/chronometer-container.component';
import { CongratsMessageCoopComponent } from '@app/components/game-play/congrats-message-coop/congrats-message-coop.component';
import { CongratsMessageComponent } from '@app/components/game-play/congrats-message/congrats-message.component';
import { DifferencesFoundComponent } from '@app/components/game-play/differences-found/differences-found.component';
import { DisplayHintsComponent } from '@app/components/game-play/feature/display-hints/display-hints.component';
import { DisplayScoreComponent } from '@app/components/game-play/feature/display-score/display-score.component';
import { PlayAreaComponent } from '@app/components/game-play/play-area/play-area.component';
import { PageTitleComponent } from '@app/components/general/page-title/page-title.component';
import { PaperButtonComponent } from '@app/components/general/paper-button/paper-button.component';
import { PostItComponent } from '@app/components/general/post-it/post-it.component';
import { TopBarComponent } from '@app/components/general/top-bar/top-bar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { ClassicSelectionPageComponent } from '@app/pages/classic-selection-page/classic-selection-page.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { HistoryComponent } from './components/config-selection/history/history.component';
import { TimedSelectionModalComponent } from './components/config-selection/timed-selection-modal/timed-selection-modal.component';
import { WarningDialogComponent } from './components/config-selection/warning-dialog/warning-dialog.component';
import { ChatboxComponent } from './components/game-play/chatbox/chatbox.component';
import { CongratsMessageTimeLimitedComponent } from './components/game-play/congrats-message-time-limited/congrats-message-time-limited.component';
import { ReplayAreaComponent } from './components/game-play/replay-area/replay-area.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        TopBarComponent,
        PageTitleComponent,
        PostItComponent,
        ConfigPageComponent,
        ClassicSelectionPageComponent,
        ArrowGameSelectionComponent,
        UserNameDialogComponent,
        TopThreeComponent,
        GameCreationPageComponent,
        FormatTimePipe,
        ReplayAreaComponent,
        ImageEditionZoneComponent,
        SafeUrlPipe,
        GameSelectComponent,
        ImagePickerComponent,
        DisplayHintsComponent,
        DisplayScoreComponent,
        PaperButtonComponent,
        PaperButtonComponent,
        GameCreationDialogComponent,
        GameConstantsComponent,
        CongratsMessageComponent,
        DifferencesFoundComponent,
        ChronometerContainerComponent,
        CarouselViewComponent,
        ChatboxComponent,
        AwaitingPlayersModalComponent,
        ToolBarComponent,
        DrawingAreaComponent,
        WarnPlayerModalComponent,
        CongratsMessageCoopComponent,
        TimedSelectionModalComponent,
        HistoryComponent,
        WarningDialogComponent,
        CongratsMessageTimeLimitedComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatGridListModule,
        MatDialogModule,
        CommonModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
