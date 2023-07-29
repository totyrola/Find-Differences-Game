import { EventEmitter, Injectable } from '@angular/core';
import { NB_MS_IN_SECOND, TICK } from '@app/constants/time-constants';
import { DelayService } from '@app/services/divers/delay.service';
import { SoundService } from '@app/services/game-play/sound.service';
import { Speed } from '@common/enums/game-play/speed';
import { ReplayAction } from '@common/interfaces/game-play/replay-action';
import { GameTimeService } from './game-time.service';

@Injectable({
    providedIn: 'root',
})
export class ReplayService {
    isReplayMode: boolean;
    isReplaying: boolean;
    replayEvent: EventEmitter<void>;

    private replayActions: ReplayAction[];
    private actionIndex: number;

    constructor(private delayService: DelayService, private soundService: SoundService, private gameTimeService: GameTimeService) {
        this.replayEvent = new EventEmitter<void>();
        this.reset();
    }

    reset(): void {
        this.stop();
        this.delayService.timeIsPaused = false;
        this.delayService.changeSpeed(Speed.NORMAL);
        this.gameTimeService.recordedTimes = [];
        this.replayActions = [];
        this.isReplaying = false;
        this.isReplayMode = false;
    }

    doAndStore(action: () => void) {
        this.store(action);
        action();
    }

    store(action: () => void) {
        if (!this.isReplaying) this.replayActions.push({ time: this.gameTimeService.replayTime, action });
    }

    pause(): void {
        this.delayService.pauseTime();
        this.soundService.pause();
    }

    resume(): void {
        this.delayService.resumeTime();
        this.soundService.resume();
    }

    restart(): void {
        this.stop();
        this.replay();
    }

    stop() {
        this.endOfReplay();
        this.soundService.pause();
        this.delayService.clearDelays();
    }

    endOfReplay() {
        this.isReplaying = false;
        this.delayService.clearCycles();
    }

    changeSpeed(speed: Speed) {
        this.delayService.changeSpeed(speed);
        this.soundService.speed = speed;
    }

    private async replay(): Promise<void> {
        this.delayService.timeIsPaused = false;
        this.gameTimeService.isReplayMode = true;
        this.gameTimeService.recordedTimeIndex = 0;
        this.replayEvent.emit();
        this.isReplayMode = true;
        this.isReplaying = true;
        this.actionIndex = 0;
        this.delayService.doCyclicly(TICK * NB_MS_IN_SECOND, this.tick.bind(this));
    }

    private tick() {
        this.gameTimeService.nextRecordedTime();
        let replayAction: ReplayAction;
        do {
            replayAction = this.replayActions[this.actionIndex];
            if (this.isSameTime(replayAction.time, this.gameTimeService.replayTime)) {
                this.actionIndex++;
                replayAction.action();
            }
        } while (this.actionIndex < this.replayActions.length && this.isSameTime(replayAction.time, this.gameTimeService.replayTime));
    }

    private isSameTime(time1: number, time2: number): boolean {
        return this.round(time1) === this.round(time2);
    }

    private round(n: number): number {
        const DECIMALS = 10;
        return Math.round(n * DECIMALS);
    }
}
