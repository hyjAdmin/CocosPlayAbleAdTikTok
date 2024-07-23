/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 12:01:46
 * @LastEditTime: 2024-07-23 12:57:21
 */

import SingletonPattern from "../core/SingletonPattern";


const { ccclass, property } = cc._decorator;


export default class LoadResMgr extends SingletonPattern<LoadResMgr>() {
    public StreamItemMap: Map<string, cc.Prefab> = new Map();
    public EncWordMap: Map<number, cc.SpriteFrame> = new Map();

    /**
     * @description: 加载预制资源
     * @return {*}
     * @param {string} prefabPath
     */
    public loadItemPrefab(prefabPath: string, callback: (itemPrefab: cc.Node) => void): void {
        cc.resources.load(prefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
            if (err) {
                return;
            }
            const newNode: cc.Node = cc.instantiate(prefab);
            callback && callback(newNode);
        });
    }

    /**
     * @description: 加载预制资源
     * @return {*}
     * @param {string} prefabPath
     */
    public loadStreamItemPrefab(prefabPath: string): void {
        cc.resources.load(prefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
            if (err) {
                return;
            }
            this.StreamItemMap.set('StreamItem', prefab);
        });
    }



    /**
     * @description: 加载背景资源
     * @return {*}
     * @param {function} callback
     */
    public loadBgImageRes(path: string): void {
        cc.resources.loadDir<cc.SpriteFrame>(path, cc.SpriteFrame, function (err: Error | null, data: cc.SpriteFrame[]) {
            if (!err && data) {
                for (let i = 0; i < data.length; i++) {
                    LoadResMgr.ins.EncWordMap.set(parseInt(data[i].name, 10), data[i]);
                }
            }
        });
    }
}
