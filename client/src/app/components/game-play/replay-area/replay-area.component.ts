import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PERCENTAGE } from '@app/constants/time-constants';
import { GameTimeService } from '@app/services/game-play/game-time.service';
import { ReplayService } from '@app/services/game-play/replay.service';
import { Speed } from '@common/enums/game-play/speed';

@Component({
    selector: 'app-replay-area',
    templateUrl: './replay-area.component.html',
    styleUrls: ['./replay-area.component.scss'],
})
export class ReplayAreaComponent {
    paused: boolean;
    speed: Speed;

    constructor(private router: Router, private replayService: ReplayService, private gameTimeService: GameTimeService) {
        this.paused = false;
        this.speed = Speed.NORMAL;
    }

    get ended() {
        return !this.replayService.isReplaying;
    }

    get progress(): number {
        return Math.floor((this.gameTimeService.recordedTimeIndex / this.gameTimeService.recordedTimes.length) * PERCENTAGE);
    }

    get speeds() {
        return Speed;
    }

    exit(): void {
        this.replayService.stop();
        this.router.navigateByUrl('/home');
    }

    restart(): void {
        this.replayService.restart();
        this.paused = false;
    }

    pause(): void {
        if (!this.ended) {
            this.replayService.pause();
            this.paused = true;
        }
    }

    resume(): void {
        if (!this.ended) {
            this.replayService.resume();
            this.paused = false;
        }
    }

    selectSpeed(speed: Speed) {
        this.speed = speed;
        this.replayService.changeSpeed(speed);
    }
}
