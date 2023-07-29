import { TestBed } from '@angular/core/testing';
import { Event } from '@common/socket-event-constants';
import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
    let service: SocketClientService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should call socket.on with an event', () => {
        const event = new Event<string>('howdy');
        const executeAction = () => {
            return;
        };
        service.connect();
        const spy = spyOn(service.clientSocket, 'on');
        service.on(event, executeAction);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event.name, executeAction);
    });
    it('should call emit with data when using send', () => {
        const event = 'howdy';
        const data = 42;
        service.connect();
        const spy = spyOn(service.clientSocket, 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, data);
    });

    it('should call emit without data when using send if data is undefined', () => {
        const event = 'howdy';
        const data = undefined;
        service.connect();
        const spy = spyOn(service.clientSocket, 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event);
    });
    it('should disconnect on destroy', () => {
        spyOn(service, 'disconnect');
        service.ngOnDestroy();
        expect(service.disconnect).toHaveBeenCalled();
    });
    it('should remove event listener ', () => {
        spyOn(service.clientSocket, 'removeListener');
        const fakeEvent = new Event<string>('fakeEvent');
        service.on(fakeEvent, () => {
            return true;
        });
        expect(service.clientSocket.hasListeners(fakeEvent.name)).toBeTruthy();
        service.removeListener(fakeEvent);
        expect(service.clientSocket.hasListeners(fakeEvent.name)).toBeFalsy();
    });
});
