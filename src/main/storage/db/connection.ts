import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

const USER_DATA_PATH = app.getPath('userData')
const INIT_DB_PATH = getInitDbPath()
const INIT_CDB_PATH = getInitChatermDbPath()

let currentUserId: number | null = null

function getUserDatabasePath(userId: number, dbType: 'complete' | 'chaterm'): string {
  const userDir = join(USER_DATA_PATH, 'databases', `${userId}`)
  const dbName = dbType === 'complete' ? 'complete_data.db' : 'chaterm_data.db'
  return join(userDir, dbName)
}

function ensureUserDatabaseDir(userId: number): string {
  const userDir = join(USER_DATA_PATH, 'databases', `${userId}`)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  return userDir
}

function getLegacyDatabasePath(dbType: 'complete' | 'chaterm'): string {
  const dbName = dbType === 'complete' ? 'complete_data.db' : 'chaterm_data.db'
  return join(USER_DATA_PATH, 'databases', dbName)
}

function migrateLegacyDatabase(userId: number, dbType: 'complete' | 'chaterm'): boolean {
  const legacyPath = getLegacyDatabasePath(dbType)
  const userPath = getUserDatabasePath(userId, dbType)

  if (fs.existsSync(legacyPath)) {
    try {
      console.log(`🔄 Found legacy ${dbType} database at: ${legacyPath}`)
      console.log(`📦 Migrating to user directory: ${userPath}`)
      ensureUserDatabaseDir(userId)
      fs.renameSync(legacyPath, userPath)
      console.log(`✅ Successfully migrated legacy ${dbType} database for user ${userId}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to migrate legacy ${dbType} database:`, error)
      return false
    }
  }

  return false
}

function getInitChatermDbPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'db', 'init_chaterm.db')
  } else {
    return join(__dirname, '../../src/renderer/src/assets/db/init_chaterm.db')
  }
}

function getInitDbPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'db', 'init_data.db')
  } else {
    return join(__dirname, '../../src/renderer/src/assets/db/init_data.db')
  }
}

export function setCurrentUserId(userId: number | null): void {
  currentUserId = userId
}

export function getCurrentUserId(): number | null {
  return currentUserId
}

export function getGuestUserId(): number {
  return 999999999
}

function upgradeUserSnippetTable(db: Database.Database): void {
  try {
    // 检查 sort_order 列是否存在
    try {
      db.prepare('SELECT sort_order FROM user_snippet_v1 LIMIT 1').get()
    } catch (error) {
      // 列不存在，需要升级表结构

      db.transaction(() => {
        // 添加 sort_order 列
        db.exec('ALTER TABLE user_snippet_v1 ADD COLUMN sort_order INTEGER DEFAULT 0')
        console.log('✅ Added sort_order column to user_snippet_v1')

        // 初始化现有记录的排序值
        const allRecords = db.prepare('SELECT id FROM user_snippet_v1 ORDER BY created_at ASC').all()
        if (allRecords.length > 0) {
          const updateSortStmt = db.prepare('UPDATE user_snippet_v1 SET sort_order = ? WHERE id = ?')
          allRecords.forEach((record: any, index: number) => {
            updateSortStmt.run((index + 1) * 10, record.id) // 用10的倍数留出插入空间
          })
          console.log(`✅ Initialized sort_order for ${allRecords.length} existing records`)
        }
      })()

      console.log('✅ user_snippet_v1 table upgrade completed')
    }
  } catch (error) {
    console.error('❌ Failed to upgrade user_snippet_v1 table:', error)
  }
}

export async function initDatabase(userId?: number): Promise<Database.Database> {
  const isSkippedLogin = !userId && localStorage.getItem('login-skipped') === 'true'
  const targetUserId = userId || (isSkippedLogin ? getGuestUserId() : currentUserId)

  if (!targetUserId) {
    throw new Error('User ID is required for database initialization')
  }

  try {
    ensureUserDatabaseDir(targetUserId)
    const COMPLETE_DB_PATH = getUserDatabasePath(targetUserId, 'complete')

    if (!fs.existsSync(COMPLETE_DB_PATH)) {
      const migrated = migrateLegacyDatabase(targetUserId, 'complete')

      if (!migrated) {
        console.log('Target database does not exist, initializing from:', INIT_DB_PATH)
        if (!fs.existsSync(INIT_DB_PATH)) {
          throw new Error('Initial database (init_data.db) not found')
        }
        const sourceDb = new Database(INIT_DB_PATH, { readonly: true })
        await sourceDb.backup(COMPLETE_DB_PATH)
        sourceDb.close()
      }
    } else {
      console.log('Target database already exists, skipping initialization')
    }

    const db = new Database(COMPLETE_DB_PATH)
    console.log('✅ Complete database connection established at:', COMPLETE_DB_PATH)
    return db
  } catch (error) {
    console.error('❌ Complete database initialization failed:', error)
    throw error
  }
}

export async function initChatermDatabase(userId?: number): Promise<Database.Database> {
  const targetUserId = userId || currentUserId
  if (!targetUserId) {
    throw new Error('User ID is required for Chaterm database initialization')
  }

  ensureUserDatabaseDir(targetUserId)
  const Chaterm_DB_PATH = getUserDatabasePath(targetUserId, 'chaterm')

  try {
    if (!fs.existsSync(INIT_CDB_PATH)) {
      throw new Error(`Initial database (init_chaterm.db) not found at ${INIT_CDB_PATH}`)
    }

    const targetDbExists = fs.existsSync(Chaterm_DB_PATH)

    if (!targetDbExists) {
      const migrated = migrateLegacyDatabase(targetUserId, 'chaterm')

      if (!migrated) {
        console.log('Target Chaterm database does not exist. Copying from initial database.')
        const sourceDb = new Database(INIT_CDB_PATH, { readonly: true, fileMustExist: true })
        try {
          await sourceDb.backup(Chaterm_DB_PATH)
          console.log('✅ Chaterm database successfully copied.')
        } finally {
          sourceDb.close()
        }
      }
    } else {
      console.log('Target Chaterm database exists. Attempting schema synchronization.')
      let mainDb: Database.Database | null = null
      let initDb: Database.Database | null = null
      try {
        mainDb = new Database(Chaterm_DB_PATH)
        initDb = new Database(INIT_CDB_PATH, { readonly: true, fileMustExist: true })

        const initTables = initDb.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {
          name: string
          sql: string
        }[]

        for (const initTable of initTables) {
          const tableName = initTable.name
          const createTableSql = initTable.sql

          const tableExists = mainDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName)

          if (!tableExists) {
            console.log(`Table ${tableName} not found in target DB. Creating table.`)
            mainDb.exec(createTableSql)
          } else {
            console.log(`Table ${tableName} found in target DB. Checking for missing columns.`)
            const initTableInfo = initDb.pragma(`table_info(${tableName})`) as {
              name: string
              type: string
              notnull: number
              dflt_value: any
              pk: number
            }[]
            const mainTableInfo = mainDb.pragma(`table_info(${tableName})`) as { name: string }[]
            const mainTableColumnNames = new Set(mainTableInfo.map((col) => col.name))

            for (const initColumn of initTableInfo) {
              if (!mainTableColumnNames.has(initColumn.name)) {
                let addColumnSql = `ALTER TABLE ${tableName} ADD COLUMN ${initColumn.name} ${initColumn.type}`

                if (initColumn.dflt_value !== null) {
                  let defaultValueFormatted
                  if (typeof initColumn.dflt_value === 'string') {
                    defaultValueFormatted = initColumn.dflt_value
                  } else {
                    defaultValueFormatted = initColumn.dflt_value
                  }
                  addColumnSql += ` DEFAULT ${defaultValueFormatted}`
                }

                if (initColumn.notnull) {
                  if (initColumn.dflt_value !== null) {
                    addColumnSql += ' NOT NULL'
                  } else {
                    console.warn(
                      `Column '${initColumn.name}' in table '${tableName}' is defined as NOT NULL without a default value in the initial schema. Adding it as nullable to the existing table to avoid errors. Manual schema adjustment might be needed if strict NOT NULL is required and the table contains data.`
                    )
                  }
                }
                try {
                  console.log(`Attempting to add column ${initColumn.name} to table ${tableName} with SQL: ${addColumnSql}`)
                  mainDb.exec(addColumnSql)
                  console.log(`Successfully added column ${initColumn.name} to table ${tableName}.`)
                } catch (e: any) {
                  console.error(`Failed to add column ${initColumn.name} to table ${tableName}: ${e.message}. SQL: ${addColumnSql}`)
                }
              }
            }
          }
        }
        console.log('Chaterm database schema synchronization attempt complete.')
      } catch (syncError: any) {
        console.error('Error during Chaterm database schema synchronization:', syncError.message)
      } finally {
        if (mainDb && mainDb.open) mainDb.close()
        if (initDb && initDb.open) initDb.close()
      }
    }

    const finalDb = new Database(Chaterm_DB_PATH)
    console.log('✅ Chaterm database connection established at:', Chaterm_DB_PATH)

    // 执行表结构升级
    upgradeUserSnippetTable(finalDb)

    return finalDb
  } catch (error: any) {
    console.error('Failed database path:', Chaterm_DB_PATH)
    throw error
  }
}
