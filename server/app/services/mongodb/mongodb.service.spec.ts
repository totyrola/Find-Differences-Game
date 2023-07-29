/* eslint-disable max-lines */
import DifferenceLocator from '@app/class/algorithms/difference-locator/difference-locator';
import { DifferenceImageData } from '@app/class/algorithms/difference-locator/difference-locator.constants';
import FileSystemManager from '@app/class/diverse/file-system-manager/file-system-manager';
import { CardDocument } from '@app/model/database-schema/card.schema';
import { RecordDocument } from '@app/model/database-schema/history.schema';
import { Difficulty } from '@common/enums/game-play/difficulty';
import { Card } from '@common/interfaces/game-card/card';
import { CardPreview } from '@common/interfaces/game-card/card-preview';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import MongoDBService from './mongodb.service';

namespace fsSpy {
    export const readFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation();
}

namespace CardModelSpy {
    export const distinct = jest.fn();
    export const create = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export const find = jest.fn((): any => ({
        distinct,
    }));
    export const updateOne = jest.fn();
    export const deleteMany = jest.fn();
    export const findById = jest.fn();
    export const findByIdAndRemove = jest.fn();
    export const countDocuments = jest.fn();
}

namespace RecordModelSpy {
    export const create = jest.fn();
    export const find = jest.fn();
    export const deleteMany = jest.fn();
    export const remove = jest.fn();
}

namespace FileSystemManagerSpy {
    export const createDirectory = jest.fn();
    export const removeDirectory = jest.fn();
    export const storeCards = jest.fn();
}

namespace MockError {
    export const error = new Error('ErrorMock');
    export const message = error.name + ': ' + error.message;
}

namespace MongoDBServiceSpy {
    export const removeCardById = jest.spyOn(MongoDBService.prototype, 'removeCardById');
    export const populateDB = jest.spyOn(MongoDBService.prototype, 'populateDB');
}

namespace DifferenceLocatorSpy {
    export const findDifferences = jest.spyOn(DifferenceLocator.prototype, 'findDifferences').mockImplementation();
    export const getCreationData = jest.spyOn(DifferenceLocator.prototype, 'getCreationData').mockImplementation(() => ({
        finalDifferences: undefined,
        differenceNbr: undefined,
        difficulty: undefined,
        imageData: undefined,
    }));
}

namespace LoggerSpy {
    export const error = jest.fn();
    export const realError = Logger.error;
}

describe('MongodbService', () => {
    let service: MongoDBService;
    const card: Card = {
        name: 'Game 1',
        id: 'id1',
        classicSoloBestTimes: {
            firstPlace: {
                name: 'aHeroForFun',
                time: {
                    seconds: 10,
                    minutes: 1,
                },
            },
            secondPlace: {
                name: 'markiplier',
                time: {
                    seconds: 20,
                    minutes: 2,
                },
            },
            thirdPlace: {
                name: 'jacksepticeye',
                time: {
                    seconds: 30,
                    minutes: 3,
                },
            },
        },
    } as Card;
    const cardDocument = card as CardDocument;

    beforeAll(async () => {
        FileSystemManager.createDirectory = FileSystemManagerSpy.createDirectory;
        FileSystemManager.removeDirectory = FileSystemManagerSpy.removeDirectory;
        FileSystemManager.storeCards = FileSystemManagerSpy.storeCards;
        Logger.error = LoggerSpy.error;

        const tmpMock = jest.spyOn(MongoDBService.prototype, 'start').mockImplementation(jest.fn());
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MongoDBService,
                {
                    provide: getModelToken(CardDocument.name),
                    useValue: {
                        create: CardModelSpy.create,
                        find: CardModelSpy.find,
                        updateOne: CardModelSpy.updateOne,
                        deleteMany: CardModelSpy.deleteMany,
                        findById: CardModelSpy.findById,
                        findByIdAndRemove: CardModelSpy.findByIdAndRemove,
                        countDocuments: CardModelSpy.countDocuments,
                    },
                },
                {
                    provide: getModelToken(RecordDocument.name),
                    useValue: {
                        find: RecordModelSpy.find,
                        create: RecordModelSpy.create,
                        deleteMany: RecordModelSpy.deleteMany,
                        remove: RecordModelSpy.remove,
                    },
                },
            ],
        }).compile();
        service = module.get<MongoDBService>(MongoDBService);
        tmpMock.mockRestore();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('start', () => {
        const readDirMock = jest.spyOn(fs, 'readdirSync');

        afterAll(() => {
            MongoDBServiceSpy.populateDB.mockRestore();
        });

        it('should find cards and not reset the directory', async () => {
            MongoDBServiceSpy.populateDB.mockImplementation();
            readDirMock.mockReturnValueOnce(['card0', 'card1', 'card2'] as unknown as fs.Dirent[]);
            CardModelSpy.distinct.mockResolvedValue(['card1']);
            await service.start();
            expect(FileSystemManagerSpy.removeDirectory).toBeCalledTimes(2);
            expect(FileSystemManagerSpy.createDirectory).toBeCalledTimes(0);
            expect(MongoDBServiceSpy.populateDB).toBeCalledTimes(0);
        });

        it('should not find cards and reset the directory', async () => {
            MongoDBServiceSpy.populateDB.mockImplementation();
            readDirMock.mockReturnValueOnce(['card0', 'card2'] as unknown as fs.Dirent[]);
            CardModelSpy.distinct.mockResolvedValue(['card1']);
            await service.start();
            expect(FileSystemManagerSpy.removeDirectory).toBeCalledTimes(3);
            expect(FileSystemManagerSpy.createDirectory).toBeCalledTimes(1);
            expect(MongoDBServiceSpy.populateDB).toBeCalledTimes(1);
        });
    });

    describe('populateDB', () => {
        const spyOnAddCard = jest.spyOn(MongoDBService.prototype, 'addCard').mockImplementation();

        afterAll(() => {
            spyOnAddCard.mockRestore();
        });

        it('should generate five cards', async () => {
            const callNbr = 5;
            DifferenceLocatorSpy.findDifferences.mockResolvedValue(true);
            await service.populateDB();
            expect(spyOnAddCard).toBeCalledTimes(callNbr);
            expect(DifferenceLocatorSpy.findDifferences).toBeCalledTimes(callNbr);
            expect(DifferenceLocatorSpy.getCreationData).toBeCalledTimes(callNbr);
        });

        it('should generate an error', async () => {
            const callNbr = 5;
            DifferenceLocatorSpy.findDifferences.mockResolvedValue(false);
            await service.populateDB();
            expect(spyOnAddCard).toBeCalledTimes(0);
            expect(DifferenceLocatorSpy.findDifferences).toBeCalledTimes(callNbr);
            expect(DifferenceLocatorSpy.getCreationData).toBeCalledTimes(0);
            expect(LoggerSpy.error).toBeCalledTimes(callNbr);
        });
    });

    describe('getAllCardIds', () => {
        it('should return the card ids', async () => {
            CardModelSpy.find.mockResolvedValueOnce([{ _id: '1' }, { _id: '2' }, { _id: '3' }]);
            await expect(service.getAllCardIds()).resolves.toEqual(['1', '2', '3']);
        });

        it('should throw an error and not return the card ids', async () => {
            CardModelSpy.find.mockRejectedValueOnce(MockError.error);
            await expect(service.getAllCardIds()).rejects.toEqual('Failed to get all card Ids : ' + MockError.message);
        });
    });

    describe('getCardPreviewById', () => {
        it('should resolve the promise', async () => {
            CardModelSpy.find.mockResolvedValueOnce(card);
            await expect(service.getCardPreviewById(undefined)).resolves.not.toBeUndefined();
        });

        it('should reject the promise', async () => {
            CardModelSpy.find.mockRejectedValueOnce(MockError.error);
            await expect(service.getCardPreviewById(undefined)).rejects.toEqual(`Failed to get all frontend cards : ${MockError.message}`);
        });
    });

    describe('getAllCardPreviews', () => {
        it('should return a list of cards', async () => {
            fsSpy.readFileSync.mockReturnValueOnce('card');
            CardModelSpy.find.mockResolvedValueOnce([
                {
                    id: '3',
                    originalImage: undefined,
                } as unknown as CardPreview,
            ]);
            await expect(service.getAllCardPreviews()).resolves.toEqual([
                {
                    id: '3',
                    originalImage: 'card',
                },
            ]);
        });

        it('should reject the promise', async () => {
            CardModelSpy.find.mockRejectedValueOnce(MockError.error);
            await expect(service.getAllCardPreviews()).rejects.toEqual(`Failed to get all frontend cards : ${MockError.message}`);
        });
    });

    describe('getCardById', () => {
        it('should return a card', async () => {
            CardModelSpy.findById.mockResolvedValueOnce(cardDocument);
            await expect(service.getCardById(cardDocument.id)).resolves.toEqual(cardDocument);
        });

        it('should return undefined', async () => {
            CardModelSpy.findById.mockRejectedValueOnce(MockError.error);
            await expect(service.getCardById(cardDocument.id)).rejects.toEqual(
                `Failed to get a card with the id <${cardDocument.id}> : ${MockError.message}`,
            );
        });
    });

    describe('addCard', () => {
        it('should return true if the card was created', async () => {
            CardModelSpy.create.mockResolvedValueOnce(cardDocument);
            FileSystemManagerSpy.storeCards.mockReturnValueOnce(true);
            await expect(service.addCard({ difficulty: Difficulty.Easy } as Card, {} as DifferenceImageData)).resolves.toEqual(card.id);
        });

        it('should return false if there was an incorrect amount of differences', async () => {
            await expect(service.addCard({ difficulty: Difficulty.None } as Card, {} as DifferenceImageData)).resolves.toBeFalsy();
        });

        it('should return false if the FileSystemManager failed to store the cards on the server', async () => {
            CardModelSpy.create.mockResolvedValueOnce(cardDocument);
            FileSystemManagerSpy.storeCards.mockReturnValueOnce(false);
            await expect(service.addCard({ difficulty: Difficulty.Easy } as Card, {} as DifferenceImageData)).resolves.toBeFalsy();
            expect(MongoDBServiceSpy.removeCardById).toHaveBeenCalledWith(cardDocument.id);
        });

        it('should reject the promise', async () => {
            CardModelSpy.create.mockRejectedValueOnce(MockError.error);
            await expect(service.addCard({ difficulty: Difficulty.Easy } as Card, {} as DifferenceImageData)).rejects.toEqual(
                `Failed to create a card : ${MockError.message}`,
            );
        });
    });

    describe('removeCardById', () => {
        it('should resolve the promise', async () => {
            CardModelSpy.findByIdAndRemove.mockResolvedValueOnce(undefined);
            await expect(service.removeCardById(cardDocument.id)).resolves.toEqual(undefined);
            expect(FileSystemManagerSpy.removeDirectory).toBeCalledWith('./assets/cards/' + cardDocument.id);
        });

        it('should reject the promise', async () => {
            CardModelSpy.findByIdAndRemove.mockRejectedValueOnce(MockError.error);
            await expect(service.removeCardById(cardDocument.id)).rejects.toEqual(`Failed to delete card: ${MockError.message}`);
            expect(FileSystemManagerSpy.removeDirectory).not.toBeCalled();
        });
    });

    describe('removeAllCards', () => {
        it('should resolve the promise', async () => {
            CardModelSpy.deleteMany.mockResolvedValueOnce(undefined);
            await expect(service.removeAllCards()).resolves.toEqual(undefined);
            expect(FileSystemManagerSpy.removeDirectory).toBeCalledWith('./assets/cards');
            expect(FileSystemManagerSpy.createDirectory).toBeCalledWith('./assets', 'cards');
        });

        it('should reject the promise', async () => {
            CardModelSpy.deleteMany.mockRejectedValueOnce(MockError.error);
            await expect(service.removeAllCards()).rejects.toEqual(`Failed to delete cards : ${MockError.message}`);
            expect(FileSystemManagerSpy.removeDirectory).not.toBeCalled();
            expect(FileSystemManagerSpy.createDirectory).not.toBeCalled();
        });
    });

    describe('removeRecordById', () => {
        it('should resolve the promise', async () => {
            RecordModelSpy.remove.mockResolvedValueOnce(undefined);
            await expect(service.removeRecordById(undefined)).resolves.toEqual(undefined);
            expect(RecordModelSpy.remove).toHaveBeenCalled();
        });

        it('should reject the promise', async () => {
            RecordModelSpy.remove.mockRejectedValueOnce(MockError.error);
            await expect(service.removeRecordById(undefined)).rejects.toEqual(`Failed to delete records : ${MockError.message}`);
        });
    });

    describe('removeAllRecords', () => {
        it('should resolve the promise', async () => {
            RecordModelSpy.remove.mockResolvedValueOnce(undefined);
            await expect(service.removeAllRecords()).resolves.toEqual(undefined);
        });

        it('should reject the promise', async () => {
            RecordModelSpy.remove.mockRejectedValueOnce(MockError.error);
            await expect(service.removeAllRecords()).rejects.toEqual(`Failed to delete records : ${MockError.message}`);
        });
    });

    describe('modifyCard', () => {
        it('should resolve the promise', async () => {
            CardModelSpy.updateOne.mockResolvedValueOnce(undefined);
            await expect(service.modifyCard(cardDocument.id, {} as Card)).resolves.toEqual(undefined);
        });

        it('should reject the promise', async () => {
            CardModelSpy.updateOne.mockRejectedValueOnce(MockError.error);
            await expect(service.modifyCard(cardDocument.id, {} as Card)).rejects.toEqual(`Failed to update document : ${MockError.message}`);
        });
    });

    describe('addPlayerRecord', () => {
        it('should resolve the promise', async () => {
            RecordModelSpy.create.mockResolvedValueOnce(undefined);
            await expect(service.addPlayerRecord(undefined)).resolves.toEqual(undefined);
        });

        it('should reject the promise', async () => {
            RecordModelSpy.create.mockRejectedValueOnce(MockError.error);
            await expect(service.addPlayerRecord(undefined)).rejects.toEqual(`Failed to create a record : ${MockError.message}`);
        });
    });

    describe('getAllRecords', () => {
        it('should resolve the promise', async () => {
            const sort = jest.fn().mockResolvedValue(undefined);
            RecordModelSpy.find.mockImplementation(() => ({
                sort,
            }));
            await expect(service.getAllRecords()).resolves.toEqual(undefined);
            expect(sort).toHaveBeenCalled();
        });

        it('should reject the promise', async () => {
            const sort = jest.fn().mockRejectedValue(MockError.error);
            RecordModelSpy.find.mockImplementation(() => ({
                sort,
            }));
            await expect(service.getAllRecords()).rejects.toEqual('Failed to find all records : ' + MockError.message);
        });
    });

    describe('resetAllBestTimes', () => {
        let allCardIdsSpy: jest.SpyInstance;
        let modifySpy: jest.SpyInstance;

        beforeAll(() => {
            allCardIdsSpy = jest.spyOn(service, 'getAllCardIds');
            modifySpy = jest.spyOn(service, 'modifyCard');
        });

        afterAll(() => {
            allCardIdsSpy.mockRestore();
            modifySpy.mockRestore();
        });

        it('should reset the best time', async () => {
            allCardIdsSpy.mockResolvedValue(['1', '2', '3']);
            modifySpy.mockResolvedValue(undefined);
            await expect(service.resetAllBestTimes()).resolves.toHaveLength(3);
            expect(modifySpy).toHaveBeenCalledTimes(3);
        });

        it('should throw an error', async () => {
            allCardIdsSpy.mockRejectedValue(MockError.error);
            await expect(service.resetAllBestTimes()).rejects.toEqual('Failed to find all records : ' + MockError.message);
        });
    });

    describe('resetBestTimesByCardId', () => {
        const cardId = 'cardId';
        let modifySpy: jest.SpyInstance;

        beforeAll(() => {
            modifySpy = jest.spyOn(service, 'modifyCard');
        });

        afterAll(() => {
            modifySpy.mockRestore();
        });

        it('should reset the best time', async () => {
            modifySpy.mockResolvedValue(undefined);
            await expect(service.resetBestTimesByCardId(cardId)).resolves.not.toBeUndefined();
        });

        it('should throw an error', async () => {
            modifySpy.mockRejectedValue(MockError.error);
            await expect(service.resetBestTimesByCardId(cardId)).rejects.toEqual('Failed to find all records : ' + MockError.message);
        });
    });
});
