import { TEST } from '@app/class-mocks.spec';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import OutputFilterGateway from './output-filters.gateway';
import RecordGateway from './record.gateway';

jest.mock('./output-filters.gateway.ts');
namespace SocketSpy {
    export const to = jest.fn().mockImplementation(() => ({
        emit: SocketSpy.emit,
    }));
    export const emit = jest.fn();
}

namespace LoggerSpy {
    export const error = jest.fn();
    export const log = jest.fn();
}

describe('GameGateway', () => {
    let client: Socket;
    let gateway: RecordGateway;

    beforeAll(() => {
        Logger.error = LoggerSpy.error;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecordGateway,
                {
                    provide: MongoDBService,
                    useValue: TEST.MONGODB_SERVICE.MOCK,
                },
            ],
        }).compile();

        gateway = module.get<RecordGateway>(RecordGateway);
        client = {
            id: 'id',
            to: SocketSpy.to,
            emit: SocketSpy.emit,
        } as unknown as Socket;
    });

    afterEach(() => {
        TEST.reset();
        jest.clearAllMocks();
    });

    describe('sendAllRecords', () => {
        it('should getAllRecords', async () => {
            await gateway.sendAllRecords(client);
            expect(TEST.MONGODB_SERVICE.MOCK.getAllRecords).toHaveBeenCalled();
            expect(OutputFilterGateway.sendAllRecords.toClient).toHaveBeenCalled();
            expect(LoggerSpy.error).not.toHaveBeenCalled();
        });

        it('should not getAllRecords', async () => {
            TEST.MONGODB_SERVICE.MOCK.getAllRecords.mockRejectedValue(undefined);
            await gateway.sendAllRecords(client);
            expect(TEST.MONGODB_SERVICE.MOCK.getAllRecords).toHaveBeenCalled();
            expect(OutputFilterGateway.sendAllRecords.toClient).not.toHaveBeenCalled();
            expect(LoggerSpy.error).toHaveBeenCalled();
        });
    });

    describe('deleteAllRecords', () => {
        it('should removeAllRecords', async () => {
            await gateway.deleteAllRecords();
            expect(TEST.MONGODB_SERVICE.MOCK.removeAllRecords).toHaveBeenCalled();
            expect(LoggerSpy.error).not.toHaveBeenCalled();
        });

        it('should not removeAllRecords', async () => {
            TEST.MONGODB_SERVICE.MOCK.removeAllRecords.mockRejectedValue(undefined);
            await gateway.deleteAllRecords();
            expect(TEST.MONGODB_SERVICE.MOCK.removeAllRecords).toHaveBeenCalled();
            expect(LoggerSpy.error).toHaveBeenCalled();
        });
    });
});
