export interface CommandResult {
  command: string
}

export interface AssetNode {
  key: string
  title: string
  favorite: boolean
  ip: string
  uuid: string
  group_name?: string
  label?: string
  auth_type?: string
  port?: number
  username?: string
  key_chain_id?: number
  organization_id?: string
}

export interface RouterNode {
  key: string
  title: string
  children: AssetNode[]
}

export interface QueryResult {
  code: number
  data: {
    routers: RouterNode[]
  }
  ts: string
}

export interface EvictConfig {
  evict_type: string
  evict_value: number
  evict_current_value: number
}
