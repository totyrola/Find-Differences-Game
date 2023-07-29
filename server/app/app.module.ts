import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import CardGateway from './gateways/card.gateway';
import GameGateway from './gateways/game.gateway';
import OutputFilterGateway from './gateways/output-filters.gateway';
import RecordGateway from './gateways/record.gateway';
import { CardDocument, cardSchema } from './model/database-schema/card.schema';
import { RecordDocument, recordSchema } from './model/database-schema/history.schema';
import MongoDBService from './services/mongodb/mongodb.service';
// test
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([{ name: CardDocument.name, schema: cardSchema }]),
        MongooseModule.forFeature([{ name: RecordDocument.name, schema: recordSchema }]),
    ],
    controllers: [],
    providers: [MongoDBService, GameGateway, CardGateway, RecordGateway, OutputFilterGateway],
})
export class AppModule {}
