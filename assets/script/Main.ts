/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-06-27 10:43:11
 * @LastEditTime: 2024-07-23 15:08:22
 */

import { GameItemConfig, IFillWord, IItemInfo, IPoint } from "./manage/GamePlayMgr";
import LoadResMgr from './manage/LoadResMgr';
import ItemWord from "./Prefab/ItemWord";
import GamePlayMgr from './manage/GamePlayMgr';
import ItemAnswerWord from "./Prefab/ItemAnswerWord";
import StreamItem from "./Prefab/StreamItem";
import { DataManager } from "./manage/DataManager";

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

    @property({
        type: cc.Node,
        displayName: '横屏答案词'
    })
    private HozTitleLayout: cc.Node = null;

    /** true: 竖屏, false: 横屏 */
    private screnType: boolean = true;


    private titleLyoutNode: cc.Node = null;
    private wordBoard: cc.Node = null;
    private AllStreamRoot: cc.Node = null;
    private AllFinger: cc.Node = null;

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
    private wordPos: { x: number, y: number, item: ItemWord }[] = [];
    private fingerStreamItemNode: cc.Node = null;
    private EncouragingWord: cc.Node = null;
    private EncWord: cc.Sprite = null;
    private bottom: cc.Node = null;
    private VecLuoDiBg: cc.Node = null;


    /**横屏 */
    private HozLuoDiBg: cc.Node = null;
    private HozboardBg: cc.Node = null;
    private HozBoard: cc.Node = null;
    private HozStreamRoot: cc.Node = null;
    private hozFinger: cc.Node = null;



    protected onLoad(): void {
        LoadResMgr.ins.loadStreamItemPrefab('Prefab/StreamItem');
        LoadResMgr.ins.loadBgImageRes(`picture/${GamePlayMgr.ins.language}`);
        GamePlayMgr.ins.getLanAnswerWords(GamePlayMgr.ins.language);

        /**竖屏 */
        this.boardBg = this.vec.getChildByName('middle').getChildByName('boardBg');
        this.StreamRoot = this.boardBg.getChildByName('StreamRoot');
        this.Board = this.boardBg.getChildByName('Board');
        this.vecFinger = this.boardBg.getChildByName('vecFinger');
        this.vecWaring = this.vec.getChildByName('vecWaring');
        this.EncouragingWord = this.vec.getChildByName('EncouragingWord');
        this.EncWord = this.EncouragingWord.getChildByName('EncWord').getComponent(cc.Sprite);
        this.bottom = this.vec.getChildByName('bottom');
        this.VecLuoDiBg = this.node.getChildByName('VecLuoDiBg');

        /**横屏 */
        this.HozLuoDiBg = this.node.getChildByName('HozLuoDiBg');
        this.HozboardBg = this.hoz.getChildByName('left').getChildByName('boardBg');
        this.HozBoard = this.HozboardBg.getChildByName('Board');
        this.HozStreamRoot = this.HozboardBg.getChildByName('HozStreamRoot');
        this.hozFinger = this.HozboardBg.getChildByName('hozFinger');

        /**横屏 */
        cc.view.setResizeCallback(this.canvasChange.bind(this));
        this.canvasChange();
    }


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
            this.vec.active = true;
            this.hoz.active = false;
            this.initScreenData(true);
            // 默认设置行和列
            GamePlayMgr.ins.levelSize = { row: 6, col: 6 };
            this.screnType = true;
        } else {
            // 横屏
            cc.view.setDesignResolutionSize(1920, 1080, cc.ResolutionPolicy.FIXED_HEIGHT);
            this.hoz.active = true;
            this.vec.active = false;
            this.initScreenData(false);
            // 默认设置行和列
            GamePlayMgr.ins.levelSize = { row: 6, col: 6 };
            this.screnType = false;
        }
    }

    private initScreenData(type: boolean): void {
        if (type) {
            // 竖屏
            this.titleLyoutNode = this.titleLayout;
            this.wordBoard = this.Board;
            this.AllStreamRoot = this.StreamRoot;
            this.AllFinger = this.vecFinger;
        } else {
            // 横屏
            this.titleLyoutNode = this.HozTitleLayout;
            this.wordBoard = this.HozBoard;
            this.AllStreamRoot = this.HozStreamRoot;
            this.AllFinger = this.hozFinger;
        }
        this.initData();
    }

    private initData(): void {
        this.AllFinger.active = false;
        this.vecWaring.active = false;
        this.VecLuoDiBg.active = false;
        this.HozLuoDiBg.active = false;

        this.wordBoard.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.wordBoard.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.wordBoard.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.wordBoard.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        /**竖屏 */
        this.createGridd();
        this.createPlate();
        this.createAnswer();
        this.btnAnim();

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

        const bgWidth: number = this.wordBoard.width;
        const bgHeight: number = this.wordBoard.height;

        // 更新item大小
        GamePlayMgr.ins.updateItemSize(bgWidth, bgHeight, GamePlayMgr.ins.levelSize.row, GamePlayMgr.ins.levelSize.col);

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
        this.wordBoard.removeAllChildren();
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
                    this.wordBoard.addChild(ItemWordNode);
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
            this.wordBoard.setContentSize(this.wordBoard.width, this.wordBoard.height);
        } else if (row < col) {
            let itemWidth: number = Math.floor((this.wordBoard.width - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
            let height: number = (GameItemConfig.padding * 2) + ((row - 1) * GameItemConfig.spacingY) + (itemWidth * row);
            this.wordBoard.setContentSize(this.wordBoard.width, height);
        } else if (row > col) {
            let itemWidth: number = Math.floor((this.wordBoard.width - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);
            let width: number = (GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingY + (itemWidth * col);
            this.wordBoard.setContentSize(width, this.wordBoard.height);
        }
    }

    private createAnswer(): void {
        this.titleLyoutNode.removeAllChildren();
        const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
        for (let i = 0; i < lanAnswer.length; i++) {
            LoadResMgr.ins.loadItemPrefab('Prefab/ItemAnswerWord', (item: cc.Node) => {
                const ItemWordNode: cc.Node = item;
                this.titleLyoutNode.addChild(ItemWordNode);
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
            this.AllStreamRoot.addChild(item);
            const touchUIPos: cc.Vec2 = event.getLocation();
            // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
            const localPos: cc.Vec2 = this.wordBoard.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
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
        this.StopFingerAnim();
    }

    private onTouchMove(event: cc.Event.EventTouch): void {
        const touchUIPos: cc.Vec2 = event.getLocation();
        // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
        const localPos: cc.Vec2 = this.wordBoard.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
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
                    this.palyAncWordAnim();
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
        this.beginFingerAnim();
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
        // 划词错误
        this.vecWaringAnim();
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
            this.AllStreamRoot.addChild(item);

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
            this.beginFingerAnim();
        });
    }

    private dealAnswerBoard(answer: string): void {
        const answer1: string = GamePlayMgr.ins.reverseString(answer);
        const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);
        const LanNotFinishAnswer: string[] = GamePlayMgr.ins.getLanNotFinishAnswer(GamePlayMgr.ins.language);
        let answerStr: string = null;

        for (let i = 0; i < this.titleLyoutNode.children.length; i++) {
            const data: ItemAnswerWord = this.titleLyoutNode.children[i].getComponent(ItemAnswerWord);
            if (!data.isFillState && answer === data.answerCn || answer1 === data.answerCn) {
                data.isFillState = true;
                data.setWordColor('#FFE600');
                LanFinishAnswer.push(data.answerCn);
                answerStr = data.answerCn;
            }
        }

        for (let j = 0; j < LanNotFinishAnswer.length; j++) {
            if (LanNotFinishAnswer[j] === answerStr) {
                LanNotFinishAnswer.splice(j, 1);
            }
        }
    }

    private StopFingerAnim(): void {
        cc.Tween.stopAllByTarget(this.AllFinger);
        this.fingerStreamItemNode.removeFromParent();
        this.AllFinger.active = false;
    }

    private beginFingerAnim(): void {
        this.scheduleOnce(this.setVecFinger, 2);
    }

    private setVecFinger(): void {
        const answer: Map<string, IFillWord[]> = GamePlayMgr.ins.getLanAnswerWordsPos(GamePlayMgr.ins.language);
        const LanNotFinishAnswer: string[] = GamePlayMgr.ins.getLanNotFinishAnswer(GamePlayMgr.ins.language);
        if (!LanNotFinishAnswer.length) {
            return;
        }
        const resultWord: IFillWord[] = answer.get(LanNotFinishAnswer[0]);
        const firstWord: { x: number; y: number; } = resultWord[0].point;
        const endWord: { x: number; y: number; } = resultWord[resultWord.length - 1].point;

        // 手指移动动画
        const firstItemWord: ItemWord = GamePlayMgr.ins.mainModeItems[firstWord.x][firstWord.y];
        const endItemWord: ItemWord = GamePlayMgr.ins.mainModeItems[endWord.x][endWord.y];
        const startPos: cc.Vec2 = firstItemWord.WordItemPos;
        const endPos: cc.Vec2 = endItemWord.WordItemPos;

        let dire: number = 0;
        if (firstItemWord.WordItemPos.x === endItemWord.WordItemPos.x) {
            if ((endItemWord.WordItemPos.y - firstItemWord.WordItemPos.y) > 0) {
                // 上 
                dire = 0;
            } else {
                // 下
                dire = 1;
            }
        }

        if (firstItemWord.WordItemPos.y === endItemWord.WordItemPos.y) {
            if ((endItemWord.WordItemPos.x - firstItemWord.WordItemPos.x) > 0) {
                // 右 
                dire = 2;
            } else {
                // 左
                dire = 3;
            }
        }
        const colorIdx: number = GamePlayMgr.ins.getWordColorRandom();

        cc.Tween.stopAllByTarget(this.AllFinger);

        cc.tween(this.AllFinger)
            .set({ position: new cc.Vec3(startPos.x, startPos.y, 0) })
            .set({ active: true })
            .call(() => {
                this.animInitData(resultWord);
                this.fingerStreamItemNode = cc.instantiate(LoadResMgr.ins.StreamItemMap.get('StreamItem'));
                this.AllStreamRoot.addChild(this.fingerStreamItemNode);
                const StreamItemComp: StreamItem = this.fingerStreamItemNode.getComponent(StreamItem);
                StreamItemComp.setPos(firstItemWord.WordItemPos);
                StreamItemComp.setBgColor(colorIdx);
            })
            .delay(0.2)
            .to(1, { position: new cc.Vec3(endPos.x, endPos.y, 0) }, {
                onUpdate: (target: cc.Node, ratio: number) => {
                    if (dire === 0) {
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().y >= data.y) {
                                this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, data.item.WordItemPos);
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }
                    } else if (dire === 1) {
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().y <= data.y) {
                                this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, data.item.WordItemPos);
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }

                    } else if (dire === 2) {
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().x >= data.x) {
                                this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, data.item.WordItemPos);
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }

                    } else if (dire === 3) {
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().x <= data.x) {
                                this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, data.item.WordItemPos);
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            })
            .delay(1)
            .call(() => {
                this.AllFinger.active = false;
                this.fingerStreamItemNode.removeFromParent();
            })
            .union()
            .repeatForever()
            .start();
    }

    private animInitData(resultWord: IFillWord[]): void {
        this.wordPos.length = 0;

        if (resultWord) {
            for (let idx = 1; idx < resultWord.length; idx++) {
                const itemComp: ItemWord = GamePlayMgr.ins.mainModeItems[resultWord[idx].point.x][resultWord[idx].point.y];
                const wordInfo: { x: number, y: number, item: ItemWord } = {
                    x: itemComp.WordItemPos.x,
                    y: itemComp.WordItemPos.y,
                    item: itemComp
                }
                this.wordPos.push(wordInfo);
            }
        }
    }

    private lineAnim(StreamItemNode: cc.Node, firstWordPos: cc.Vec2, endWordPos: cc.Vec2): void {
        const result: { angle: number; distance: number; } = GamePlayMgr.ins.checkPoints(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
        if (result) {
            const StreamItemComp: StreamItem = StreamItemNode.getComponent(StreamItem);
            StreamItemComp.setSize(result.distance);
            StreamItemComp.setNodeRotation(result.angle);
            StreamItemComp.setAnglePos(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
        }
    }

    private vecWaringAnim(): void {
        cc.Tween.stopAllByTarget(this.vecWaring);
        cc.tween(this.vecWaring)
            .set({ opacity: 0 })
            .set({ active: true })
            .to(0.2, { opacity: 255 })
            .to(0.2, { opacity: 0 })
            .to(0.2, { opacity: 255 })
            .to(0.2, { opacity: 0 })
            .call(() => {
                this.vecWaring.active = false;
                this.vecWaring.opacity = 255;
            })
            .start();
    }

    private palyAncWordAnim(): void {
        const picIdx: number = GamePlayMgr.ins.rncWordAnimIdx[GamePlayMgr.ins.rncWordAnimIdx.length - 1] + 1;
        GamePlayMgr.ins.rncWordAnimIdx.push(picIdx);
        const pic: cc.SpriteFrame = LoadResMgr.ins.EncWordMap.get(picIdx);
        if (pic) {
            this.EncWord.spriteFrame = pic;
        }
        cc.tween(this.EncouragingWord)
            .set({ scale: 0 })
            .set({ opacity: 255 })
            .set({ active: true })
            .to(0.2, { scale: 1 })
            .delay(1)
            .to(0.2, { opacity: 0 })
            .call(() => {
                this.EncouragingWord.active = false;
                if (GamePlayMgr.ins.rncWordAnimIdx.length === 4) {
                    this.entryLuoDi();
                }
            })
            .start();
    }

    private btnAnim(): void {
        const btnDown: cc.Node = this.bottom.getChildByName('btnDown');
        const playLabel: cc.Label = btnDown.getChildByName('playLabel').getComponent(cc.Label);
        const lanData = DataManager[GamePlayMgr.ins.language];
        playLabel.string = lanData.CTA;
        cc.tween(btnDown)
            .set({ scale: 0.8 })
            .to(0.5, { scale: 1 })
            .to(0.5, { scale: 0.8 })
            .union()
            .repeatForever()
            .start();
    }

    private entryLuoDi(): void {
        this.vec.active = false;
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
    }

    //#endregion


    protected onDestroy(): void {

    }
}
