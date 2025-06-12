import mitt, { Emitter } from 'mitt'

/**
 * 定义事件类型
 */
export type AppEvents = {
  currentClickServer: any // 可根据实际 item 类型替换 any
  updateRightIcon: boolean // 更新右侧图标状态
  executeTerminalCommand: string // 执行终端命令
  writeTerminalCommand: string // 写入终端命令
  getActiveTabAssetInfo: void // 请求获取当前活跃tab的资产信息
  assetInfoResult: any // 返回资产信息结果
  currentCwdChanged: string // 当前工作目录变化事件
  LocalAssetMenu: any // 更新资产目录
  SettingModelChanged: any // 设置页面模型变更事件
  AiTabModelChanged: any // AI Tab模型变更事件
  // 可扩展更多事件
}

const eventBus: Emitter<AppEvents> = mitt<AppEvents>()

export default eventBus
