
/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 15:14:19
 * @LastEditTime: 2024-07-22 19:55:06
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemAnswerWord extends cc.Component {
    private word: cc.Label = null;
    private answer: string = null;
    private isFill: boolean = null;

    public initData(answer: string): void {
        this.word = this.node.getComponent(cc.Label);
        this.word.string = answer;
        this.answer = answer;
        this.isFillState = false;
        this.setWordColor('#FFFFFF');
    }


    public setWordColor(color: string): void {
        this.node.color = new cc.Color().fromHEX(color);
    }

    public set isFillState(state: boolean) {
        this.isFill = state;
    }

    public get isFillState() {
        return this.isFill;
    }

    public get answerCn() {
        return this.answer;
    }

    protected onDestroy(): void {

    }
}
