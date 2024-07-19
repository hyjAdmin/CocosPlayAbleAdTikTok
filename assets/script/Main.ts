/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-07-19 21:09:36
 */

import { GameItemConfig, IItemInfo, IPoint } from "./manage/GamePlayMgr";
import LoadResMgr from "./manage/LoadResMgr";
import ItemWord from "./Prefab/ItemWord";
import GamePlayMgr from './manage/GamePlayMgr';
import ItemAnswerWord from "./Prefab/ItemAnswerWord";
import StreamItem from "./Prefab/StreamItem";

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

    @property({
        type: cc.Node,
        displayName: '竖屏答案词'
    })
    private titleLayout: cc.Node = null;

    /**竖屏 */
    private boardBg: cc.Node = null;
    private StreamRoot: cc.Node = null;
    private Board: cc.Node = null;
    private StreamItemNode: cc.Node = null;


    /**横屏 */

    protected onLoad(): void {
        GamePlayMgr.ins.getLanAnswerWords(GamePlayMgr.ins.language);

        /**竖屏 */
        this.boardBg = this.vec.getChildByName('middle').getChildByName('boardBg');
        this.StreamRoot = this.boardBg.getChildByName('StreamRoot');
        this.Board = this.boardBg.getChildByName('Board');
        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.Board.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);


        /**横屏 */

        cc.view.setResizeCallback(this.canvasChange.bind(this));
        this.canvasChange();
        this.initData();
    }

    private initData(): void {
        /**竖屏 */
        this.createGridd();
        this.createPlate();
        this.createAnswer();


        /**横屏 */
    }


    /*****************************************************************  关卡生成  *******************************************************************************/

    //#region 

    /**
     * @description: 生成网格
     * @return {*}
     */
    private createGridd(): void {
        // 先清除后设置
        GamePlayMgr.ins.positionMap.length = 0;

        // 设置背景尺寸
        this.setNodeBgSize(GamePlayMgr.ins.levelSize.row, GamePlayMgr.ins.levelSize.col);
        // 更新item大小
        GamePlayMgr.ins.updateItemSize(GamePlayMgr.ins.levelSize.row, GamePlayMgr.ins.levelSize.col);

        const bgWidth: number = this.Board.width;
        const bgHeight: number = this.Board.height;

        // 以左下角为原点,计算第一个方块的位置
        const beginX: number = -(bgWidth / 2) + GameItemConfig.padding + (GamePlayMgr.ins.itemWordSize.width / 2);
        const beginY: number = -(bgHeight / 2) + GameItemConfig.padding + (GamePlayMgr.ins.itemWordSize.height / 2);

        // 从左到右计算每一列方块的位置
        for (let c = 0; c < GamePlayMgr.ins.levelSize.row; c++) {
            let columnSet: cc.Vec2[] = [];
            let y: number = beginY + c * (GamePlayMgr.ins.itemWordSize.height + GameItemConfig.padding);
            // 从下到上计算该列的每一个方块的位置
            for (let r = 0; r < GamePlayMgr.ins.levelSize.col; r++) {
                let x: number = beginX + r * (GamePlayMgr.ins.itemWordSize.width + GameItemConfig.padding);
                columnSet.push(new cc.Vec2(x, y));
            }
            GamePlayMgr.ins.positionMap.push(columnSet);
        }
    }

    /**
     * @description: 生成题版
     */
    private createPlate(): void {
        this.Board.removeAllChildren();
        this.clearLevelData();
        let wordIdx: number = 0;

        for (let r = 0; r < GamePlayMgr.ins.levelSize.row; r++) {
            for (let c = 0; c < GamePlayMgr.ins.levelSize.col; c++) {
                // 单词 item 信息保存
                for (let i = 0; i < GamePlayMgr.ins.levelSize.row; i++) {
                    GamePlayMgr.ins.mainModeItems.push(new Array(GamePlayMgr.ins.levelSize.col));
                    GamePlayMgr.ins.wordItemInfo.push(new Array(GamePlayMgr.ins.levelSize.col));
                }
                // 方块预制
                LoadResMgr.ins.loadItemPrefab('Prefab/ItemWord', (item: cc.Node) => {

                    const ItemWordNode: cc.Node = item;
                    this.Board.addChild(ItemWordNode);
                    // 设置方块位置
                    const itemComp: ItemWord = ItemWordNode.getComponent(ItemWord);

                    const char: string = GamePlayMgr.ins.getLanBoard(GamePlayMgr.ins.language)[wordIdx];

                    const charItemInfo: IItemInfo = {
                        point: { x: c, y: r },
                        char: char,
                    }
                    GamePlayMgr.ins.wordItemInfo[c][r] = charItemInfo;
                    GamePlayMgr.ins.mainModeItems[c][r] = itemComp;

                    itemComp.initData({ position: GamePlayMgr.ins.positionMap[r][c], size: GamePlayMgr.ins.itemWordSize, point: { x: c, y: r } });
                    itemComp.setContent(charItemInfo);
                    wordIdx++;
                });
            }
        }
    }

    /**
     * @description: 设置背景宽高
     * @return {*}
     */
    private setNodeBgSize(row: number, col: number): void {
        if (row === col) {
            this.Board.setContentSize(964, 1082);
        } else if (row < col) {
            let itemWidth: number = Math.floor((964 - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
            let height: number = (GameItemConfig.padding * 2) + ((row - 1) * GameItemConfig.spacingY) + (itemWidth * row);
            this.Board.setContentSize(964, height);
        } else if (row > col) {
            let itemWidth: number = Math.floor((964 - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);
            let width: number = (GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingY + (itemWidth * col);
            this.Board.setContentSize(width, 1082);
        }
    }

    private createAnswer(): void {
        this.titleLayout.removeAllChildren();
        const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
        for (let i = 0; i < lanAnswer.length; i++) {
            LoadResMgr.ins.loadItemPrefab('Prefab/ItemAnswerWord', (item: cc.Node) => {
                const ItemWordNode: cc.Node = item;
                this.titleLayout.addChild(ItemWordNode);
                const itemComp: ItemAnswerWord = ItemWordNode.getComponent(ItemAnswerWord);
                itemComp.initData(lanAnswer[i]);
            });
        }
    }

    //#endregion


    /*****************************************************************  触摸划词  *******************************************************************************/

    //#region 


    private onTouchStart(event: cc.Event.EventTouch): void {
        LoadResMgr.ins.loadItemPrefab('Prefab/StreamItem', (item: cc.Node) => {
            this.StreamItemNode = item;
            this.StreamRoot.addChild(item);

            const touchUIPos: cc.Vec2 = event.getLocation();
            // // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
            const localPos: cc.Vec2 = this.Board.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
            const pos: IPoint = GamePlayMgr.ins.getWordPosIdx(localPos);
            if (pos) {
                // 是否已经填充了字符
                const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[pos.x][pos.y];
                const WordItemPos: cc.Vec2 = itemComp.WordItemPos;

                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setPos(WordItemPos);

                const colorIdx: number[] = GamePlayMgr.ins.saveWordColor;
                const idx: number = GamePlayMgr.ins.getWordColorRandom();
                StreamItemComp.setBgColor(idx);

                const key: string = WordItemPos.x + ',' + WordItemPos.y;
                GamePlayMgr.ins.firstLineWord.set(key, itemComp.itemChar);
                GamePlayMgr.ins.finishLineWord.set(key, itemComp.itemChar);
            }
        });
    }

    private onTouchMove(event: cc.Event.EventTouch): void {
        let a = 0;
        // if (!GamePlayMgr.ins.isTouch) {
        //     return;
        // }
        // // 未选中单词不填充
        // let isMove: boolean = false;
        // switch (GamePlayMgr.ins.mode) {
        //     case GamePlayModeEnum.mode1: {
        //         isMove = true;
        //         break;
        //     }
        //     case GamePlayModeEnum.mode2: {
        //         isMove = true;
        //         break;
        //     }
        //     case GamePlayModeEnum.mode3: {
        //         if (TitlePlateMgr.ins.fillCharArr.length) {
        //             isMove = true;
        //         }
        //         break;
        //     }
        // }

        // if (!isMove) {
        //     return;
        // }

        // const touchUIPos: cc.Vec2 = event.getLocation();
        // // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
        // let localPos: Vec3 = this.Board.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(touchUIPos.x, touchUIPos.y));
        // const pos: IPoint = TitlePlateMgr.ins.getWordPosIdx(localPos);
        // if (pos) {
        //     // 是否已经填充了字符
        //     const itemComp: ItemWord = this.mainModeItems[pos.x][pos.y];
        //     if (itemComp.isFillWord) {
        //         GamePlayMgr.ins.isTouch = false;
        //         return;
        //     }
        //     // 未填充单词
        //     if (this.wordPosIdx.x === pos.x && this.wordPosIdx.y === pos.y) {
        //         // 触摸的是相同的单词
        //         return;
        //     } else {
        //         Logger.log('pos:', pos, 'this.wordPosIdx:', this.wordPosIdx, 'this.isTouch:', GamePlayMgr.ins.isTouch);
        //         if (this.wordPosIdx.x === -1 && this.wordPosIdx.y === -1) {
        //             TitlePlateMgr.ins.finishGraphicWordPos.push(pos);
        //             this.wordPosIdx.x = pos.x;
        //             this.wordPosIdx.y = pos.y;
        //             this.wordLengthFillColor(itemComp);
        //             GamePlayMgr.ins.isTouch = true;
        //         } else {
        //             let isTouchX: boolean = null;
        //             if (Math.abs(this.wordPosIdx.x - pos.x) === 1 && (this.wordPosIdx.y - pos.y) === 0) {
        //                 this.wordPosIdx.x = pos.x;
        //                 this.wordPosIdx.y = pos.y;
        //                 TitlePlateMgr.ins.finishGraphicWordPos.push(pos);
        //                 this.wordLengthFillColor(itemComp);
        //                 isTouchX = true;
        //             } else {
        //                 isTouchX = false;
        //             }
        //             let isTouchY: boolean = null;
        //             if (Math.abs(this.wordPosIdx.y - pos.y) === 1 && (this.wordPosIdx.x - pos.x) === 0) {
        //                 this.wordPosIdx.x = pos.x;
        //                 this.wordPosIdx.y = pos.y;
        //                 TitlePlateMgr.ins.finishGraphicWordPos.push(pos);
        //                 this.wordLengthFillColor(itemComp);
        //                 isTouchY = true;
        //             } else {
        //                 isTouchY = false;
        //             }
        //             if (isTouchX || isTouchY) {
        //                 GamePlayMgr.ins.isTouch = true;
        //             } else {
        //                 GamePlayMgr.ins.isTouch = false;
        //             }
        //         }
        //     }
        // }
    }

    private onTouchEnd(event: cc.Event.EventTouch): void {
        if (GamePlayMgr.ins.finishLineWord.size <= 1) {
            this.StreamItemNode.removeFromParent();
            GamePlayMgr.ins.finishLineWord.clear();
            GamePlayMgr.ins.firstLineWord.clear();
        }


        // Logger.log('触摸结束!!!');
        // if (TitlePlateMgr.ins.finishGraphicWordPos.length > 2) {
        //     let fillWordPosIdx: IFillWord[] = [];
        //     let notAnswerWord: string[] = [];
        //     TitlePlateMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
        //         const itemComp: ItemWord = this.mainModeItems[item.x][item.y];
        //         if (TitlePlateMgr.ins.fillCharArr.length) {
        //             const char: string = TitlePlateMgr.ins.fillCharArr[idx];
        //             if (char) {
        //                 itemComp.setRepeal(2, char, { x: item.x, y: item.y });
        //                 fillWordPosIdx.push({
        //                     char: char,
        //                     point: { x: item.x, y: item.y }
        //                 });
        //                 // 保存绘画的单词
        //                 TitlePlateMgr.ins.fillCharPoxIdx.set(item.x + ',' + item.y, { char: char });
        //                 notAnswerWord.push(char);
        //             }
        //         } else {
        //             const char: string = TitlePlateMgr.ins.getRandomLetter();
        //             if (char) {
        //                 itemComp.setRepeal(2, char, { x: item.x, y: item.y });
        //                 fillWordPosIdx.push({
        //                     char: char,
        //                     point: { x: item.x, y: item.y }
        //                 });

        //                 // 保存绘画的单词
        //                 TitlePlateMgr.ins.fillCharPoxIdx.set(item.x + ',' + item.y, { char: char });
        //                 notAnswerWord.push(char);
        //             }
        //         }
        //     });
        //     // 保存填充了的单词
        //     TitlePlateMgr.ins.fillCompleteWord.set(notAnswerWord.join(''), fillWordPosIdx);
        //     // 保存模式的答案词
        //     if (notAnswerWord.join('') === TitlePlateMgr.ins.fillWord) {
        //         TitlePlateMgr.ins.fillmodeAnswerWords.set(TitlePlateMgr.ins.fillWord, fillWordPosIdx);
        //     }

        // } else {
        //     Logger.log('格子数太短, 请重新画线!!!');
        // }
        // this.wordPosIdx.x = -1;
        // this.wordPosIdx.y = -1;
        // TitlePlateMgr.ins.finishGraphicWordPos.length = 0;
        // TitlePlateMgr.ins.fillCharArr.length = 0;
        // GamePlayMgr.ins.isTouch = true;
    }


    //#endregion


    /*****************************************************************  单词处理  *******************************************************************************/

    //#region 


    /**
     * @description: 清除关卡数据
     * @return {*}
     */
    private clearLevelData(): void {
        GamePlayMgr.ins.mainModeItems.length = 0;
        GamePlayMgr.ins.wordItemInfo.length = 0;
        // GamePlayMgr.ins.finishGraphicWordPos.length = 0;
        // this.wordPosIdx.x = -1;
        // this.wordPosIdx.y = -1;
    }

    //#endregion


    /**
     * @description: 点击事件
     * @return {*}
     */
    public onClick(): void {
        (window as any).openAppStore();
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
            // 默认设置行和列
            GamePlayMgr.ins.levelSize = { row: 6, col: 6 };
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


    protected onDestroy(): void {

    }
}
