#!/usr/bin/env node
// Mark one or more claude_requests rows as done.
// Usage: node scripts/mark-done.mjs <id> [<id> ...] [--response "text"]

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = dirname(fileURLToPath(import.meta.url)) + '/..'
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Missing env'); process.exit(1) }

const args = process.argv.slice(2)
const respIdx = args.indexOf('--response')
let response = null
if (respIdx >= 0) { response = args[respIdx + 1]; args.splice(respIdx, 2) }

if (!args.length) { console.error('Need at least one id'); process.exit(1) }

const supabase = createClient(url, key)
const patch = { status: 'done' }
if (response) patch.response = response

for (const id of args) {
  const { error } = await supabase.from('claude_requests').update(patch).eq('id', id)
  console.log(error ? `FAIL ${id}: ${error.message}` : `OK   ${id}`)
}
