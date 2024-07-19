
/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 15:14:19
 * @LastEditTime: 2024-07-19 15:22:18
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemAnswerWord extends cc.Component {
    private word: cc.Label = null;

    public initData(answer: string): void {
        this.word = this.node.getComponent(cc.Label);
        this.word.string = answer;
        this.setWordColor('#FFFFFF');
    }


    public setWordColor(color: string): void {
        this.node.color = new cc.Color().fromHEX(color);
    }

    protected onDestroy(): void {

    }
}
