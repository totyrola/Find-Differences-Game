import { Injectable } from '@angular/core';
import { Speed } from '@common/enums/game-play/speed';

@Injectable({
    providedIn: 'root',
})
export class SoundService {
    private playSpeed: Speed;
    private successSound: HTMLAudioElement;
    private errorSound: HTMLAudioElement;

    constructor() {
        this.successSound = new Audio();
        this.successSound.volume = 0.2;
        this.successSound.src = './assets/success.mp3';
        this.errorSound = new Audio();
        this.errorSound.volume = 0.2;
        this.errorSound.src = './assets/error.wav';
        this.speed = Speed.NORMAL;
    }

    set speed(speed: Speed) {
        this.playSpeed = speed;
        this.successSound.playbackRate = speed;
        this.errorSound.playbackRate = speed;
    }

    playSuccess(): void {
        this.playSound(this.successSound);
    }

    playError(): void {
        this.playSound(this.errorSound);
    }

    pause() {
        this.successSound.pause();
        this.errorSound.pause();
    }

    resume() {
        if (this.isPlaying(this.successSound)) this.successSound.play();
        if (this.isPlaying(this.errorSound)) this.errorSound.play();
    }

    private isPlaying(sound: HTMLAudioElement): boolean {
        return !sound.ended && sound.currentTime !== 0;
    }

    private playSound(sound: HTMLAudioElement): void {
        sound.load();
        sound.playbackRate = this.playSpeed;
        sound.play();
    }
}
