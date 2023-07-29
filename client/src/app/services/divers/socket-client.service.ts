import { Injectable, OnDestroy } from '@angular/core';
import { Event } from '@common/socket-event-constants';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService implements OnDestroy {
    clientSocket: Socket = io(environment.socketUrl, { transports: ['websocket'], upgrade: false });

    ngOnDestroy() {
        this.disconnect();
    }

    isSocketAlive() {
        return this.clientSocket && !this.clientSocket.disconnected;
    }

    connect() {
        if (!this.isSocketAlive()) {
            this.clientSocket = io(environment.socketUrl, { transports: ['websocket'], upgrade: false });
        }
    }

    disconnect() {
        this.clientSocket = this.clientSocket.disconnect();
    }

    on<T>(event: Event<T>, action: (data: T) => void): void {
        this.clientSocket.on(event.name, action);
    }

    send<T>(event: string, data?: T): void {
        if (data) {
            this.clientSocket.emit(event, data);
        } else {
            this.clientSocket.emit(event);
        }
    }

    removeListener<T>(event: Event<T>) {
        this.clientSocket.removeAllListeners(event.name);
    }
}
