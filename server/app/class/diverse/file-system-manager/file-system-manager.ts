import { DifferenceImageData, HEIGHT, WIDTH } from '@app/class/algorithms/difference-locator/difference-locator.constants';
import { Card } from '@common/interfaces/game-card/card';
import { CardBase64Files } from '@common/interfaces/game-card/card-base64-files';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { sync } from 'rimraf';

export default class FileSystemManager {
    static createDirectory(path: string, name: string): boolean {
        path += '/' + name;
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
            return true;
        }
        return false;
    }

    static removeDirectory(path: string) {
        sync(path);
    }

    static storeCards(id: string, imageData: DifferenceImageData): boolean {
        let path = './assets/cards';
        const rgba = { r: 255, g: 255, b: 0, a: 100 };
        if (!this.createDirectory(path, id)) return false;
        path += '/' + id;
        try {
            if (!this.createDirectory(path, 'differenceOverlays')) throw Error('failed creating the overlays directory');
            const flashColor = Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a);
            imageData.originalImage.write(path + '/original-image.bmp');
            imageData.modifiedImage.write(path + '/modified-image.bmp');
            const finalPath = path + '/differenceOverlays';
            for (let i = 0; i < imageData.differencePixelSets.length; i++) {
                const sets = imageData.differencePixelSets[i];
                const image1 = new Jimp(WIDTH, HEIGHT, '#00000000');
                const image2 = new Jimp(WIDTH, HEIGHT, '#00000000');
                for (const set of sets)
                    for (let x = set.start, y = 0; x <= set.end; x++) {
                        image1.setPixelColor(set.colors[y++], x, set.y);
                        image2.setPixelColor(flashColor, x, set.y);
                    }
                image1.write(finalPath + '/' + i + '.png');
                image2.write(finalPath + '/flash_' + i + '.png');
            }
        } catch (e) {
            this.removeDirectory(path);
            return false;
        }
        return true;
    }

    static getImages(card: Card): CardBase64Files {
        try {
            const readDifferenceImage = (path: string) => fs.readFileSync('./assets/cards/' + card.id + '/' + path, 'base64').toString();
            return {
                id: card.id,
                originalImage: readDifferenceImage('original-image.bmp'),
                modifiedImage: readDifferenceImage('modified-image.bmp'),
                differencesBase64Files: Array.from({ length: card.differenceNbr }, (_, i) => ({
                    differenceImage: readDifferenceImage('differenceOverlays/' + i + '.png'),
                    flashImage: readDifferenceImage('differenceOverlays/flash_' + i + '.png'),
                })),
            };
        } catch (e) {
            return undefined;
        }
    }
}
