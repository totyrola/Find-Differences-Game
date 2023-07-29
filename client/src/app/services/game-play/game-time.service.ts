import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/divers/socket-client.service';
import { FromServer } from '@common/socket-event-constants';

@Injectable({
    providedIn: 'root',
})
export class GameTimeService {
    isReplayMode: boolean;

    recordedTimes: number[];
    recordedTimeIndex: number;

    private displayedTime: number;
    private preciseTime: number;

    constructor(private socketService: SocketClientService) {
        this.socketService.on(FromServer.TIME, this.processTimeEvent.bind(this));
    }

    get time(): number {
        return this.displayedTime;
    }

    get replayTime(): number {
        return this.preciseTime;
    }

    set time(newTime: number) {
        this.displayedTime = Math.floor(newTime);
        this.preciseTime = newTime;
    }

    nextRecordedTime() {
        this.time = this.recordedTimes[this.recordedTimeIndex];
        this.recordedTimeIndex++;
    }

    private processTimeEvent(data: number): void {
        if (!this.isReplayMode) {
            this.time = data;
            this.recordedTimes.push(data);
        }
    }
}
