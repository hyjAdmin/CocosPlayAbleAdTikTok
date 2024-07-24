/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 13:49:52
 * @LastEditTime: 2024-07-24 10:38:49
 */

import EventManager from "../core/EventManager";
import SingletonPattern from "../core/SingletonPattern";
import ItemWord from "../Prefab/ItemWord";

const { ccclass, property } = cc._decorator;


export default class GamePlayMgr extends SingletonPattern<GamePlayMgr>() {
    /**关卡尺寸 */
    private _levelSize: { row: number, col: number } = { row: 6, col: 6 } as any;

    public mode: number = 1;

    /**保存填充的字符: key:<行, 列>, value: { char: string} */
    public fillCharPoxIdx: Map<string, { char: string }> = new Map();
    /**保存模式填充的答案单词 */
    public fillmodeAnswerWords: Map<string, IFillWord[]> = new Map();
    /**完成绘画后的 item 坐标 */
    public finishGraphicWordPos: IPoint[] = [];
    public firstWordPos: IPoint = {} as any;
    public endWordPos: IPoint = {} as any;
    /** true: 竖屏, false: 横屏 */
    public screnType: boolean = true;

    public defaultColorIdx: number = null;
    public colorIdx: number = null;
    public answer2: string = null;
    public eventManager: EventManager = null;

    public rncWordAnimIdx: number[] = [0];

    public saveWordColor: number[] = [];
    public wordColorRandom: number[] = [0, 1, 2, 3];
    public wordLineColor: string[] = ['#9662FB', '#468AF0', '#FE8306', '#FF6745'];

    public language: string = 'en';

    public enBoard: string[] = 'D-N-B-D-S-G-R-I-I-U-L-O-I-I-P-C-F-O-B-X-F-K-R-S-E-S-R-O-H-E-X-F-A-Z-T-B'.split('-');
    public esBoard: string[] = 'A-J-Í-G-Ó-Z-T-E-F-A-M-O-A-É-P-T-C-R-R-O-Z-O-O-R-O-S-N-A-G-O-H-C-Ü-J-Ü-Y'.split('-');
    public ptBoard: string[] = 'O-Ó-F-G-S-C-B-Ã-L-A-F-O-O-V-C-T-Ú-B-L-Ô-Z-O-G-R-O-C-R-O-P-A-Ü-N-V-F-Ç-M'.split('-');
    public idBoard: string[] = 'N-O-C-K-T-B-A-Y-Q-U-O-E-K-Y-C-D-G-B-I-P-B-A-Z-E-A-B-M-O-D-K-T-R-V-L-Q-Y'.split('-');

    public enAnswer: string[] = ['HORSE', 'DUCK', 'BIRD', 'GOOSE'];
    public esAnswer: string[] = ['GANSO', 'GATO', 'RATA', 'ZORRO'];
    public ptAnswer: string[] = ['PORCO', 'GATO', 'LOBO', 'COBRA'];
    public idAnswer: string[] = ['DOMBA', 'KUDA', 'IKAN', 'BEBEK'];

    public enNotFinishAnswer: string[] = ['HORSE', 'DUCK', 'BIRD', 'GOOSE'];
    public esNotFinishAnswer: string[] = ['GANSO', 'GATO', 'RATA', 'ZORRO'];
    public ptNotFinishAnswer: string[] = ['PORCO', 'GATO', 'LOBO', 'COBRA'];
    public idNotFinishAnswer: string[] = ['DOMBA', 'KUDA', 'IKAN', 'BEBEK'];

    public enFinishAnswer: string[] = [];
    public esFinishAnswer: string[] = [];
    public ptFinishAnswer: string[] = [];
    public idFinishAnswer: string[] = [];

    public modeEnAnswerWords: Map<string, IFillWord[]> = new Map();
    public modeEsAnswerWords: Map<string, IFillWord[]> = new Map();
    public modePtAnswerWords: Map<string, IFillWord[]> = new Map();
    public modeIdAnswerWords: Map<string, IFillWord[]> = new Map();

    public fillWordPosIdx: IFillWord[] = [];

    /**
     * @description: 获取地图尺寸
     * @return {*}
     */
    public get levelSize(): { row: number; col: number; } {
        return this._levelSize;
    }

    /**
     * @description: 修改地图尺寸
     * @param {object} size
     * @return {*}
     */
    public set levelSize(size: { row: number, col: number }) {
        this._levelSize = size;
    }

    public setAnswerPos(): void {

    }

    public getLanBoard(language: string): string[] {
        let board: string[] = [];
        if (language === 'en') {
            board = this.enBoard;
        } else if (language === 'es') {
            board = this.esBoard;
        } else if (language === 'pt') {
            board = this.ptBoard;
        } else if (language === 'id') {
            board = this.idBoard;
        }
        return board;
    }

    public getLanAnswer(language: string): string[] {
        let Answer: string[] = [];
        if (language === 'en') {
            Answer = this.enAnswer;
        } else if (language === 'es') {
            Answer = this.esAnswer;
        } else if (language === 'pt') {
            Answer = this.ptAnswer;
        } else if (language === 'id') {
            Answer = this.idAnswer;
        }
        return Answer;
    }


    public getLanNotFinishAnswer(language: string): string[] {
        let Answer: string[] = [];
        if (language === 'en') {
            Answer = this.enNotFinishAnswer;
        } else if (language === 'es') {
            Answer = this.esNotFinishAnswer;
        } else if (language === 'pt') {
            Answer = this.ptNotFinishAnswer;
        } else if (language === 'id') {
            Answer = this.idNotFinishAnswer;
        }
        return Answer;
    }

    public getLanFinishAnswer(language: string): string[] {
        let Answer: string[] = [];
        if (language === 'en') {
            Answer = this.enFinishAnswer;
        } else if (language === 'es') {
            Answer = this.esFinishAnswer;
        } else if (language === 'pt') {
            Answer = this.ptFinishAnswer;
        } else if (language === 'id') {
            Answer = this.idFinishAnswer;
        }
        return Answer;
    }

    public getLanAnswerWords(language: string) {
        if (language === 'en') {
            const word1: string[] = this.enAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeEnAnswerWords.set(this.enAnswer[0], this.fillWordPosIdx.slice());

            const word2: string[] = this.enAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeEnAnswerWords.set(this.enAnswer[1], this.fillWordPosIdx.slice());

            const word3: string[] = this.enAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeEnAnswerWords.set(this.enAnswer[2], this.fillWordPosIdx.slice());

            const word4: string[] = this.enAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeEnAnswerWords.set(this.enAnswer[3], this.fillWordPosIdx.slice());

        } else if (language === 'es') {
            const word1: string[] = this.esAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeEsAnswerWords.set(this.esAnswer[0], this.fillWordPosIdx.slice());

            const word2: string[] = this.esAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeEsAnswerWords.set(this.esAnswer[1], this.fillWordPosIdx.slice());

            const word3: string[] = this.esAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeEsAnswerWords.set(this.esAnswer[2], this.fillWordPosIdx.slice());

            const word4: string[] = this.esAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeEsAnswerWords.set(this.esAnswer[3], this.fillWordPosIdx.slice());

        } else if (language === 'pt') {
            const word1: string[] = this.ptAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modePtAnswerWords.set(this.ptAnswer[0], this.fillWordPosIdx.slice());

            const word2: string[] = this.ptAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modePtAnswerWords.set(this.ptAnswer[1], this.fillWordPosIdx.slice());

            const word3: string[] = this.ptAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modePtAnswerWords.set(this.ptAnswer[2], this.fillWordPosIdx.slice());

            const word4: string[] = this.ptAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modePtAnswerWords.set(this.ptAnswer[3], this.fillWordPosIdx.slice());

        } else if (language === 'id') {
            const word1: string[] = this.idAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeIdAnswerWords.set(this.idAnswer[0], this.fillWordPosIdx.slice());

            const word2: string[] = this.idAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeIdAnswerWords.set(this.idAnswer[1], this.fillWordPosIdx.slice());

            const word3: string[] = this.idAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeIdAnswerWords.set(this.idAnswer[2], this.fillWordPosIdx.slice());

            const word4: string[] = this.idAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeIdAnswerWords.set(this.idAnswer[3], this.fillWordPosIdx.slice());

        }
    }

    public getLanAnswerWordsPos(language: string): Map<string, IFillWord[]> {
        let lanAnswer: Map<string, IFillWord[]> = null;
        if (language === 'en') {
            lanAnswer = this.modeEnAnswerWords;
        } else if (language === 'es') {
            lanAnswer = this.modeEsAnswerWords;
        } else if (language === 'pt') {
            lanAnswer = this.modePtAnswerWords;
        } else if (language === 'id') {
            lanAnswer = this.modeIdAnswerWords;
        }
        return lanAnswer;
    }


    private answerPos(char: string, x: number, y: number): void {
        this.fillWordPosIdx.push({
            char: char,
            point: { x: x, y: y }
        });
    }

    public getWordColorRandom(): number {
        let num: number = null;
        if (this.saveWordColor.length) {
            for (let i = 0; i < this.saveWordColor.length; i++) {
                for (let j = 0; j < this.wordColorRandom.length; j++) {
                    if (this.saveWordColor[i] === this.wordColorRandom[j]) {
                        this.wordColorRandom.splice(j, 1);
                    }
                }
            }
            num = this.getRandomFromArray(this.wordColorRandom);
        } else {
            num = this.getRandomFromArray([0, 1, 2, 3]);
        }

        if (num === null || num === undefined) {
            num = 0;
        }

        return num;
    }


    /**
     * @description: 获取数组中随机一个值
     * @return {*}
     * @param {number} arr
     */
    public getRandomFromArray(arr: number[]): number {
        if (!Array.isArray(arr) || arr.length === 0) return undefined;
        const randomIndex: number = Math.floor(Math.random() * arr.length);
        return arr[randomIndex];
    }

    /**
     * @description: 将弧度转换为度数
     * @return {*}
     * @param {number} radians
     */
    public radiansToDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * @description: 计算两点的直线距离
     * @return {*}
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    public calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public reverseString(str: string): string {
        // 将字符串转换为数组
        const array: string[] = str.split('');

        // 倒序排列数组
        const reversedArray: string[] = array.reverse();

        // 将数组重新转换为字符串
        const reversedStr: string = reversedArray.join('');

        return reversedStr;
    }

    public removeAfterIndex(array: IPoint[], index: number): IPoint[] {
        return array.splice(index + 1, array.length - index - 1);
    }


    /**
     * @description: 计算两个点之间的所有坐标（直线和斜线）
     * @return {*}
     * @param {IPoint} start
     * @param {IPoint} end
     */
    public calculateLineCoordinates(start: IPoint, end: IPoint): IPoint[] {
        const coordinates: IPoint[] = [];
        if (!start) {
            return coordinates;
        }
        const x1: number = Math.round(start.x);
        const y1: number = Math.round(start.y);
        const x2: number = Math.round(end.x);
        const y2: number = Math.round(end.y);

        if (start.x === end.x) {
            if ((end.y - start.y) > 0) {
                for (let i = start.y + 1; i < end.y; i++) {
                    coordinates.push({ x: start.x, y: i });
                }
            } else {
                for (let i = end.y + 1; i < start.y; i++) {
                    coordinates.push({ x: start.x, y: i });
                }
            }
        }

        if (start.y === end.y) {
            if ((end.x - start.x) > 0) {
                for (let i = start.x + 1; i < end.x; i++) {
                    coordinates.push({ x: i, y: start.y });
                }
            } else {
                for (let i = end.x + 1; i < start.x; i++) {
                    coordinates.push({ x: i, y: start.y });
                }
            }
        }

        if (start.x !== end.x && start.y !== end.y) {
            if ((end.x - start.x) > 0 && (end.y - start.y) > 0) {
                let startY: number = start.y;
                for (let i = start.x + 1; i < end.x; i++) {
                    startY += 1;
                    coordinates.push({ x: i, y: startY });
                }
            }

            if ((end.x - start.x) < 0 && (end.y - start.y) < 0) {
                let startY: number = end.y;
                for (let i = end.x + 1; i < start.x; i++) {
                    startY += 1;
                    coordinates.push({ x: i, y: startY });
                }
            }

            if ((end.x - start.x) < 0 && (end.y - start.y) > 0) {
                let startY: number = end.y;
                for (let i = end.x + 1; i < start.x; i++) {
                    startY -= 1;
                    coordinates.push({ x: i, y: startY });
                }
            }

            if ((end.x - start.x) > 0 && (end.y - start.y) < 0) {
                let startY: number = start.y;
                for (let i = start.x + 1; i < end.x; i++) {
                    startY -= 1;
                    coordinates.push({ x: i, y: startY });
                }
            }
        }
        return coordinates;
    }
}


/**
 * @description: 方块的基本配置
 */
export class GameItemConfig {
    /**水平间隔 */
    public static spacingX: number = 0;
    /**垂直间隔 */
    public static spacingY: number = 0;
    /**边距: 左边距, 右边距, 顶部边距, 底部边距 */
    public static padding: number = 0;
}


/** 字符详情 */
export interface IItemInfo {
    /** 字符 */
    char: string,
    /** 位置 */
    point: IPoint,
}

/** 下标位置坐标 0,0 开始 */
export interface IPoint {
    x: number,
    y: number
}

/**
 * @description: 填充字符的位置
 * @return {*}
 */
export interface IFillWord {
    char: string,
    point: { x: number, y: number }
}
