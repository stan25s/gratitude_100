import "dotenv/config"
import { Pool } from "pg"
import http from "http"

console.log("DATABASE_URL:", process.env.DATABASE_URL)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = Number(process.env.PORT || 4000)

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }

    if (req.url?.startsWith('/prompts/next/') && req.method === 'GET') {
      const userId = Number(req.url.split('/')[3])
      if (!Number.isInteger(userId) || userId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid_user_id' }))
        return
      }

      const userRes = await pool.query('SELECT day_count FROM users WHERE id = $1', [userId])
      if (userRes.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'user_not_found' }))
        return
      }

      const nextPromptId = userRes.rows[0].day_count + 1
      const promptRes = await pool.query('SELECT id, text, created_at FROM prompts WHERE id = $1', [nextPromptId])
      if (promptRes.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'next_prompt_not_found' }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(promptRes.rows[0]))
      return
    }

    if (req.url?.startsWith('/prompts/') && req.method === 'GET') {
      const promptId = Number(req.url.split('/')[2])
      if (!Number.isInteger(promptId) || promptId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid_prompt_id' }))
        return
      }

      const result = await pool.query('SELECT id, text, created_at FROM prompts WHERE id = $1', [promptId])
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'prompt_not_found' }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.rows[0]))
      return
    }

    if (req.url?.startsWith('/prompts/') && req.method === 'GET') {
      const promptId = Number(req.url.split('/')[2])
      if (!Number.isInteger(promptId) || promptId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid_prompt_id' }))
        return
      }

      const result = await pool.query('SELECT id, text, created_at FROM prompts WHERE id = $1', [promptId])
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'prompt_not_found' }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.rows[0]))
      return
    }

    if (req.url === '/prompts' && req.method === 'GET') {
      const result = await pool.query('SELECT * FROM prompts ORDER BY id ASC')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.rows))
      return
    }

    if (req.url === '/prompts' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => (body += chunk.toString()))
      req.on('end', async () => {
        try {
          const { id, text } = JSON.parse(body)

          if (!id || !text) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'id_and_text_required' }))
            return
          }

          const upsertPrompt = await pool.query(
            'INSERT INTO prompts (id, text) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text RETURNING id, text, created_at',
            [id, text]
          )

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(upsertPrompt.rows[0]))
        } catch (err) {
          console.error(err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
      return
    }

    if (req.url === "/entries" && req.method === "POST") {
      let body = ""
      req.on("data", (chunk) => (body += chunk.toString()))
      req.on("end", async () => {
        try {
          const { user_id, prompt_id, content } = JSON.parse(body)

          if (!user_id || !prompt_id || !content) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'missing_fields' }))
            return
          }

          // Check if entry already exists for this user and prompt_id
          const existingEntry = await pool.query(
            'SELECT id FROM entries WHERE user_id = $1 AND prompt_id = $2',
            [user_id, prompt_id]
          )

          if (existingEntry.rows.length > 0) {
            res.writeHead(409, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'entry_already_exists_for_day' }))
            return
          }

          // Create entry and increment user's day count
          const client = await pool.connect()
          try {
            await client.query('BEGIN')

            const newEntry = await client.query(
              'INSERT INTO entries (user_id, prompt_id, content) VALUES ($1, $2, $3) RETURNING *',
              [user_id, prompt_id, content]
            )

            await client.query(
              'UPDATE users SET day_count = day_count + 1 WHERE id = $1',
              [user_id]
            )

            await client.query('COMMIT')
            res.writeHead(201, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(newEntry.rows[0]))
          } catch (err) {
            await client.query('ROLLBACK')
            throw err
          } finally {
            client.release()
          }
        } catch (err) {
          console.error(err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
      return
    }

    if (req.url === '/users' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => (body += chunk.toString()))
      req.on('end', async () => {
        try {
          const { name } = JSON.parse(body)

          if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'name_required' }))
            return
          }

          const newUser = await pool.query(
            'INSERT INTO users (name) VALUES ($1) RETURNING id, name, day_count, created_at',
            [name]
          )

          res.writeHead(201, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(newUser.rows[0]))
        } catch (err) {
          console.error(err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
      return
    }

    if (req.url === '/users' && req.method === 'GET') {
      const result = await pool.query('SELECT id, name, day_count, created_at FROM users ORDER BY id ASC')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.rows))
      return
    }

    if (req.url?.startsWith('/prompts/next/') && req.method === 'GET') {
      const userId = Number(req.url.split('/')[3])
      if (!Number.isInteger(userId) || userId <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid_user_id' }))
        return
      }

      const userRes = await pool.query('SELECT day_count FROM users WHERE id = $1', [userId])
      if (userRes.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'user_not_found' }))
        return
      }

      const nextPromptId = userRes.rows[0].day_count + 1
      const promptRes = await pool.query('SELECT id, text, created_at FROM prompts WHERE id = $1', [nextPromptId])
      if (promptRes.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'next_prompt_not_found' }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(promptRes.rows[0]))
      return
    }

    if (req.url === '/entries' && req.method === 'GET') {
      const result = await pool.query(`
        SELECT e.id, e.user_id, e.prompt_id, e.content, e.created_at, p.text as prompt_text
        FROM entries e
        JOIN prompts p ON e.prompt_id = p.id
        ORDER BY e.prompt_id ASC, e.created_at ASC
      `)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.rows))
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'internal_error' }))
  }
})

server.listen(PORT, () => {
  console.log(`Backend running http://localhost:${PORT}`)
})

process.on("SIGINT", async () => {
  await pool.end()
  process.exit(0)
})
