/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-06-27 10:43:47
 */


const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
