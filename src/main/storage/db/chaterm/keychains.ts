import Database from 'better-sqlite3'

// Get keychain options
export function getKeyChainSelectLogic(db: Database.Database): any {
  try {
    const stmt = db.prepare(`
        SELECT key_chain_id, chain_name
        FROM t_asset_chains
        ORDER BY created_at
      `)
    const results = stmt.all() || []

    return {
      data: {
        keyChain: results.map((item: any) => ({
          key: item.key_chain_id,
          label: item.chain_name
        }))
      }
    }
  } catch (error) {
    console.error('Chaterm database get keychain error:', error)
    throw error
  }
}

export function createKeyChainLogic(db: Database.Database, params: any): any {
  try {
    const form = params
    if (!form) {
      throw new Error('No keychain data provided')
    }
    const insertStmt = db.prepare(`
        INSERT INTO t_asset_chains (chain_name, chain_private_key, chain_public_key, chain_type, passphrase) VALUES (?, ?, ?, ?, ?)
      `)
    const result = insertStmt.run(form.chain_name, form.private_key, form.public_key, form.chain_type, form.passphrase)
    return {
      data: {
        message: result.changes > 0 ? 'success' : 'failed'
      }
    }
  } catch (error) {
    console.error('Chaterm database create keychain error:', error)
    throw error
  }
}

export function deleteKeyChainLogic(db: Database.Database, id: number): any {
  try {
    const stmt = db.prepare(`
        DELETE FROM t_asset_chains
        WHERE key_chain_id = ?
      `)
    const result = stmt.run(id)
    return {
      data: {
        message: result.changes > 0 ? 'success' : 'failed'
      }
    }
  } catch (error) {
    console.error('Chaterm database delete keychain error:', error)
    throw error
  }
}

export function getKeyChainInfoLogic(db: Database.Database, id: number): any {
  try {
    const stmt = db.prepare(`
        SELECT key_chain_id, chain_name, chain_private_key as private_key, chain_public_key as public_key, chain_type, passphrase
        FROM t_asset_chains
        WHERE key_chain_id = ?
      `)
    const result = stmt.get(id)
    return result
  } catch (error) {
    console.error('Chaterm database get keychain error:', error)
    throw error
  }
}

export function updateKeyChainLogic(db: Database.Database, params: any): any {
  try {
    const form = params
    if (!form) {
      throw new Error('No keychain data provided')
    }
    const stmt = db.prepare(`
        UPDATE t_asset_chains
        SET chain_name = ?,
            chain_private_key = ?,
            chain_public_key = ?,
            chain_type = ?,
            passphrase = ?
        WHERE key_chain_id = ?
      `)
    const result = stmt.run(form.chain_name, form.private_key, form.public_key, form.chain_type, form.passphrase, form.key_chain_id)
    return {
      data: {
        message: result.changes > 0 ? 'success' : 'failed'
      }
    }
  } catch (error) {
    console.error('Chaterm database update keychain error:', error)
    throw error
  }
}

export function getKeyChainListLogic(db: Database.Database): any {
  try {
    const stmt = db.prepare(`
        SELECT key_chain_id, chain_name, chain_type
        FROM t_asset_chains
        ORDER BY created_at
      `)
    const results = stmt.all() || []

    return {
      data: {
        keyChain: results.map((item: any) => ({
          key_chain_id: item.key_chain_id,
          chain_name: item.chain_name,
          chain_type: item.chain_type
        }))
      }
    }
  } catch (error) {
    console.error('Chaterm database get keychain error:', error)
    throw error
  }
}
