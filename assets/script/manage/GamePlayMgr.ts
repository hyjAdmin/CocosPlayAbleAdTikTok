/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 13:49:52
 * @LastEditTime: 2024-07-19 21:08:06
 */

import SingletonPattern from "../core/SingletonPattern";
import ItemWord from "../Prefab/ItemWord";

const { ccclass, property } = cc._decorator;


export default class GamePlayMgr extends SingletonPattern<GamePlayMgr>() {
    /**关卡尺寸 */
    private _levelSize: { row: number, col: number } = {} as any;
    /**方块坐标：标记矩阵中每个格子位置处的坐标点 */
    public positionMap: cc.Vec2[][] = [];
    /**item 尺寸 */
    public itemWordSize: { width: number, height: number } = {} as any;
    /**在创建关卡的时候需要遍历棋盘，就在那个时候一起创建，避免重复一次遍历: 关卡数据 */
    public wordItemInfo: IItemInfo[][] = [];
    /** 所有节点 用坐标去取 items[x][y] */
    public mainModeItems: ItemWord[][] = [];
    /**单词位置坐标, 坐标索引 */
    public wordPosIdx: { pos: { x: number, y: number }, posIdx: { x: number, y: number } }[] = [];

    public mode: number = 1;

    /**保存填充的字符: key:<行, 列>, value: { char: string} */
    public fillCharPoxIdx: Map<string, { char: string }> = new Map();
    /**保存模式填充的答案单词 */
    public fillmodeAnswerWords: Map<string, IFillWord[]> = new Map();

    public firstLineWord: Map<string, string> = new Map();
    public finishLineWord: Map<string, string> = new Map();

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

    public modeEnAnswerWords: Map<string, IFillWord[]> = new Map();
    public modeEsAnswerWords: Map<string, IFillWord[]> = new Map();
    public modePtAnswerWords: Map<string, IFillWord[]> = new Map();
    public modeIdAnswerWords: Map<string, IFillWord[]> = new Map();

    public fillWordPosIdx: IFillWord[] = [];


    /**
     * @description: 更新item大小
     * @param {number}
     * @return {*}
     */
    public updateItemSize(row: number, col: number) {
        let itemWidth: number = null;
        let itemHeight: number = null;
        if (row === col) {
            itemWidth = Math.floor((964 - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
            itemHeight = Math.floor((1082 - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);

        } else if (row < col) {
            itemWidth = Math.floor((964 - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
        } else if (row > col) {
            itemWidth = Math.floor((964 - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);
        }
        this.itemWordSize = { width: itemWidth, height: itemHeight };
    }


    /**
 * @description: 获取当前触摸选中的单词 item
 * @param {cc} localPos
 * @return {*}
 */
    public getWordPosIdx(localPos: cc.Vec2): IPoint {
        if (this.wordPosIdx.length) {
            for (let i = 0; i < this.wordPosIdx.length; i++) {
                let itemWord: {
                    pos: {
                        x: number;
                        y: number;
                    };
                    posIdx: {
                        x: number;
                        y: number;
                    };
                } = this.wordPosIdx[i];
                const minX: number = itemWord.pos.x - (this.itemWordSize.width / 2);
                const maxX: number = itemWord.pos.x + (this.itemWordSize.width / 2);
                const minY: number = itemWord.pos.y - (this.itemWordSize.height / 2);
                const maxY: number = itemWord.pos.y + (this.itemWordSize.height / 2);
                if (localPos.x >= minX && localPos.x <= maxX) {
                    if (localPos.y >= minY && localPos.y <= maxY) {
                        return itemWord.posIdx;
                    }
                }
            }
        }
    }

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

    public getLanAnswerWords(language: string) {
        if (language === 'en') {
            const word1: string[] = this.enAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeEnAnswerWords.set(this.enAnswer[0], this.fillWordPosIdx);

            const word2: string[] = this.enAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeEnAnswerWords.set(this.enAnswer[1], this.fillWordPosIdx);

            const word3: string[] = this.enAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeEnAnswerWords.set(this.enAnswer[2], this.fillWordPosIdx);

            const word4: string[] = this.enAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeEnAnswerWords.set(this.enAnswer[3], this.fillWordPosIdx);

        } else if (language === 'es') {
            const word1: string[] = this.esAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeEsAnswerWords.set(this.esAnswer[0], this.fillWordPosIdx);

            const word2: string[] = this.esAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeEsAnswerWords.set(this.esAnswer[1], this.fillWordPosIdx);

            const word3: string[] = this.esAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeEsAnswerWords.set(this.esAnswer[2], this.fillWordPosIdx);

            const word4: string[] = this.esAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeEsAnswerWords.set(this.esAnswer[3], this.fillWordPosIdx);

        } else if (language === 'pt') {
            const word1: string[] = this.ptAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modePtAnswerWords.set(this.ptAnswer[0], this.fillWordPosIdx);

            const word2: string[] = this.ptAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modePtAnswerWords.set(this.ptAnswer[1], this.fillWordPosIdx);

            const word3: string[] = this.ptAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modePtAnswerWords.set(this.ptAnswer[2], this.fillWordPosIdx);

            const word4: string[] = this.ptAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modePtAnswerWords.set(this.ptAnswer[3], this.fillWordPosIdx);

        } else if (language === 'id') {
            const word1: string[] = this.idAnswer[0].split('');
            this.fillWordPosIdx.length = 0;
            for (let i = 0; i < word1.length; i++) {
                this.answerPos(word1[i], (word1.length - 1) - i, 4);
            }
            this.modeIdAnswerWords.set(this.idAnswer[0], this.fillWordPosIdx);

            const word2: string[] = this.idAnswer[1].split('');
            this.fillWordPosIdx.length = 0;
            for (let j = 0; j < word2.length; j++) {
                this.answerPos(word2[j], 3, j);
            }
            this.modeIdAnswerWords.set(this.idAnswer[1], this.fillWordPosIdx);

            const word3: string[] = this.idAnswer[2].split('');
            this.fillWordPosIdx.length = 0;
            for (let k = 0; k < word3.length; k++) {
                this.answerPos(word3[k], 0, (word3.length - 1) - k);
            }
            this.modeIdAnswerWords.set(this.idAnswer[2], this.fillWordPosIdx);

            const word4: string[] = this.idAnswer[3].split('');
            this.fillWordPosIdx.length = 0;
            for (let m = 0; m < word4.length; m++) {
                this.answerPos(word4[m], 5, m);
            }
            this.modeIdAnswerWords.set(this.idAnswer[3], this.fillWordPosIdx);

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
