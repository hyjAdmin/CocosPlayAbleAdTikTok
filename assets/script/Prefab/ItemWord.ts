/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 14:04:07
 * @LastEditTime: 2024-07-23 22:36:14
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

    private data: { position: cc.Vec2, size: { width: number; height: number; }, point: { x: number, y: number }, screnType?: boolean } = null;
    private word: cc.Label = null;

    public char: string = null;

    private isFill: boolean = null;

    /**
     * @description: 方块数据初始化
     */
    public initData(data: { position: cc.Vec2, size: { width: number; height: number; }, point: { x: number, y: number }, screnType?: boolean }): void {
        this.data = data;
        this.node.setPosition(data.position.x, data.position.y);
        this.node.setContentSize(data.size.width, data.size.height);
        this.word = this.node.getChildByName('word').getComponent(cc.Label);
        // 修改节点名称
        this.node.name = data.point.x + "_" + data.point.y;
        this.dCoordinates = [data.point.x, data.point.y];
        this.isFillWord = false;
        this.isFillState = false;
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

    public set isFillState(state: boolean) {
        this.isFill = state;
    }

    public get isFillState() {
        return this.isFill;
    }


    /**
     * @description: 设置 item 大小和字体
     * @return {*}
     */
    private setSize(): void {

        this.word.node.setPosition(0, 0, 0);

        let sizeFontVal: number = 100;
        if (this.data.screnType) {
            sizeFontVal = 100;
        } else {
            sizeFontVal = 70;
        }

        this.word.fontSize = sizeFontVal;
        this.word.lineHeight = sizeFontVal;
    }
}
