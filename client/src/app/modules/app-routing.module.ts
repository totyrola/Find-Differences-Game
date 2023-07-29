import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassicSelectionPageComponent } from '@app/pages/classic-selection-page/classic-selection-page.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'classic', component: ClassicSelectionPageComponent },
    { path: 'config', component: ConfigPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'creation', component: GameCreationPageComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
