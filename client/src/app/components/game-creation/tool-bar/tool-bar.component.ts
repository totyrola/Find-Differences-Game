import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { TOOL_DEFAULT_SIZE, TOOL_MAX_SIZE, TOOL_MIN_SIZE } from '@app/constants/drawing-tools-constants';
import { Eraser } from '@app/classes/game-creation/eraser';
import { ForegroundDataService } from '@app/services/game-creation/foreground/foreground-data.service';
import { Pencil } from '@app/classes/game-creation/pencil';
import { Rectangle } from '@app/classes/game-creation/rectangle';
import { SelectedToolService } from '@app/services/game-creation/foreground/selected-tool.service';
import { ImageIndex } from '@common/enums/game-creation/image-index';
import { DrawService } from '@app/services/game-creation/foreground/draw.service';
import { AbstractTool } from '@app/classes/game-creation/abstract-tool';

@Component({
    selector: 'app-tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss'],
})
export class ToolBarComponent implements OnInit {
    @ViewChild('sizeInput') sizeInput: ElementRef;

    toolSize: number;
    pencil = new Pencil(this.drawService);
    rectangle = new Rectangle(this.drawService);
    eraser = new Eraser(this.drawService);

    constructor(
        private selectedToolService: SelectedToolService,
        private drawService: DrawService,
        private foregroundDataService: ForegroundDataService,
    ) {}

    get selectedTool(): AbstractTool {
        return this.selectedToolService.selectedTool;
    }

    get undoIsPossible(): boolean {
        return this.foregroundDataService.undoIsPossible;
    }

    get redoIsPossible(): boolean {
        return this.foregroundDataService.redoIsPossible;
    }

    get bothImagesIndex() {
        return ImageIndex.Both;
    }

    get minSize() {
        return TOOL_MIN_SIZE;
    }

    get maxSize() {
        return TOOL_MAX_SIZE;
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(e: KeyboardEvent): void {
        if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
        }
    }

    ngOnInit() {
        this.selectPencil();
        this.toolSize = TOOL_DEFAULT_SIZE;
        this.setLineSize();
        this.setColor('#000');
    }

    setLineSize(): void {
        this.validateSizeInput();
        AbstractTool.size = this.toolSize;
    }

    setColor(color: string): void {
        AbstractTool.color = color;
    }

    selectPencil(): void {
        this.selectedToolService.selectedTool = this.pencil;
    }

    selectEraser(): void {
        this.selectedToolService.selectedTool = this.eraser;
    }

    selectRectangle(): void {
        this.selectedToolService.selectedTool = this.rectangle;
    }

    undo(): void {
        this.foregroundDataService.undo();
    }

    redo(): void {
        this.foregroundDataService.redo();
    }

    private validateSizeInput() {
        if (this.toolSize < TOOL_MIN_SIZE) {
            this.sizeInput.nativeElement.value = TOOL_MIN_SIZE;
            this.toolSize = TOOL_MIN_SIZE;
        } else if (this.toolSize > TOOL_MAX_SIZE) {
            this.sizeInput.nativeElement.value = TOOL_MAX_SIZE;
            this.toolSize = TOOL_MAX_SIZE;
        }
    }
}
