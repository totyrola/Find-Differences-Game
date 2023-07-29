import { TEST } from '@app/class-mocks.spec';
import Classic1v1 from '@app/class/game-logic/classic1v1/classic1v1';
import { CardCreationFilter } from '@app/model/gateway-dto/creation/card-creation.dto';
import { CardValidationFilter } from '@app/model/gateway-dto/creation/card-validation.dto';
import GameAuthorityService from '@app/services/game-authority/game-authority.service';
import MongoDBService from '@app/services/mongodb/mongodb.service';
import { PaddingRadius } from '@common/enums/game-creation/padding-radius';
import { Difficulty } from '@common/enums/game-play/difficulty';
import { CardPreview } from '@common/interfaces/game-card/card-preview';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import CardGateway from './card.gateway';
import OutputFilterGateway from './output-filters.gateway';

jest.mock('@app/class/algorithms/difference-locator/difference-locator', () => ({
    default: jest.fn().mockImplementation(() => TEST.DIFFERENCE_LOCATOR.MOCK),
}));
jest.mock('./output-filters.gateway.ts');
jest.mock('@app/class/game-logic/classic1v1/classic1v1', () => ({
    default: jest.fn().mockImplementation(() => TEST.CLASSIC_1V1.MOCK),
}));

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
    let mongoDBService: MongoDBService;
    let mockClassic1v1Game: Classic1v1;
    let client: Socket;
    let mockCard: CardPreview;
    let gateway: CardGateway;

    beforeAll(() => {
        Logger.error = LoggerSpy.error;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CardGateway,
                {
                    provide: MongoDBService,
                    useValue: TEST.MONGODB_SERVICE.MOCK,
                },
            ],
        }).compile();

        gateway = module.get<CardGateway>(CardGateway);
        mongoDBService = module.get<MongoDBService>(MongoDBService);
        client = {
            id: 'id',
            to: SocketSpy.to,
            emit: SocketSpy.emit,
        } as unknown as Socket;
        mockClassic1v1Game = new Classic1v1(mongoDBService);
        mockCard = {
            name: 'Mock Card 1',
            id: 'id1',
        } as unknown as CardPreview;
    });

    afterEach(() => {
        TEST.reset();
        jest.clearAllMocks();
    });

    describe('resetBestTimesByCardId', () => {
        it('should call resetBestTimesByCardId', () => {
            TEST.MONGODB_SERVICE.MOCK.resetBestTimesByCardId.mockResolvedValue(mockCard);
            gateway.resetBestTimesByCardId(client, mockCard.id);
            expect(TEST.MONGODB_SERVICE.MOCK.resetBestTimesByCardId).toHaveBeenCalledWith(mockCard.id);
        });
    });

    describe('resetAllBestTimes', () => {
        it('should call resetAllBestTimes', () => {
            TEST.MONGODB_SERVICE.MOCK.resetAllBestTimes.mockResolvedValue([mockCard]);
            gateway.resetAllBestTimes();
            expect(TEST.MONGODB_SERVICE.MOCK.resetAllBestTimes).toHaveBeenCalled();
        });
    });

    describe('sendAllCards', () => {
        it('should send a message containing all frontend cards', async () => {
            await gateway.sendAllCards(client);
            expect(TEST.MONGODB_SERVICE.MOCK.getAllCardPreviews).toBeCalled();
            expect(OutputFilterGateway.sendCardPreviews.toClient).toHaveBeenCalled();
        });
    });
    describe('deleteAllCards', () => {
        beforeEach(() => {
            GameAuthorityService.getPendingGames.addGame(mockClassic1v1Game);
        });

        it('should delete all cards and inform all clients of card list change', async () => {
            await gateway.deleteAllCards(client);
            expect(TEST.MONGODB_SERVICE.MOCK.removeAllCards).toBeCalled();
            expect(OutputFilterGateway.sendDeleteAllCardsOutcome.toClient).toHaveBeenCalledWith(client, true);
            expect(OutputFilterGateway.sendCardPreviews.toServer).toHaveBeenCalled();
            expect(TEST.CLASSIC_1V1.MOCK.endGame).toHaveBeenCalled();
        });

        it('should send invalid response if deletion failed', async () => {
            TEST.MONGODB_SERVICE.MOCK.removeAllCards.mockRejectedValue(undefined);
            await gateway.deleteAllCards(client);
            expect(TEST.MONGODB_SERVICE.MOCK.removeAllCards).toBeCalled();
            expect(OutputFilterGateway.sendCardPreviews.toServer).not.toHaveBeenCalled();
            expect(TEST.CLASSIC_1V1.MOCK.endGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendDeleteAllCardsOutcome.toClient).toHaveBeenCalledWith(client, false);
            expect(LoggerSpy.error).toBeCalled();
        });
    });

    describe('deleteCard', () => {
        beforeEach(() => {
            GameAuthorityService.getPendingGames.addGame(mockClassic1v1Game);
            TEST.CLASSIC_1V1.MOCK.getCardId = mockCard.id;
        });

        it('should delete the card and inform all clients of card list change', async () => {
            await gateway.deleteCard(client, mockCard.id);
            expect(TEST.MONGODB_SERVICE.MOCK.removeCardById).toBeCalledWith(mockCard.id);
            expect(TEST.CLASSIC_1V1.MOCK.endGame).toHaveBeenCalled();
            expect(OutputFilterGateway.sendDeleteAllCardsOutcome.toClient).toHaveBeenCalledWith(client, true);
            expect(OutputFilterGateway.sendCardPreviews.toServer).toHaveBeenCalled();
        });

        it('should send invalid response if deletion failed', async () => {
            TEST.MONGODB_SERVICE.MOCK.removeCardById.mockRejectedValue(undefined);
            await gateway.deleteCard(client, mockCard.id);
            expect(TEST.MONGODB_SERVICE.MOCK.removeCardById).toBeCalledWith(mockCard.id);
            expect(TEST.CLASSIC_1V1.MOCK.endGame).not.toHaveBeenCalled();
            expect(OutputFilterGateway.sendDeleteAllCardsOutcome.toClient).toHaveBeenCalledWith(client, false);
            expect(OutputFilterGateway.sendCardPreviews.toServer).not.toHaveBeenCalled();
            expect(LoggerSpy.error).toBeCalled();
        });
    });

    describe('validateCard', () => {
        const input = {
            originalImage: '',
            modifiedImage: '',
            range: PaddingRadius.THREE,
        } as CardValidationFilter;

        it('should send invalid response', async () => {
            TEST.DIFFERENCE_LOCATOR.MOCK.findDifferences.mockResolvedValue(false);
            await gateway.validateCard(client, input);
            expect(OutputFilterGateway.sendCardValidationResponse.toClient).toBeCalledTimes(1);
            expect(TEST.DIFFERENCE_LOCATOR.MOCK.getValidationData).not.toBeCalled();
        });

        it('should validate the card and set it if valid', async () => {
            TEST.DIFFERENCE_LOCATOR.MOCK.findDifferences.mockResolvedValue(true);
            await gateway.validateCard(client, input);
            expect(OutputFilterGateway.sendCardValidationResponse.toClient).toBeCalledTimes(1);
            expect(TEST.DIFFERENCE_LOCATOR.MOCK.getValidationData).toBeCalled();
        });
    });

    describe('createCard', () => {
        const creationData = {
            finalDifferences: [],
            differenceNbr: undefined,
            difficulty: undefined,
            imageData: undefined,
        };
        const input: CardCreationFilter = {
            originalImage: 'originalImage',
            modifiedImage: 'modifiedImage',
            range: PaddingRadius.THREE,
            name: 'name',
        };
        const cardId = 'cardId';
        const frontendCard: CardPreview = {} as CardPreview;

        beforeEach(() => {
            TEST.DIFFERENCE_LOCATOR.MOCK.findDifferences.mockResolvedValue(true);
            TEST.DIFFERENCE_LOCATOR.MOCK.getDifficulty.mockReturnValue(Difficulty.Easy);
            TEST.DIFFERENCE_LOCATOR.MOCK.getCreationData.mockReturnValue(creationData);
            TEST.MONGODB_SERVICE.MOCK.addCard.mockResolvedValue(cardId);
            TEST.MONGODB_SERVICE.MOCK.getCardPreviewById.mockResolvedValue(frontendCard);
        });

        it('should send invalid response because generating the differences failed', async () => {
            TEST.DIFFERENCE_LOCATOR.MOCK.findDifferences.mockResolvedValue(false);
            await gateway.createCard(client, input);
            expect(OutputFilterGateway.sendCardCreationResponse.toClient).toHaveBeenCalledWith(client, { valid: false });
            expect(TEST.DIFFERENCE_LOCATOR.MOCK.getCreationData).not.toHaveBeenCalled();
        });

        it('should send invalid response because of an incorrect difference nbr', async () => {
            TEST.DIFFERENCE_LOCATOR.MOCK.getDifficulty.mockReturnValue(Difficulty.None);
            await gateway.createCard(client, input);
            expect(OutputFilterGateway.sendCardCreationResponse.toClient).toHaveBeenCalledWith(client, { valid: false });
            expect(TEST.DIFFERENCE_LOCATOR.MOCK.getCreationData).not.toHaveBeenCalled();
        });

        it('should generate the wanted data', async () => {
            await gateway.createCard(client, input);
            expect(TEST.DIFFERENCE_LOCATOR.MOCK.getCreationData).toHaveBeenCalled();
        });

        it('should send an invalid response if writing to the database failed', async () => {
            TEST.MONGODB_SERVICE.MOCK.addCard.mockRejectedValue(undefined);
            await gateway.createCard(client, input);
            expect(OutputFilterGateway.sendCardCreationResponse.toClient).toHaveBeenCalledWith(client, { valid: false });
            expect(LoggerSpy.error).toBeCalled();
        });
    });
});
