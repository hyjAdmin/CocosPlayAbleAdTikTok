/*
 * @Description: 
 * @Author: hanyajun
 * @Date: 2024-07-23 21:53:25
 * @LastEditTime: 2024-07-23 21:54:10
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class EventManager extends cc.Component {
    // 事件监听器字典
    private listeners: { [key: string]: Function[] } = {};

    // 注册监听器
    public on(eventName: string, callback: Function) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    // 移除监听器
    public off(eventName: string, callback: Function) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(listener => listener !== callback);
        }
    }

    // 触发事件
    public emit(eventName: string, ...args: any[]) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                callback(...args);
            });
        }
    }
}
