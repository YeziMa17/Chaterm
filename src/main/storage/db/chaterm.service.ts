import Database from 'better-sqlite3'
import { initChatermDatabase, getCurrentUserId } from './connection'
import {
  getLocalAssetRouteLogic,
  updateLocalAssetLabelLogic,
  updateLocalAsseFavoriteLogic,
  getAssetGroupLogic,
  createAssetLogic,
  deleteAssetLogic,
  updateAssetLogic,
  connectAssetInfoLogic,
  getUserHostsLogic,
  refreshOrganizationAssetsLogic
} from './chaterm/assets'
import {
  deleteChatermHistoryByTaskIdLogic,
  getApiConversationHistoryLogic,
  saveApiConversationHistoryLogic,
  getSavedChatermMessagesLogic,
  saveChatermMessagesLogic,
  getTaskMetadataLogic,
  saveTaskMetadataLogic,
  getContextHistoryLogic,
  saveContextHistoryLogic
} from './chaterm/agent'
import {
  getKeyChainSelectLogic,
  createKeyChainLogic,
  deleteKeyChainLogic,
  getKeyChainInfoLogic,
  updateKeyChainLogic,
  getKeyChainListLogic
} from './chaterm/keychains'
import { userSnippetOperationLogic } from './chaterm/snippets'

export class ChatermDatabaseService {
  private static instances: Map<number, ChatermDatabaseService> = new Map()
  private db: Database.Database
  private userId: number

  private constructor(db: Database.Database, userId: number) {
    this.db = db
    this.userId = userId
  }

  public static async getInstance(userId?: number): Promise<ChatermDatabaseService> {
    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      throw new Error('User ID is required for ChatermDatabaseService')
    }

    if (!ChatermDatabaseService.instances.has(targetUserId)) {
      console.log(`Creating new ChatermDatabaseService instance for user ${targetUserId}`)
      const db = await initChatermDatabase(targetUserId)
      const instance = new ChatermDatabaseService(db, targetUserId)
      ChatermDatabaseService.instances.set(targetUserId, instance)
    }
    return ChatermDatabaseService.instances.get(targetUserId)!
  }

  public getUserId(): number {
    return this.userId
  }

  getLocalAssetRoute(searchType: string, params: any[] = []): any {
    return getLocalAssetRouteLogic(this.db, searchType, params)
  }

  updateLocalAssetLabel(uuid: string, label: string): any {
    return updateLocalAssetLabelLogic(this.db, uuid, label)
  }

  updateLocalAsseFavorite(uuid: string, status: number): any {
    return updateLocalAsseFavoriteLogic(this.db, uuid, status)
  }

  getAssetGroup(): any {
    return getAssetGroupLogic(this.db)
  }

  // 获取密钥链选项
  getKeyChainSelect(): any {
    return getKeyChainSelectLogic(this.db)
  }
  createKeyChain(params: any): any {
    return createKeyChainLogic(this.db, params)
  }

  deleteKeyChain(id: number): any {
    return deleteKeyChainLogic(this.db, id)
  }
  getKeyChainInfo(id: number): any {
    return getKeyChainInfoLogic(this.db, id)
  }
  updateKeyChain(params: any): any {
    return updateKeyChainLogic(this.db, params)
  }

  createAsset(params: any): any {
    return createAssetLogic(this.db, params)
  }

  deleteAsset(uuid: string): any {
    return deleteAssetLogic(this.db, uuid)
  }

  updateAsset(params: any): any {
    return updateAssetLogic(this.db, params)
  }

  getKeyChainList(): any {
    return getKeyChainListLogic(this.db)
  }
  connectAssetInfo(uuid: string): any {
    return connectAssetInfoLogic(this.db, uuid)
  }
  // @获取用户主机列表
  getUserHosts(search: string): any {
    return getUserHostsLogic(this.db, search)
  }

  // 事务处理
  transaction(fn: () => void): any {
    return this.db.transaction(fn)()
  }

  // Agent API对话历史相关方法

  async deleteChatermHistoryByTaskId(taskId: string): Promise<void> {
    return deleteChatermHistoryByTaskIdLogic(this.db, taskId)
  }

  async getApiConversationHistory(taskId: string): Promise<any[]> {
    return getApiConversationHistoryLogic(this.db, taskId)
  }

  async saveApiConversationHistory(taskId: string, apiConversationHistory: any[]): Promise<void> {
    return saveApiConversationHistoryLogic(this.db, taskId, apiConversationHistory)
  }

  // Agent UI消息相关方法
  async getSavedChatermMessages(taskId: string): Promise<any[]> {
    return getSavedChatermMessagesLogic(this.db, taskId)
  }

  async saveChatermMessages(taskId: string, uiMessages: any[]): Promise<void> {
    return saveChatermMessagesLogic(this.db, taskId, uiMessages)
  }

  // Agent任务元数据相关方法
  async getTaskMetadata(taskId: string): Promise<any> {
    return getTaskMetadataLogic(this.db, taskId)
  }

  async saveTaskMetadata(taskId: string, metadata: any): Promise<void> {
    return saveTaskMetadataLogic(this.db, taskId, metadata)
  }

  // Agent上下文历史相关方法
  async getContextHistory(taskId: string): Promise<any> {
    return getContextHistoryLogic(this.db, taskId)
  }

  async saveContextHistory(taskId: string, contextHistory: any): Promise<void> {
    return saveContextHistoryLogic(this.db, taskId, contextHistory)
  }
  // 快捷命令相关方法
  userSnippetOperation(operation: 'list' | 'create' | 'delete' | 'update' | 'swap', params?: any): any {
    return userSnippetOperationLogic(this.db, operation, params)
  }

  async refreshOrganizationAssets(organizationUuid: string, jumpServerConfig: any): Promise<any> {
    return await refreshOrganizationAssetsLogic(this.db, organizationUuid, jumpServerConfig)
  }
}
