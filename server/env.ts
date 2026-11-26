// Load .env (if present) before anything reads process.env. Imported first by index.ts.
import { existsSync } from 'node:fs'
if (existsSync('.env')) process.loadEnvFile('.env')
