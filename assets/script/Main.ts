/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-07-22 20:26:17
 */

import { GameItemConfig, IFillWord, IItemInfo, IPoint } from "./manage/GamePlayMgr";
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
    private firstWordPos: IPoint = {} as any;
    /**当前点击的单词位置 */
    private wordPosIdx: IPoint = { x: -1, y: -1 };
    private colorIdx: number = null;
    private lineAngle: number = null;
    private firstPos: IPoint = null;
    private twoFillPosArr: IPoint[][] = [];
    private vecFinger: cc.Node = null;
    private vecWaring: cc.Node = null;


    /**横屏 */

    protected onLoad(): void {
        GamePlayMgr.ins.getLanAnswerWords(GamePlayMgr.ins.language);

        /**竖屏 */
        this.boardBg = this.vec.getChildByName('middle').getChildByName('boardBg');
        this.StreamRoot = this.boardBg.getChildByName('StreamRoot');
        this.Board = this.boardBg.getChildByName('Board');
        this.vecFinger = this.boardBg.getChildByName('vecFinger');
        this.vecWaring = this.vec.getChildByName('vecWaring');

        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.Board.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.Board.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);


        /**横屏 */

        cc.view.setResizeCallback(this.canvasChange.bind(this));
        this.canvasChange();
        this.initData();
    }

    private initData(): void {
        this.vecFinger.active = false;
        this.vecWaring.active = false;

        /**竖屏 */
        this.createGridd();
        this.createPlate();
        this.createAnswer();

        /**横屏 */


        GamePlayMgr.ins.calculateCornersAngles();
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

                    if (wordIdx >= (GamePlayMgr.ins.levelSize.row * GamePlayMgr.ins.levelSize.col)) {
                        // 默认展示一个答案词
                        if (GamePlayMgr.ins.mode === 1 || GamePlayMgr.ins.mode === 2) {
                            this.dealDefault();
                        }
                    }
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
            // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
            const localPos: cc.Vec2 = this.Board.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
            const pos: IPoint = GamePlayMgr.ins.getWordPosIdx(localPos);
            if (pos) {
                // 是否已经填充了字符
                const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[pos.x][pos.y];
                const WordItemPos: cc.Vec2 = itemComp.WordItemPos;

                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setPos(WordItemPos);

                this.colorIdx = GamePlayMgr.ins.getWordColorRandom();
                StreamItemComp.setBgColor(this.colorIdx);
                this.firstWordPos = { x: WordItemPos.x, y: WordItemPos.y };
                this.wordState(itemComp, true);
                GamePlayMgr.ins.finishGraphicWordPos.push(pos);
                this.firstPos = pos;
            }
        });
    }

    private onTouchMove(event: cc.Event.EventTouch): void {
        const touchUIPos: cc.Vec2 = event.getLocation();
        // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
        const localPos: cc.Vec2 = this.Board.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
        const pos: IPoint = GamePlayMgr.ins.getWordPosIdx(localPos);
        if (pos) {
            if (this.wordPosIdx.x === pos.x && this.wordPosIdx.y === pos.y) {
                // 触摸的是相同的单词
                return;
            }
            const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[pos.x][pos.y];
            const WordItemPos: cc.Vec2 = itemComp.WordItemPos;
            const result: { angle: number; distance: number; } = GamePlayMgr.ins.checkPoints(this.firstWordPos.x, this.firstWordPos.y, WordItemPos.x, WordItemPos.y);

            if (result) {
                if (this.lineAngle !== Math.floor(result?.angle)) {
                    // 另一条路线
                    this.lineAngle = Math.floor(result?.angle);
                    const removedElements: IPoint[] = GamePlayMgr.ins.removeAfterIndex(GamePlayMgr.ins.finishGraphicWordPos, 0);
                    for (let idx = 0; idx < removedElements.length; idx++) {
                        const itemCompRemove: ItemWord = GamePlayMgr.ins.mainModeItems[removedElements[idx].x][removedElements[idx].y];
                        this.wordState(itemCompRemove, false);
                    }

                    for (let j = 0; j < this.twoFillPosArr.length; j++) {
                        // 消除空白路线
                        const twoData: IPoint[] = this.twoFillPosArr[j];
                        this.dealFillData(twoData);
                        this.twoFillPosArr.splice(j, 1);
                    }

                    const twoPot: IPoint[] = GamePlayMgr.ins.calculateLineCoordinates(this.firstPos, pos);
                    if (twoPot.length) {
                        this.twoFillPosArr.push(twoPot);
                        // 填充空白路线
                        for (let i = 0; i < twoPot.length; i++) {
                            const itemCompRemove: ItemWord = GamePlayMgr.ins.mainModeItems[twoPot[i].x][twoPot[i].y];
                            const fillstate: boolean = itemCompRemove.isFillState;
                            if (!fillstate) {
                                this.wordState(itemCompRemove, true);
                                GamePlayMgr.ins.finishGraphicWordPos.push({ x: twoPot[i].x, y: twoPot[i].y });
                            }
                        }
                    }

                } else {
                    // 同一条路线
                    const StreamItemComp: StreamItem = this.StreamItemNode.getComponent(StreamItem);
                    StreamItemComp.setSize(result.distance);
                    StreamItemComp.setNodeRotation(result.angle);
                    StreamItemComp.setAnglePos(this.firstWordPos.x, this.firstWordPos.y, WordItemPos.x, WordItemPos.y);
                    const existingIndex: number = GamePlayMgr.ins.finishGraphicWordPos.findIndex(coord => this.equalsVec2(coord, pos));
                    if (existingIndex !== -1) {
                        // 如果坐标已经存在，删除之后的所有坐标
                        const removedElements: IPoint[] = GamePlayMgr.ins.removeAfterIndex(GamePlayMgr.ins.finishGraphicWordPos, existingIndex);
                        // 移除索引 existingIndex 之后的所有元素
                        for (let idx = 0; idx < removedElements.length; idx++) {
                            const itemCompRemove: ItemWord = GamePlayMgr.ins.mainModeItems[removedElements[idx].x][removedElements[idx].y];
                            this.wordState(itemCompRemove, false);
                        }
                    } else {
                        // 否则添加新的坐标
                        this.wordState(itemComp, true);
                        GamePlayMgr.ins.finishGraphicWordPos.push(pos);
                    }

                    this.wordPosIdx.x = pos.x;
                    this.wordPosIdx.y = pos.y;
                }
            }
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch): void {
        console.log('触摸结束!!!');
        this.dealWordColor(false);
        if (GamePlayMgr.ins.finishGraphicWordPos.length <= 1) {
            this.clearMoveData();
        } else {
            // 判断是否正确
            let notAnswerWord: string[] = [];
            GamePlayMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
                const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[item.x][item.y];
                notAnswerWord.push(itemComp.itemChar);
            });

            const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
            const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);

            const answer1: string = GamePlayMgr.ins.reverseString(notAnswerWord.join(''));
            const answer2: string = notAnswerWord.join('');

            if (LanFinishAnswer.indexOf(answer1) === -1 || LanFinishAnswer.indexOf(answer2) === -1) {
                if (lanAnswer.indexOf(answer1) !== -1 || lanAnswer.indexOf(answer2) !== -1) {
                    // 成功
                    this.dealWordColor(true);
                    GamePlayMgr.ins.saveWordColor.push(this.colorIdx);
                    this.dealAnswerBoard(answer2);
                } else {
                    this.clearMoveData();
                }
            } else {
                this.clearMoveData();
            }
        }
        this.wordPosIdx.x = -1;
        this.wordPosIdx.y = -1;
        this.firstPos = null;
        GamePlayMgr.ins.finishGraphicWordPos.length = 0;
        this.twoFillPosArr.length = 0;
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
        GamePlayMgr.ins.finishGraphicWordPos.length = 0;
        this.wordPosIdx.x = -1;
        this.wordPosIdx.y = -1;
    }

    private dealWordColor(state: boolean): void {
        GamePlayMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
            const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[item.x][item.y];
            this.wordState(itemComp, state);
        });
    }

    private equalsVec2(a: IPoint, b: IPoint): boolean {
        return a.x === b.x && a.y === b.y;
    }

    private clearMoveData(): void {
        this.StreamItemNode.removeFromParent();
        this.firstWordPos = {} as any;
        this.firstPos = null;
        this.twoFillPosArr.length = 0;
        GamePlayMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
            const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[item.x][item.y];
            this.wordState(itemComp, false);
        });
    }

    private dealFillData(arr: IPoint[]): void {
        for (let i = 0; i < arr.length; i++) {
            const itemCompRemove: ItemWord = GamePlayMgr.ins.mainModeItems[arr[i].x][arr[i].y];
            this.wordState(itemCompRemove, false);
        }
    }

    private wordState(itemComp: ItemWord, state: boolean): void {
        if (state) {
            itemComp.setWordColor('#FFFFFF');
            itemComp.isFillState = true;
        } else {
            itemComp.setWordColor('#001B3A');
            itemComp.isFillState = false;
        }
    }


    private dealDefault(): void {
        const answer: Map<string, IFillWord[]> = GamePlayMgr.ins.getLanAnswerWordsPos(GamePlayMgr.ins.language);
        const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
        const resultWord: IFillWord[] = answer.get(lanAnswer[0]);

        const firstWord: { x: number; y: number; } = resultWord[0].point;
        const endWord: { x: number; y: number; } = resultWord[resultWord.length - 1].point;

        const firstWordComp: ItemWord = GamePlayMgr.ins.mainModeItems[firstWord.x][firstWord.y];
        const endWordComp: ItemWord = GamePlayMgr.ins.mainModeItems[endWord.x][endWord.y];


        let firstWordPos: cc.Vec2 = null;
        let endWordPos: cc.Vec2 = null;
        if (firstWordComp) {
            firstWordPos = firstWordComp.WordItemPos;
        }

        if (endWordComp) {
            endWordPos = endWordComp.WordItemPos;
        }

        LoadResMgr.ins.loadItemPrefab('Prefab/StreamItem', (item: cc.Node) => {
            this.StreamRoot.addChild(item);

            const StreamItemComp: StreamItem = item.getComponent(StreamItem);
            StreamItemComp.setPos(firstWordPos);

            this.colorIdx = GamePlayMgr.ins.getWordColorRandom();
            StreamItemComp.setBgColor(this.colorIdx);
            GamePlayMgr.ins.saveWordColor.push(this.colorIdx);

            const result: { angle: number; distance: number; } = GamePlayMgr.ins.checkPoints(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            if (result) {
                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setSize(result.distance);
                StreamItemComp.setNodeRotation(result.angle);
                StreamItemComp.setAnglePos(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            }
            for (let i = 0; i < resultWord.length; i++) {
                const data: IFillWord = resultWord[i];
                const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[data.point.x][data.point.y];
                this.wordState(itemComp, true);
            }
            this.dealAnswerBoard(lanAnswer[0]);
            // 手指指引
        });
    }

    private dealAnswerBoard(answer: string): void {
        const answer1: string = GamePlayMgr.ins.reverseString(answer);
        const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);
        for (let i = 0; i < this.titleLayout.children.length; i++) {
            const data: ItemAnswerWord = this.titleLayout.children[i].getComponent(ItemAnswerWord);
            if (!data.isFillState && answer === data.answerCn || answer1 === data.answerCn) {
                data.isFillState = true;
                data.setWordColor('#FFE600');
                LanFinishAnswer.push(data.answerCn);
            }
        }
    }

    private setVecFinger(): void {

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
            this.unscheduleAllCallbacks();
            // this.onClick();
        }, 22);
    }


    protected onDestroy(): void {

    }
}
