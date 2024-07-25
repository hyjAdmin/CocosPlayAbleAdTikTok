/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-23 17:55:32
 * @LastEditTime: 2024-07-25 16:26:31
 */

import { GameItemConfig, IFillWord, IItemInfo, IPoint } from "../manage/GamePlayMgr";
import LoadResMgr from "../manage/LoadResMgr";
import ItemAnswerWord from "../Prefab/ItemAnswerWord";
import ItemWord from "../Prefab/ItemWord";
import StreamItem from "../Prefab/StreamItem";
import GamePlayMgr from '../manage/GamePlayMgr';
import { DataManager } from "../manage/DataManager";


const { ccclass, property } = cc._decorator;

@ccclass
export default class VecMainUI extends cc.Component {
    @property({
        type: cc.Node,
        displayName: '竖屏节点 top'
    })
    top: cc.Node = null;

    @property({
        type: cc.Node,
        displayName: '竖屏节点 middle'
    })
    middle: cc.Node = null;

    @property({
        type: cc.Node,
        displayName: '竖屏节点 bottom'
    })
    bottom: cc.Node = null;

    @property({
        type: cc.Node,
        displayName: '竖屏答案词'
    })
    private titleLayout: cc.Node = null;


    @property({
        type: cc.AudioSource,
        displayName: "FaildNode",
    })
    FaildNode: cc.AudioSource = null;


    @property({
        type: cc.AudioSource,
        displayName: "RewardNode",
    })
    RewardNode: cc.AudioSource = null;


    /**在创建关卡的时候需要遍历棋盘，就在那个时候一起创建，避免重复一次遍历: 关卡数据 */
    public wordItemInfo: IItemInfo[][] = [];
    /** 所有节点 用坐标去取 items[x][y] */
    public mainModeItems: ItemWord[][] = [];
    private wordPos: { x: number, y: number, item: ItemWord }[] = [];
    private fingerStreamItemNode: cc.Node = null;
    private firstPos: IPoint = null;
    private lineAngle: number = null;
    private twoFillPosArr: IPoint[][] = [];
    private currLineWord1: string = null;
    private currLineWord2: string = null;
    /**item 尺寸 */
    private itemWordSize: { width: number, height: number } = {} as any;
    /**单词位置坐标, 坐标索引 */
    public wordPosIndex: { pos: { x: number, y: number }, posIdx: { x: number, y: number } }[] = [];
    public validAngles: number[] = [0, 90, 180, -90, -180];
    /**方块坐标：标记矩阵中每个格子位置处的坐标点 */
    public positionMap: cc.Vec2[][] = [];
    private firstWordPos: IPoint = {} as any;

    private fixAngle: number = null;
    private fixPosx: number = null;
    private fixPosy: number = null;

    private StreamItemNode: cc.Node = null;
    private boardBg: cc.Node = null;
    private StreamRoot: cc.Node = null;
    private Board: cc.Node = null;
    private vecFinger: cc.Node = null;
    private vecWaring: cc.Node = null;
    private EncouragingWord: cc.Node = null;
    private EncWord: cc.Sprite = null;

    public initData(): void {
        this.boardBg = this.middle.getChildByName('boardBg');
        this.StreamRoot = this.boardBg.getChildByName('StreamRoot');
        this.Board = this.boardBg.getChildByName('Board');
        this.vecFinger = this.boardBg.getChildByName('vecFinger');
        this.vecWaring = this.node.getChildByName('vecWaring');
        this.EncouragingWord = this.node.getChildByName('EncouragingWord');
        this.EncWord = this.EncouragingWord.getChildByName('EncWord').getComponent(cc.Sprite);

        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.Board.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.Board.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        GamePlayMgr.ins.eventManager.on('wordSuccess', (data) => {
            this.wordSuccess();
        });

        this.vecFinger.active = false;
        this.vecWaring.active = false;

        this.createAnswer();
        this.createGridd();
        this.createPlate();
        this.refreshData();
        this.btnAnim();
        this.calculateCornersAngles();
    }

    private refreshData(): void {
        if (GamePlayMgr.ins.mode === 3) {
            cc.tween(this.boardBg)
                .set({ scale: 0.9 })
                .to(1, { scale: 1 })
                .to(1, { scale: 0.9 })
                .union()
                .repeatForever()
                .start();
        }
    }

    /*****************************************************************  关卡生成  *******************************************************************************/

    //#region 

    /**
     * @description: 生成网格
     * @return {*}
     */
    private createGridd(): void {
        // 先清除后设置
        this.positionMap.length = 0;

        // 设置背景尺寸
        this.setNodeBgSize(GamePlayMgr.ins.levelSize.row, GamePlayMgr.ins.levelSize.col);

        const bgWidth: number = this.Board.width;
        const bgHeight: number = this.Board.height;

        // 更新item大小
        this.updateItemSize(bgWidth, bgHeight, GamePlayMgr.ins.levelSize.row, GamePlayMgr.ins.levelSize.col);

        // 以左下角为原点,计算第一个方块的位置
        const beginX: number = -(bgWidth / 2) + GameItemConfig.padding + (this.itemWordSize.width / 2);
        const beginY: number = -(bgHeight / 2) + GameItemConfig.padding + (this.itemWordSize.height / 2);

        // 从左到右计算每一列方块的位置
        for (let c = 0; c < GamePlayMgr.ins.levelSize.row; c++) {
            let columnSet: cc.Vec2[] = [];
            let y: number = beginY + c * (this.itemWordSize.height + GameItemConfig.padding);
            // 从下到上计算该列的每一个方块的位置
            for (let r = 0; r < GamePlayMgr.ins.levelSize.col; r++) {
                let x: number = beginX + r * (this.itemWordSize.width + GameItemConfig.padding);
                columnSet.push(new cc.Vec2(x, y));
            }
            this.positionMap.push(columnSet);
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
                    this.mainModeItems.push(new Array(GamePlayMgr.ins.levelSize.col));
                    this.wordItemInfo.push(new Array(GamePlayMgr.ins.levelSize.col));
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
                    this.wordItemInfo[c][r] = charItemInfo;
                    this.mainModeItems[c][r] = itemComp;

                    itemComp.initData({ position: this.positionMap[r][c], size: this.itemWordSize, point: { x: c, y: r }, screnType: true });
                    let wordPosIdx: { pos: { x: number, y: number }, posIdx: { x: number, y: number } } = { pos: { x: 0, y: 0 }, posIdx: { x: 0, y: 0 } };
                    wordPosIdx.pos.x = this.positionMap[r][c].x;
                    wordPosIdx.pos.y = this.positionMap[r][c].y;
                    wordPosIdx.posIdx.x = c;
                    wordPosIdx.posIdx.y = r;
                    this.wordPosIndex.push(wordPosIdx);
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
            this.Board.setContentSize(this.Board.width, this.Board.height);
        } else if (row < col) {
            let itemWidth: number = Math.floor((this.Board.width - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
            let height: number = (GameItemConfig.padding * 2) + ((row - 1) * GameItemConfig.spacingY) + (itemWidth * row);
            this.Board.setContentSize(this.Board.width, height);
        } else if (row > col) {
            let itemWidth: number = Math.floor((this.Board.width - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);
            let width: number = (GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingY + (itemWidth * col);
            this.Board.setContentSize(width, this.Board.height);
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


    /**
     * @description: 更新item大小
     * @param {number}
     * @return {*}
     */
    private updateItemSize(BoardWidth: number, BoardHeight: number, row: number, col: number) {
        let itemWidth: number = null;
        let itemHeight: number = null;
        if (row === col) {
            itemWidth = Math.floor((BoardWidth - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
            itemHeight = Math.floor((BoardHeight - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);

        } else if (row < col) {
            itemWidth = Math.floor((BoardWidth - ((GameItemConfig.padding * 2) + (col - 1) * GameItemConfig.spacingX)) / col);
        } else if (row > col) {
            itemWidth = Math.floor((BoardWidth - ((GameItemConfig.padding * 2) + (row - 1) * GameItemConfig.spacingX)) / row);
        }
        this.itemWordSize = { width: itemWidth, height: itemHeight };
    }

    /**
     * @description: 获取当前触摸选中的单词 item
     * @param {cc} localPos
     * @return {*}
     */
    private getWordPosIdx(localPos: cc.Vec2): IPoint {
        if (this.wordPosIndex.length) {
            for (let i = 0; i < this.wordPosIndex.length; i++) {
                let itemWord: {
                    pos: {
                        x: number;
                        y: number;
                    };
                    posIdx: {
                        x: number;
                        y: number;
                    };
                } = this.wordPosIndex[i];
                const minX: number = itemWord.pos.x - (this.itemWordSize.width / 2);
                const maxX: number = itemWord.pos.x + (this.itemWordSize.width / 2);
                const minY: number = itemWord.pos.y - (this.itemWordSize.height / 2);
                const maxY: number = itemWord.pos.y + (this.itemWordSize.height / 2);
                if (localPos.x >= minX && localPos.x <= maxX) {
                    if (localPos.y >= minY && localPos.y <= maxY) {
                        return itemWord.posIdx;
                    }
                }
            }
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
            const pos: IPoint = this.getWordPosIdx(localPos);
            if (pos) {
                // 是否已经填充了字符
                const itemComp: ItemWord = this.mainModeItems[pos.x][pos.y];
                const WordItemPos: cc.Vec2 = itemComp.WordItemPos;

                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setPos(WordItemPos);

                GamePlayMgr.ins.colorIdx = GamePlayMgr.ins.getWordColorRandom();
                StreamItemComp.setBgColor(GamePlayMgr.ins.colorIdx);
                this.firstWordPos = { x: WordItemPos.x, y: WordItemPos.y };
                GamePlayMgr.ins.firstWordPos = { x: pos.x, y: pos.y };
                this.wordState(itemComp, true);
                GamePlayMgr.ins.finishGraphicWordPos.push(pos);
                this.firstPos = pos;
                if (GamePlayMgr.ins.mode === 1 || GamePlayMgr.ins.mode === 2) {
                    const miscIdx: number = GamePlayMgr.ins.getPalyClickMusicIdx();
                    GamePlayMgr.ins.palyClickMusic(miscIdx);
                    itemComp.clickMicIdx = miscIdx;
                }
            }
        });
        this.StopFingerAnim();
    }

    private onTouchMove(event: cc.Event.EventTouch): void {
        const touchUIPos: cc.Vec2 = event.getLocation();
        // 将一个 UI 节点世界坐标系下点转换到另一个 UI 节点 (局部) 空间坐标系，这个坐标系以锚点为原点
        const localPos: cc.Vec2 = this.Board.convertToNodeSpaceAR(cc.v2(touchUIPos.x, touchUIPos.y));
        const pos: IPoint = this.getWordPosIdx(localPos);

        if (!pos || !this.firstPos) {
            return;
        }

        if (this.firstPos?.x === pos?.x && this.firstPos?.y === pos?.y) {
            return;
        }

        const itemComp: ItemWord = this.mainModeItems[pos.x][pos.y];
        let result: { angle: number; distance: number; } = {} as any;
        const WordItemPos: cc.Vec2 = cc.v2(Math.floor(localPos.x), Math.floor(localPos.y));

        const firstResult: { angle: number; distance: number; } = this.checkPoints(this.firstWordPos.x, this.firstWordPos.y, itemComp.WordItemPos.x, itemComp.WordItemPos.y);
        if (firstResult) {
            GamePlayMgr.ins.slope = GamePlayMgr.ins.calculateSlope(cc.v2(this.firstWordPos.x, this.firstWordPos.y), itemComp.WordItemPos);
            const slope: number = GamePlayMgr.ins.slope;
            let slopePosY: number = null;
            if (slope) {
                slopePosY = GamePlayMgr.ins.calculateProjection(slope, cc.v2(this.firstWordPos.x, this.firstWordPos.y), WordItemPos);
            }
            const dealMoveJoins: number = this.dealMoveJoin(itemComp);
            if (!dealMoveJoins) {
                this.fixPosx = WordItemPos.x;
                if (slopePosY) {
                    this.fixPosy = slopePosY;
                } else {
                    this.fixPosy = itemComp.WordItemPos.y;
                }
            }

            if (dealMoveJoins === 3 || dealMoveJoins === 4) {
                this.fixPosy = itemComp.WordItemPos.y;
                this.fixPosx = WordItemPos.x;
            }

            if (dealMoveJoins === 1 || dealMoveJoins === 2) {
                this.fixPosx = itemComp.WordItemPos.x;
                this.fixPosy = WordItemPos.y;
            }

            if (this.fixAngle !== Math.floor(firstResult?.angle)) {
                this.fixAngle = Math.floor(firstResult?.angle)
            }
            const distance: number = GamePlayMgr.ins.calculateDistance(this.firstWordPos.x, this.firstWordPos.y, WordItemPos.x, WordItemPos.y);
            result = { angle: this.fixAngle, distance: distance };
        }

        if (result && result.distance) {
            if (this.lineAngle !== Math.floor(result?.angle)) {
                // 另一条路线
                this.lineAngle = Math.floor(result?.angle);
                const removedElements: IPoint[] = GamePlayMgr.ins.removeAfterIndex(GamePlayMgr.ins.finishGraphicWordPos, 0);
                for (let idx = 0; idx < removedElements.length; idx++) {
                    const itemCompRemove: ItemWord = this.mainModeItems[removedElements[idx].x][removedElements[idx].y];
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
                        const itemCompRemove: ItemWord = this.mainModeItems[twoPot[i].x][twoPot[i].y];
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
                StreamItemComp.setAnglePos(this.firstWordPos.x, this.firstWordPos.y, this.fixPosx, this.fixPosy);
                const existingIndex: number = GamePlayMgr.ins.finishGraphicWordPos.findIndex(coord => this.equalsVec2(coord, pos));
                if (existingIndex !== -1) {
                    // 如果坐标已经存在，删除之后的所有坐标
                    const removedElements: IPoint[] = GamePlayMgr.ins.removeAfterIndex(GamePlayMgr.ins.finishGraphicWordPos, existingIndex);
                    // 移除索引 existingIndex 之后的所有元素
                    for (let idx = 0; idx < removedElements.length; idx++) {
                        const itemCompRemove: ItemWord = this.mainModeItems[removedElements[idx].x][removedElements[idx].y];
                        this.wordState(itemCompRemove, false);
                    }
                    if (GamePlayMgr.ins.mode === 1 || GamePlayMgr.ins.mode === 2) {
                        const miscIdx: number = itemComp.clickMicIdx;
                        if (miscIdx != null && removedElements.length) {
                            GamePlayMgr.ins.palyClickMusic(miscIdx);
                        }
                    }
                } else {
                    // 否则添加新的坐标
                    this.wordState(itemComp, true);
                    GamePlayMgr.ins.finishGraphicWordPos.push(pos);
                    if (GamePlayMgr.ins.mode === 1 || GamePlayMgr.ins.mode === 2) {
                        if (itemComp.clickMicIdx === null) {
                            const miscIdx: number = GamePlayMgr.ins.getPalyClickMusicIdx();
                            GamePlayMgr.ins.palyClickMusic(miscIdx);
                            itemComp.clickMicIdx = miscIdx;
                        }
                    }
                }
            }
        }
    }

    private dealMoveJoin(endItemWord: ItemWord): number {
        let dire: number = 0;
        if (this.firstWordPos.x === endItemWord.WordItemPos.x) {
            if ((endItemWord.WordItemPos.y - this.firstWordPos.y) > 0) {
                // 上 
                dire = 1;
            } else {
                // 下
                dire = 2;
            }
        }

        if (this.firstWordPos.y === endItemWord.WordItemPos.y) {
            if ((endItemWord.WordItemPos.x - this.firstWordPos.x) > 0) {
                // 右 
                dire = 3;
            } else {
                // 左
                dire = 4;
            }
        }

        if (this.firstWordPos.x !== endItemWord.WordItemPos.x && this.firstWordPos.y !== endItemWord.WordItemPos.y) {
        }
        return dire;
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
                const itemComp: ItemWord = this.mainModeItems[item.x][item.y];
                notAnswerWord.push(itemComp.itemChar);
            });

            const finRes: IPoint = GamePlayMgr.ins.finishGraphicWordPos[GamePlayMgr.ins.finishGraphicWordPos.length - 1];
            GamePlayMgr.ins.endWordPos = { x: finRes.x, y: finRes.y };

            const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
            const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);

            const answer1: string = GamePlayMgr.ins.reverseString(notAnswerWord.join(''));
            const answer2: string = notAnswerWord.join('');

            this.currLineWord1 = answer1;
            this.currLineWord2 = answer2;

            let already: boolean = false;

            if (LanFinishAnswer.indexOf(answer1) !== -1) {
                already = true;
            }

            if (LanFinishAnswer.indexOf(answer2) !== -1) {
                already = true;
            }

            if (!already) {
                if (lanAnswer.indexOf(answer1) !== -1 || lanAnswer.indexOf(answer2) !== -1) {
                    // 成功
                    GamePlayMgr.ins.answer2 = answer2;
                    GamePlayMgr.ins.eventManager.emit('wordSuccess', {});
                    this.currLineWord1 = null;
                    this.currLineWord2 = null;
                    this.RewardNode.play();
                } else {
                    this.clearMoveData();
                }
            } else {
                this.clearMoveData();
            }
        }
        this.firstPos = null;
        this.fixAngle = null;
        this.fixPosx = null;
        this.fixPosy = null;
        this.twoFillPosArr.length = 0;
        GamePlayMgr.ins.finishGraphicWordPos.length = 0;
        this.beginFingerAnim();
        GamePlayMgr.ins.palyWordMisc = 0;
    }

    /**
     * @description: 计算 item 的四个角与中心点的角度值
     * @return {*}
     */
    public calculateCornersAngles() {
        const halfWidth = this.itemWordSize.width / 2;
        const halfHeight = this.itemWordSize.height / 2;

        const center = new cc.Vec2(0, 0);
        const topLeft = new cc.Vec2(-halfWidth, halfHeight);
        const topRight = new cc.Vec2(halfWidth, halfHeight);
        const bottomLeft = new cc.Vec2(-halfWidth, -halfHeight);
        const bottomRight = new cc.Vec2(halfWidth, -halfHeight);

        const angles = {
            topLeft: this.calculateAngle(center.x, center.y, topLeft.x, topLeft.y),
            topRight: this.calculateAngle(center.x, center.y, topRight.x, topRight.y),
            bottomLeft: this.calculateAngle(center.x, center.y, bottomLeft.x, bottomLeft.y),
            bottomRight: this.calculateAngle(center.x, center.y, bottomRight.x, bottomRight.y)
        };
        this.validAngles.push(Math.floor(angles.topLeft), Math.floor(angles.topRight), Math.floor(angles.bottomLeft), Math.floor(angles.bottomRight));
    }

    /**
     * @description: 计算从点 (x1, y1) 到点 (x2, y2) 的旋转角度
     * @return {*}
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    public calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const radians = Math.atan2(dy, dx);
        const degrees = GamePlayMgr.ins.radiansToDegrees(radians);
        return degrees;
    }

    /**
     * @description: 示例用法
     * @return {*}
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    public checkPoints(x1: number, y1: number, x2: number, y2: number): {
        angle: number;
        distance: number;
    } {

        const angle: number = this.calculateAngle(x1, y1, x2, y2);

        if (this.isValidAngle(angle)) {
            const distance: number = GamePlayMgr.ins.calculateDistance(x1, y1, x2, y2);
            let result: { angle: number, distance: number } = {
                angle: angle,
                distance: distance
            }
            return result;
        } else {
            return null;
        }
    }


    /**
     * @description: 判断给定的角度是否有效
     * @return {*}
     * @param {number} angle
     */
    public isValidAngle(angle: number): boolean {
        angle = Math.floor(angle);
        // 使用 modulo 运算来处理 angle 为负数的情况
        angle = ((angle % 360) + 360) % 360;
        return this.validAngles.includes(angle) || this.validAngles.includes(angle - 360);
    }

    //#endregion

    /*****************************************************************  单词处理  *******************************************************************************/

    //#region

    private wordSuccess(): void {
        this.dealWordColor(true);
        if (!GamePlayMgr.ins.screnType) {
            this.otherWordSuccess();
        }
        if (GamePlayMgr.ins.saveWordColor.indexOf(GamePlayMgr.ins.colorIdx) === -1) {
            GamePlayMgr.ins.saveWordColor.push(GamePlayMgr.ins.colorIdx);
        }
        this.dealAnswerBoard(GamePlayMgr.ins.answer2);
        this.palyAncWordAnim();
    }

    private otherWordSuccess(): void {
        const firstWordComp: ItemWord = this.mainModeItems[GamePlayMgr.ins.firstWordPos.x][GamePlayMgr.ins.firstWordPos.y];
        const endWordComp: ItemWord = this.mainModeItems[GamePlayMgr.ins.endWordPos.x][GamePlayMgr.ins.endWordPos.y];


        let firstWordPos: cc.Vec2 = null;
        let endWordPos: cc.Vec2 = null;
        if (firstWordComp) {
            firstWordPos = firstWordComp.WordItemPos;
        }

        if (endWordComp) {
            endWordPos = endWordComp.WordItemPos;
        }

        if (!firstWordPos || !endWordPos) {
            return;
        }

        LoadResMgr.ins.loadItemPrefab('Prefab/StreamItem', (item: cc.Node) => {
            this.StreamRoot.addChild(item);

            const StreamItemComp: StreamItem = item.getComponent(StreamItem);
            StreamItemComp.setPos(firstWordPos);

            StreamItemComp.setBgColor(GamePlayMgr.ins.colorIdx);
            const saveWordColor: number[] = GamePlayMgr.ins.saveWordColor;
            if (saveWordColor.indexOf(GamePlayMgr.ins.colorIdx) === -1) {
                GamePlayMgr.ins.saveWordColor.push(GamePlayMgr.ins.colorIdx);
            }

            const result: { angle: number; distance: number; } = this.checkPoints(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            if (result) {
                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setSize(result.distance);
                StreamItemComp.setNodeRotation(result.angle);
                StreamItemComp.setAnglePos(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            }
        });
    }

    private palyAncWordAnim(): void {
        const picIdx: number = GamePlayMgr.ins.rncWordAnimIdx[GamePlayMgr.ins.rncWordAnimIdx.length - 1] + 1;
        if (GamePlayMgr.ins.rncWordAnimIdx.indexOf(picIdx) === -1) {
            GamePlayMgr.ins.rncWordAnimIdx.push(picIdx);
        }

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
                const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);
                if (LanFinishAnswer.length >= 4) {
                    GamePlayMgr.ins.eventManager.emit('entryLuoDi', { state: true });
                }
            })
            .start();
    }

    private clearMoveData(): void {
        this.StreamItemNode.removeFromParent();
        this.firstWordPos = {} as any;
        this.firstPos = null;
        this.twoFillPosArr.length = 0;

        let state: boolean = false;
        const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
        if (this.currLineWord1 === lanAnswer[0] || lanAnswer[0] === this.currLineWord2) {
            state = true;
        } else {
            state = false;
        }

        GamePlayMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
            const itemComp: ItemWord = this.mainModeItems[item.x][item.y];
            this.wordState(itemComp, state);
            itemComp.clickMicIdx = null;
        });

        this.currLineWord1 = null;
        this.currLineWord2 = null;

        // 划词错误
        this.vecWaringAnim();
    }

    private vecWaringAnim(): void {
        this.FaildNode.play();
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

    private dealWordColor(state: boolean): void {
        GamePlayMgr.ins.finishGraphicWordPos.forEach((item: IPoint, idx: number, arr: IPoint[]) => {
            const itemComp: ItemWord = this.mainModeItems[item.x][item.y];
            itemComp.clickMicIdx = null;
            if (state) {
                itemComp.isAnswerFills = true;
            }
            this.wordState(itemComp, state);
        });
        const itemIPoint: IPoint = GamePlayMgr.ins.finishGraphicWordPos[GamePlayMgr.ins.finishGraphicWordPos.length - 1];
        const itemComp: ItemWord = this.mainModeItems[itemIPoint.x][itemIPoint.y];
        if (itemComp) {
            let StreamItemNode: cc.Node = null;
            if (!this.StreamItemNode) {
                StreamItemNode = cc.instantiate(LoadResMgr.ins.StreamItemMap.get('StreamItem'));
            } else {
                StreamItemNode = this.StreamItemNode;
            }
            const StreamItemComp: StreamItem = StreamItemNode.getComponent(StreamItem);
            const distance: number = GamePlayMgr.ins.calculateDistance(this.firstWordPos.x, this.firstWordPos.y, itemComp.WordItemPos.x, itemComp.WordItemPos.y);
            StreamItemComp.setSize(distance);
            StreamItemComp.setAnglePos(this.firstWordPos.x, this.firstWordPos.y, itemComp.WordItemPos.x, itemComp.WordItemPos.y);
        }
    }

    /**
     * @description: 清除关卡数据
     * @return {*}
     */
    private clearLevelData(): void {
        this.mainModeItems.length = 0;
        this.wordItemInfo.length = 0;
        GamePlayMgr.ins.finishGraphicWordPos.length = 0;
    }

    private dealDefault(): void {
        const answer: Map<string, IFillWord[]> = GamePlayMgr.ins.getLanAnswerWordsPos(GamePlayMgr.ins.language);
        const lanAnswer: string[] = GamePlayMgr.ins.getLanAnswer(GamePlayMgr.ins.language);
        const resultWord: IFillWord[] = answer.get(lanAnswer[0]);

        const firstWord: { x: number; y: number; } = resultWord[0].point;
        const endWord: { x: number; y: number; } = resultWord[resultWord.length - 1].point;

        const firstWordComp: ItemWord = this.mainModeItems[firstWord.x][firstWord.y];
        const endWordComp: ItemWord = this.mainModeItems[endWord.x][endWord.y];


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

            StreamItemComp.setBgColor(GamePlayMgr.ins.defaultColorIdx);
            const saveWordColor: number[] = GamePlayMgr.ins.saveWordColor;
            if (saveWordColor.indexOf(GamePlayMgr.ins.defaultColorIdx) === -1) {
                GamePlayMgr.ins.saveWordColor.push(GamePlayMgr.ins.defaultColorIdx);
            }

            const result: { angle: number; distance: number; } = this.checkPoints(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            if (result) {
                const StreamItemComp: StreamItem = item.getComponent(StreamItem);
                StreamItemComp.setSize(result.distance);
                StreamItemComp.setNodeRotation(result.angle);
                StreamItemComp.setAnglePos(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
            }
            for (let i = 0; i < resultWord.length; i++) {
                const data: IFillWord = resultWord[i];
                const itemComp: ItemWord = this.mainModeItems[data.point.x][data.point.y];
                itemComp.isAnswerFills = true;
                this.wordState(itemComp, true);
            }
            this.dealAnswerBoard(lanAnswer[0]);
            // 手指指引
            this.beginFingerAnim();
        });
    }

    private wordState(itemComp: ItemWord, state: boolean): void {
        if (state) {
            itemComp.setWordColor('#FFFFFF');
            itemComp.isFillState = true;
        } else {
            if (!itemComp.isAnswerFills) {
                itemComp.setWordColor('#001B3A');
                itemComp.isFillState = false;
                itemComp.clickMicIdx = null;
            } else {
                itemComp.setWordColor('#FFFFFF');
                itemComp.isFillState = true;
            }
        }
    }

    private dealAnswerBoard(answer: string): void {
        const answer1: string = GamePlayMgr.ins.reverseString(answer);
        const LanFinishAnswer: string[] = GamePlayMgr.ins.getLanFinishAnswer(GamePlayMgr.ins.language);
        const LanNotFinishAnswer: string[] = GamePlayMgr.ins.getLanNotFinishAnswer(GamePlayMgr.ins.language);
        let answerStr: string = null;

        for (let i = 0; i < this.titleLayout.children.length; i++) {
            const data: ItemAnswerWord = this.titleLayout.children[i].getComponent(ItemAnswerWord);
            if (!data.isFillState && answer === data.answerCn || answer1 === data.answerCn) {
                data.isFillState = true;
                data.setWordColor('#FFE600');
                if (LanFinishAnswer.indexOf(data.answerCn) === -1) {
                    LanFinishAnswer.push(data.answerCn);
                }
                answerStr = data.answerCn;
            }
        }

        for (let j = 0; j < LanNotFinishAnswer.length; j++) {
            if (LanNotFinishAnswer[j] === answerStr) {
                LanNotFinishAnswer.splice(j, 1);
            }
        }
    }

    public beginFingerAnim(): void {
        if (GamePlayMgr.ins.mode === 1) {
            this.scheduleOnce(this.setVecFinger, 2);
        }
    }


    public StopFingerAnim(): void {
        if (GamePlayMgr.ins.mode === 1) {
            cc.Tween.stopAllByTarget(this.vecFinger);
            if (this.fingerStreamItemNode) {
                this.fingerStreamItemNode.removeFromParent();
            }
            this.vecFinger.active = false;
        }
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
        const firstItemWord: ItemWord = this.mainModeItems[firstWord.x][firstWord.y];
        const endItemWord: ItemWord = this.mainModeItems[endWord.x][endWord.y];
        const startPos: cc.Vec2 = firstItemWord.WordItemPos;
        const endPos: cc.Vec2 = endItemWord.WordItemPos;

        let dire: number = null;
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

        cc.Tween.stopAllByTarget(this.vecFinger);

        cc.tween(this.vecFinger)
            .set({ position: new cc.Vec3(startPos.x, startPos.y, 0) })
            .set({ active: true })
            .call(() => {
                this.animInitData(resultWord);
                this.fingerStreamItemNode = cc.instantiate(LoadResMgr.ins.StreamItemMap.get('StreamItem'));
                this.StreamRoot.addChild(this.fingerStreamItemNode);
                const StreamItemComp: StreamItem = this.fingerStreamItemNode.getComponent(StreamItem);
                StreamItemComp.setPos(firstItemWord.WordItemPos);
                StreamItemComp.setBgColor(colorIdx);
            })
            .delay(0.2)
            .to(1, { position: new cc.Vec3(endPos.x, endPos.y, 0) }, {
                onUpdate: (target: cc.Node, ratio: number) => {
                    if (dire === 0) {
                        const fixPosx: cc.Vec2 = this.wordPos[0].item.WordItemPos;
                        this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, cc.v2(fixPosx.x, target.getPosition().y));
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().y >= data.y) {
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }
                    } else if (dire === 1) {
                        const fixPosx: cc.Vec2 = this.wordPos[0].item.WordItemPos;
                        this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, cc.v2(fixPosx.x, target.getPosition().y));
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().y <= data.y) {
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }

                    } else if (dire === 2) {
                        const fixPosx: cc.Vec2 = this.wordPos[0].item.WordItemPos;
                        this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, cc.v2(target.getPosition().x, fixPosx.y));
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().x >= data.x) {
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }

                    } else if (dire === 3) {
                        const fixPosx: cc.Vec2 = this.wordPos[0].item.WordItemPos;
                        this.lineAnim(this.fingerStreamItemNode, firstItemWord.WordItemPos, cc.v2(target.getPosition().x, fixPosx.y));
                        for (let i = 0; i < this.wordPos.length; i++) {
                            const data: {
                                x: number;
                                y: number;
                                item: ItemWord;
                            } = this.wordPos[i];
                            if (target.getPosition().x <= data.x) {
                                this.wordPos.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            })
            .delay(1)
            .call(() => {
                this.vecFinger.active = false;
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
                const itemComp: ItemWord = this.mainModeItems[resultWord[idx].point.x][resultWord[idx].point.y];
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
        const result: { angle: number; distance: number; } = this.checkPoints(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
        if (result) {
            const StreamItemComp: StreamItem = StreamItemNode.getComponent(StreamItem);
            StreamItemComp.setSize(result.distance);
            StreamItemComp.setNodeRotation(result.angle);
            StreamItemComp.setAnglePos(firstWordPos?.x, firstWordPos?.y, endWordPos?.x, endWordPos?.y);
        }
    }

    private dealFillData(arr: IPoint[]): void {
        for (let i = 0; i < arr.length; i++) {
            const itemCompRemove: ItemWord = this.mainModeItems[arr[i].x][arr[i].y];
            this.wordState(itemCompRemove, false);
        }
    }

    private equalsVec2(a: IPoint, b: IPoint): boolean {
        return a.x === b.x && a.y === b.y;
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

    //#endregion
}
