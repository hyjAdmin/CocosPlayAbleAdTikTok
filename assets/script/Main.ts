/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-07-25 15:53:20
 */

import { GameItemConfig, IFillWord, IItemInfo, IPoint } from "./manage/GamePlayMgr";
import LoadResMgr from './manage/LoadResMgr';
import ItemWord from "./Prefab/ItemWord";
import GamePlayMgr from './manage/GamePlayMgr';
import ItemAnswerWord from "./Prefab/ItemAnswerWord";
import StreamItem from "./Prefab/StreamItem";
import { DataManager } from "./manage/DataManager";
import VecMainUI from "./UI/VecMainUI";
import EventManager from "./core/EventManager";
import HozMainUI from "./UI/HozMainUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    @property({
        type: cc.Node,
        displayName: '竖屏节点'
    })
    vec: cc.Node = null;

    @property({
        type: cc.Node,
        displayName: '横屏节点'
    })
    hoz: cc.Node = null;

    private VecMainComp: VecMainUI = null;
    private HozMainComp: HozMainUI = null;

    private VecLuoDiBg: cc.Node = null;
    private HozLuoDiBg: cc.Node = null;
    private background: cc.Node = null;

    protected onLoad(): void {
        const music: cc.AudioSource = this.node.getComponent(cc.AudioSource);
        music.play();
        LoadResMgr.ins.loadMap2Res();
        LoadResMgr.ins.loadStreamItemPrefab('Prefab/StreamItem');
        LoadResMgr.ins.loadBgImageRes(`picture/${GamePlayMgr.ins.language}`);
        GamePlayMgr.ins.getLanAnswerWords(GamePlayMgr.ins.language);
        // 创建事件管理器实例
        GamePlayMgr.ins.eventManager = new EventManager();
        this.background = this.node.getChildByName('background');
        // 默认颜色 idx
        GamePlayMgr.ins.defaultColorIdx = GamePlayMgr.ins.getWordColorRandom();


        this.VecLuoDiBg = this.node.getChildByName('VecLuoDiBg');
        this.HozLuoDiBg = this.node.getChildByName('HozLuoDiBg');

        GamePlayMgr.ins.eventManager.on('entryLuoDi', (data) => {
            this.entryLuoDi(data?.state);
        });

        this.vec.active = true;
        this.VecMainComp = this.vec.getComponent(VecMainUI);
        this.VecMainComp.initData();

        this.hoz.active = true;
        this.HozMainComp = this.hoz.getComponent(HozMainUI);
        this.HozMainComp.initData();

        this.initData();

        /**横屏 */
        cc.view.setResizeCallback(this.canvasChange.bind(this));
        this.canvasChange();
    }

    private initData(): void {
        this.VecLuoDiBg.active = false;
        this.HozLuoDiBg.active = false;
        this.background.active = true;
    }


    /**
     * @description: 点击事件
     * @return {*}
     */
    public onClick(): void {
        (window as any).openAppStore();
    }

    /**
     * @description: 点击事件
     * @return {*}
     */
    public onClickMain(): void {
        if (GamePlayMgr.ins.mode === 3) {
            this.entryLuoDi(GamePlayMgr.ins.screnType);
        }
    }

    /**
     * @description: 屏幕适配
     * @return {*}
     */
    private canvasChange(): void {
        const visibleSize: cc.Size = cc.view.getVisibleSize();
        const designSize: cc.Size = cc.view.getDesignResolutionSize();
        if (visibleSize.width < visibleSize.height) {
            // 竖屏
            cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.FIXED_WIDTH);
            this.vec.active = true;
            this.hoz.active = false;
            this.initScreenData(true);
            GamePlayMgr.ins.screnType = true;


            // 计算宽度和高度的比例
            const widthRatio: number = visibleSize.width / 1080;
            const heightRatio: number = visibleSize.height / 1920;
            // 取较大的比例作为背景图的缩放比例
            const scale: number = Math.min(widthRatio, heightRatio);
            this.vec.scale = scale;

        } else {
            // 横屏
            cc.view.setDesignResolutionSize(1920, 1080, cc.ResolutionPolicy.FIXED_HEIGHT);
            this.hoz.active = true;
            this.vec.active = false;
            this.initScreenData(false);
            GamePlayMgr.ins.screnType = false;

            // 计算宽度和高度的比例
            const widthRatio: number = visibleSize.width / 1920;
            const heightRatio: number = visibleSize.height / 1080;
            // 取较大的比例作为背景图的缩放比例
            const scale: number = Math.max(widthRatio, heightRatio);
            this.hoz.scale = scale;
        }
    }

    private initScreenData(type: boolean): void {
        if (type) {
            // 竖屏
            this.VecMainComp.StopFingerAnim();
            this.VecMainComp.beginFingerAnim();
        } else {
            // 横屏
            this.HozMainComp.StopFingerAnim();
            this.HozMainComp.beginFingerAnim();
        }
    }


    /*****************************************************************  单词处理  *******************************************************************************/

    private entryLuoDi(state: boolean): void {
        this.background.active = false;
        this.vec.active = false;
        this.hoz.active = false;
        if (state) {
            this.VecLuoDiBg.active = true;
            const btnLuoDi: cc.Node = this.VecLuoDiBg.getChildByName('btnLuoDi');
            const playLuoDiLabel: cc.Label = btnLuoDi.getChildByName('playLuoDiLabel').getComponent(cc.Label);
            const lanData = DataManager[GamePlayMgr.ins.language];
            playLuoDiLabel.string = lanData.CTALuoDi;
            cc.tween(btnLuoDi)
                .set({ scale: 0.8 })
                .to(0.5, { scale: 1 })
                .to(0.5, { scale: 0.8 })
                .union()
                .repeatForever()
                .start();
        } else {
            this.HozLuoDiBg.active = true;
            const btnLuoDi: cc.Node = this.HozLuoDiBg.getChildByName('btnLuoDi');
            const playLuoDiLabel: cc.Label = btnLuoDi.getChildByName('playLuoDiLabel').getComponent(cc.Label);
            const lanData = DataManager[GamePlayMgr.ins.language];
            playLuoDiLabel.string = lanData.CTALuoDi;
            cc.tween(btnLuoDi)
                .set({ scale: 0.8 })
                .to(0.5, { scale: 1 })
                .to(0.5, { scale: 0.8 })
                .union()
                .repeatForever()
                .start();
        }
    }

    //#endregion


    protected onDestroy(): void {

    }
}
