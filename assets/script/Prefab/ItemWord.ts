/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 14:04:07
 * @LastEditTime: 2024-07-19 20:56:23
 */

import GamePlayMgr, { IItemInfo } from "../manage/GamePlayMgr";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ItemWord extends cc.Component {
    /**二维坐标点 */
    public dCoordinates: number[] = [];
    /**是否已经填充了单词 */
    public isFillWord: boolean = false;
    /**坐标 */
    private point: { x: number, y: number } = {} as any;
    /**单词内容 */
    public itemInfo: IItemInfo = null;

    private data: { position: cc.Vec2, size: { width: number; height: number; }, point: { x: number, y: number } } = null;
    private word: cc.Label = null;

    public char: string = null;

    /**
     * @description: 方块数据初始化
     */
    public initData(data: { position: cc.Vec2, size: { width: number; height: number; }, point: { x: number, y: number } }): void {
        this.data = data;
        this.node.setPosition(data.position.x, data.position.y);
        this.node.setContentSize(data.size.width, data.size.height);
        this.word = this.node.getChildByName('word').getComponent(cc.Label);
        // 修改节点名称
        this.node.name = data.point.x + "_" + data.point.y;
        this.dCoordinates = [data.point.x, data.point.y];
        this.isFillWord = false;
        let wordPosIdx: { pos: { x: number, y: number }, posIdx: { x: number, y: number } } = { pos: { x: 0, y: 0 }, posIdx: { x: 0, y: 0 } };
        wordPosIdx.pos.x = data.position.x;
        wordPosIdx.pos.y = data.position.y;
        wordPosIdx.posIdx.x = data.point.x;
        wordPosIdx.posIdx.y = data.point.y;
        GamePlayMgr.ins.wordPosIdx.push(wordPosIdx);
        this.setSize();
    }


    /**
     * @description: 设置单词内容
     * @param {IItemInfo} info
     * @return {*}
     */
    public setContent(info: IItemInfo) {
        this.itemInfo = info;
        if (this.word) {
            this.point.x = info.point.x;
            this.point.y = info.point.y;
            this.word.string = info.char;
            this.isFillWord = true;
            this.setWordColor('#001B3A');
            this.char = info.char;
        }
    }


    public setWordColor(color: string): void {
        if (this.word) {
            this.word.node.color = new cc.Color().fromHEX(color);
        }
    }

    public get WordItemPos(): cc.Vec2 {
        return this.node.getPosition();
    }

    public get itemChar(): string {
        return this.char;
    }


    /**
     * @description: 设置 item 大小和字体
     * @return {*}
     */
    private setSize(): void {
        let size: {
            width: number;
            height: number;
        } = GamePlayMgr.ins.itemWordSize;
        this.word.node.setPosition(0, 0, 0);
        // 100, 40; 80, 30; 60, 20
        let fontSize: number = Math.max(Math.floor(size.width / 1.5), 40);
        this.word.fontSize = 100;
        this.word.lineHeight = 100;
    }
}
