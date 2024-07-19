/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 20:21:18
 * @LastEditTime: 2024-07-19 20:43:55
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
        this.node.setPosition(pos);
    }

    protected onDestroy(): void {

    }
}
