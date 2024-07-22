/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 20:21:18
 * @LastEditTime: 2024-07-22 19:44:41
 */

import GamePlayMgr from "../manage/GamePlayMgr";


const { ccclass, property } = cc._decorator;

@ccclass
export default class StreamItem extends cc.Component {

    public initData(): void {

    }


    public setBgColor(idx: number): void {
        const colorStr: string = GamePlayMgr.ins.wordLineColor[idx];
        if (colorStr) {
            this.node.color = new cc.Color().fromHEX(colorStr);
        }
    }

    public setPos(pos: cc.Vec2): void {
        if (pos) {
            this.node.setPosition(pos);
        }
    }

    public setSize(width: number) {
        this.node.setContentSize(width + this.node.getContentSize().height, this.node.getContentSize().height);
    }

    public setNodeRotation(rotation: number): void {
        this.node.rotation = -rotation;
    }

    public setAnglePos(x1: number, y1: number, x2: number, y2: number): void {
        const middleX: number = (x1 + x2) / 2;
        const middleY: number = (y1 + y2) / 2;
        this.node.setPosition(middleX, middleY);
    }

    protected onDestroy(): void {

    }
}
