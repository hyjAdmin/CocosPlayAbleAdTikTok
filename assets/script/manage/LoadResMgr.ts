/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-19 12:01:46
 * @LastEditTime: 2024-07-19 14:06:07
 */

import SingletonPattern from "../core/SingletonPattern";


const { ccclass, property } = cc._decorator;


export default class LoadResMgr extends SingletonPattern<LoadResMgr>() {

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
}
