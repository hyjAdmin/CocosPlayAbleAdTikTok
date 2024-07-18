/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-07-18 20:21:23
 */


const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    protected onLoad(): void {
        this.initData();
        cc.view.setResizeCallback(this.canvasChange.bind(this));
        this.canvasChange();
    }

    private initData(): void {

    }


    /**
     * @description: 点击事件
     * @return {*}
     */
    public onClick(): void {
        (window as any).openAppStore();
    }

    protected onDestroy(): void {

    }

    /**
     * @description: 屏幕适配
     * @return {*}
     */
    private canvasChange(): void {
        const visibleSize: cc.Size = cc.view.getVisibleSize();
        const designSize: cc.Size = cc.view.getDesignResolutionSize();
        if (visibleSize.height / visibleSize.width > designSize.height / designSize.width) {
            // 竖屏
            cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.FIXED_WIDTH);
            // this.vec.active = true;
            // this.hoz.active = false;
            this.fingerAnimation(true);
        } else {
            // 横屏
            cc.view.setDesignResolutionSize(1920, 1080, cc.ResolutionPolicy.FIXED_HEIGHT);
            // this.hoz.active = true;
            // this.vec.active = false;
            this.fingerAnimation(false);
        }
    }

    private fingerAnimation(type: boolean): void {
        if (type) {
            // 竖屏
            // this.vecAnim.play('vecAnimation');
            // this.hozAnim.stop();
        } else {
            // 横屏
            // this.vecAnim.stop();
            // this.hozAnim.play('hozAnimation');
        }
        this.schedule(() => {
            console.log('用户无操作!!!');
            this.unscheduleAllCallbacks();
            // this.onClick();
        }, 22);
    }
}
