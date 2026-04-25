import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import prismaClientPackage from '@prisma/client'
import pgPackage from 'pg'

const { PrismaClient } = prismaClientPackage
const { Client } = pgPackage

const storePath = resolve(process.cwd(), '.data', 'content-studio.json')

const readEnvFile = async () => {
  const envPath = resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    return {}
  }

  const envText = await readFile(envPath, 'utf8')
  const env = {}

  for (const line of envText.split(/\r?\n/u)) {
    if (!line || /^\s*#/u.test(line)) {
      continue
    }

    const separator = line.indexOf('=')

    if (separator === -1) {
      continue
    }

    const key = line.slice(0, separator)
    const value = line.slice(separator + 1)
    env[key] = value
  }

  return env
}

const applyEnvironment = (env) => {
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value
    }
  }

  if (process.env.DATABASE_URL_OVERRIDE) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_OVERRIDE
  }
}

const readFallbackStore = async () => {
  if (!existsSync(storePath)) {
    console.log(`No fallback store found at ${storePath}. Nothing to import.`)
    return null
  }

  const raw = await readFile(storePath, 'utf8')
  return JSON.parse(raw)
}

const topicById = (topics = []) => new Map(topics.map((topic) => [topic.id, topic]))
const tagById = (tags = []) => new Map(tags.map((tag) => [tag.id, tag]))
const parseDate = (value) => (value ? new Date(value) : null)
const parseBoolean = (value) => Boolean(value)
const parseInteger = (value, fallback = 1) => Number(value) || fallback
const normalizeTextArray = (value) => (Array.isArray(value) ? value.map((item) => String(item)) : [])
const ensureId = (value) => String(value || crypto.randomUUID())

const importWithPrisma = async (store) => {
  const prisma = new PrismaClient()
  const topics = Array.isArray(store.topics) ? store.topics : []
  const tags = Array.isArray(store.tags) ? store.tags : []
  const articles = Array.isArray(store.articles) ? store.articles : []
  const projects = Array.isArray(store.projects) ? store.projects : []
  const topicsById = topicById(topics)
  const tagsById = tagById(tags)

  try {
    for (const topic of topics) {
      await prisma.topic.upsert({
        where: {
          slug: topic.slug
        },
        update: {
          name: topic.name,
          description: topic.description || null
        },
        create: {
          slug: topic.slug,
          name: topic.name,
          description: topic.description || null,
          createdAt: parseDate(topic.createdAt) || new Date(),
          updatedAt: parseDate(topic.updatedAt) || new Date()
        }
      })
    }

    for (const tag of tags) {
      await prisma.tag.upsert({
        where: {
          slug: tag.slug
        },
        update: {
          name: tag.name,
          color: tag.color || null
        },
        create: {
          slug: tag.slug,
          name: tag.name,
          color: tag.color || null,
          createdAt: parseDate(tag.createdAt) || new Date(),
          updatedAt: parseDate(tag.updatedAt) || new Date()
        }
      })
    }

    for (const article of articles) {
      const fallbackTopic = article.topicId ? topicsById.get(article.topicId) : null
      const fallbackTags = Array.isArray(article.tagIds)
        ? article.tagIds
            .map((tagId) => tagsById.get(tagId))
            .filter(Boolean)
        : []

      await prisma.article.upsert({
        where: {
          slug: article.slug
        },
        update: {
          title: article.title,
          summary: article.summary,
          excerpt: article.excerpt,
          bodyMd: article.bodyMd,
          coverImageUrl: article.coverImageUrl || null,
          readingTime: parseInteger(article.readingTime),
          status: article.status,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.seoDescription || article.summary,
          isFeatured: parseBoolean(article.isFeatured),
          publishedAt: parseDate(article.publishedAt),
          topic: fallbackTopic
            ? {
                connect: {
                  slug: fallbackTopic.slug
                }
              }
            : {
                disconnect: true
              },
          tags: {
            deleteMany: {},
            create: fallbackTags.map((tag) => ({
              tag: {
                connect: {
                  slug: tag.slug
                }
              }
            }))
          },
          createdAt: parseDate(article.createdAt) || new Date(),
          updatedAt: parseDate(article.updatedAt) || new Date()
        },
        create: {
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          excerpt: article.excerpt,
          bodyMd: article.bodyMd,
          coverImageUrl: article.coverImageUrl || null,
          readingTime: parseInteger(article.readingTime),
          status: article.status,
          seoTitle: article.seoTitle || article.title,
          seoDescription: article.seoDescription || article.summary,
          isFeatured: parseBoolean(article.isFeatured),
          publishedAt: parseDate(article.publishedAt),
          createdAt: parseDate(article.createdAt) || new Date(),
          updatedAt: parseDate(article.updatedAt) || new Date(),
          topic: fallbackTopic
            ? {
                connect: {
                  slug: fallbackTopic.slug
                }
              }
            : undefined,
          tags: {
            create: fallbackTags.map((tag) => ({
              tag: {
                connect: {
                  slug: tag.slug
                }
              }
            }))
          }
        }
      })
    }

    for (const project of projects) {
      await prisma.project.upsert({
        where: {
          slug: project.slug
        },
        update: {
          title: project.title,
          summary: project.summary,
          contentMd: project.contentMd || null,
          stack: normalizeTextArray(project.stack),
          repoUrl: project.repoUrl || null,
          demoUrl: project.demoUrl || null,
          status: project.status,
          isFeatured: parseBoolean(project.isFeatured),
          publishedAt: parseDate(project.publishedAt),
          createdAt: parseDate(project.createdAt) || new Date(),
          updatedAt: parseDate(project.updatedAt) || new Date()
        },
        create: {
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          contentMd: project.contentMd || null,
          stack: normalizeTextArray(project.stack),
          repoUrl: project.repoUrl || null,
          demoUrl: project.demoUrl || null,
          status: project.status,
          isFeatured: parseBoolean(project.isFeatured),
          publishedAt: parseDate(project.publishedAt),
          createdAt: parseDate(project.createdAt) || new Date(),
          updatedAt: parseDate(project.updatedAt) || new Date()
        }
      })
    }
  } finally {
    await prisma.$disconnect()
  }

  return {
    driver: 'prisma',
    topics: topics.length,
    tags: tags.length,
    articles: articles.length,
    projects: projects.length
  }
}

const getDatabaseUrl = (env) =>
  process.env.DATABASE_URL_OVERRIDE ||
  process.env.DATABASE_URL ||
  env.DATABASE_URL_OVERRIDE ||
  env.DATABASE_URL ||
  ''

const upsertTopicWithPg = async (client, topic) => {
  const createdAt = parseDate(topic.createdAt) || new Date()
  const updatedAt = parseDate(topic.updatedAt) || new Date()
  const existing = await client.query(
    'select "id" from "Topic" where "slug" = $1 or "name" = $2 limit 1',
    [topic.slug, topic.name]
  )

  if (existing.rowCount) {
    const result = await client.query(
      `
        update "Topic"
        set "slug" = $1,
            "name" = $2,
            "description" = $3,
            "createdAt" = $4,
            "updatedAt" = $5
        where "id" = $6
        returning "id", "slug"
      `,
      [topic.slug, topic.name, topic.description || null, createdAt, updatedAt, existing.rows[0].id]
    )

    return result.rows[0]
  }

  const result = await client.query(
    `
      insert into "Topic" ("id", "slug", "name", "description", "createdAt", "updatedAt")
      values ($1, $2, $3, $4, $5, $6)
      returning "id", "slug"
    `,
    [ensureId(topic.id), topic.slug, topic.name, topic.description || null, createdAt, updatedAt]
  )

  return result.rows[0]
}

const upsertTagWithPg = async (client, tag) => {
  const createdAt = parseDate(tag.createdAt) || new Date()
  const updatedAt = parseDate(tag.updatedAt) || new Date()
  const existing = await client.query(
    'select "id" from "Tag" where "slug" = $1 or "name" = $2 limit 1',
    [tag.slug, tag.name]
  )

  if (existing.rowCount) {
    const result = await client.query(
      `
        update "Tag"
        set "slug" = $1,
            "name" = $2,
            "color" = $3,
            "createdAt" = $4,
            "updatedAt" = $5
        where "id" = $6
        returning "id", "slug"
      `,
      [tag.slug, tag.name, tag.color || null, createdAt, updatedAt, existing.rows[0].id]
    )

    return result.rows[0]
  }

  const result = await client.query(
    `
      insert into "Tag" ("id", "slug", "name", "color", "createdAt", "updatedAt")
      values ($1, $2, $3, $4, $5, $6)
      returning "id", "slug"
    `,
    [ensureId(tag.id), tag.slug, tag.name, tag.color || null, createdAt, updatedAt]
  )

  return result.rows[0]
}

const replaceArticleTagsWithPg = async (client, articleId, tagIds) => {
  await client.query('delete from "ArticleTag" where "articleId" = $1', [articleId])

  if (!tagIds.length) {
    return
  }

  const values = tagIds.map((_, index) => `($1, $${index + 2})`).join(', ')
  await client.query(
    `insert into "ArticleTag" ("articleId", "tagId") values ${values} on conflict do nothing`,
    [articleId, ...tagIds]
  )
}

const upsertArticleWithPg = async (client, article, topicSlugToId, tagSlugToId, topicsById, tagsById) => {
  const fallbackTopic = article.topicId ? topicsById.get(article.topicId) : null
  const fallbackTags = Array.isArray(article.tagIds)
    ? article.tagIds
        .map((tagId) => tagsById.get(tagId))
        .filter(Boolean)
    : []
  const result = await client.query(
    `
      insert into "Article" (
        "id",
        "slug",
        "title",
        "summary",
        "excerpt",
        "bodyMd",
        "coverImageUrl",
        "readingTime",
        "status",
        "seoTitle",
        "seoDescription",
        "isFeatured",
        "publishedAt",
        "topicId",
        "createdAt",
        "updatedAt"
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9::"ArticleStatus",
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      on conflict ("slug") do update
      set "title" = excluded."title",
          "summary" = excluded."summary",
          "excerpt" = excluded."excerpt",
          "bodyMd" = excluded."bodyMd",
          "coverImageUrl" = excluded."coverImageUrl",
          "readingTime" = excluded."readingTime",
          "status" = excluded."status",
          "seoTitle" = excluded."seoTitle",
          "seoDescription" = excluded."seoDescription",
          "isFeatured" = excluded."isFeatured",
          "publishedAt" = excluded."publishedAt",
          "topicId" = excluded."topicId",
          "createdAt" = excluded."createdAt",
          "updatedAt" = excluded."updatedAt"
      returning "id"
    `,
    [
      ensureId(article.id),
      article.slug,
      article.title,
      article.summary,
      article.excerpt,
      article.bodyMd,
      article.coverImageUrl || null,
      parseInteger(article.readingTime),
      article.status,
      article.seoTitle || article.title,
      article.seoDescription || article.summary,
      parseBoolean(article.isFeatured),
      parseDate(article.publishedAt),
      fallbackTopic ? topicSlugToId.get(fallbackTopic.slug) || null : null,
      parseDate(article.createdAt) || new Date(),
      parseDate(article.updatedAt) || new Date()
    ]
  )

  const tagIds = fallbackTags
    .map((tag) => tagSlugToId.get(tag.slug))
    .filter(Boolean)

  await replaceArticleTagsWithPg(client, result.rows[0].id, tagIds)
}

const upsertProjectWithPg = async (client, project) => {
  await client.query(
    `
      insert into "Project" (
        "id",
        "slug",
        "title",
        "summary",
        "contentMd",
        "stack",
        "repoUrl",
        "demoUrl",
        "status",
        "isFeatured",
        "publishedAt",
        "createdAt",
        "updatedAt"
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6::jsonb,
        $7,
        $8,
        $9::"ProjectStatus",
        $10,
        $11,
        $12,
        $13
      )
      on conflict ("slug") do update
      set "title" = excluded."title",
          "summary" = excluded."summary",
          "contentMd" = excluded."contentMd",
          "stack" = excluded."stack",
          "repoUrl" = excluded."repoUrl",
          "demoUrl" = excluded."demoUrl",
          "status" = excluded."status",
          "isFeatured" = excluded."isFeatured",
          "publishedAt" = excluded."publishedAt",
          "createdAt" = excluded."createdAt",
          "updatedAt" = excluded."updatedAt"
    `,
    [
      ensureId(project.id),
      project.slug,
      project.title,
      project.summary,
      project.contentMd || null,
      JSON.stringify(normalizeTextArray(project.stack)),
      project.repoUrl || null,
      project.demoUrl || null,
      project.status,
      parseBoolean(project.isFeatured),
      parseDate(project.publishedAt),
      parseDate(project.createdAt) || new Date(),
      parseDate(project.updatedAt) || new Date()
    ]
  )
}

const cleanupWithPg = async (client, store) => {
  const topics = Array.isArray(store.topics) ? store.topics : []
  const tags = Array.isArray(store.tags) ? store.tags : []
  const articles = Array.isArray(store.articles) ? store.articles : []
  const projects = Array.isArray(store.projects) ? store.projects : []

  await client.query(
    `
      delete from "ArticleTag"
      using "Article"
      where "ArticleTag"."articleId" = "Article"."id"
        and not ("Article"."slug" = any($1::text[]))
    `,
    [articles.map((article) => article.slug)]
  )

  await client.query('delete from "Article" where not ("slug" = any($1::text[]))', [
    articles.map((article) => article.slug)
  ])

  await client.query('delete from "Project" where not ("slug" = any($1::text[]))', [
    projects.map((project) => project.slug)
  ])

  await client.query(
    `
      delete from "Tag"
      where not ("slug" = any($1::text[]))
        and not exists (
          select 1
          from "ArticleTag"
          where "ArticleTag"."tagId" = "Tag"."id"
        )
    `,
    [tags.map((tag) => tag.slug)]
  )

  await client.query(
    `
      delete from "Topic"
      where not ("slug" = any($1::text[]))
        and not exists (
          select 1
          from "Article"
          where "Article"."topicId" = "Topic"."id"
        )
    `,
    [topics.map((topic) => topic.slug)]
  )
}

const importWithPg = async (store) => {
  const env = await readEnvFile()
  applyEnvironment(env)

  const connectionString = getDatabaseUrl(env)

  if (!connectionString) {
    throw new Error('DATABASE_URL 未配置，无法使用 pg 回退导入。')
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  const topics = Array.isArray(store.topics) ? store.topics : []
  const tags = Array.isArray(store.tags) ? store.tags : []
  const articles = Array.isArray(store.articles) ? store.articles : []
  const projects = Array.isArray(store.projects) ? store.projects : []
  const topicsById = topicById(topics)
  const tagsById = tagById(tags)
  const topicSlugToId = new Map()
  const tagSlugToId = new Map()

  await client.connect()

  try {
    await client.query('begin')

    for (const topic of topics) {
      const record = await upsertTopicWithPg(client, topic)
      topicSlugToId.set(record.slug, record.id)
    }

    for (const tag of tags) {
      const record = await upsertTagWithPg(client, tag)
      tagSlugToId.set(record.slug, record.id)
    }

    for (const article of articles) {
      await upsertArticleWithPg(client, article, topicSlugToId, tagSlugToId, topicsById, tagsById)
    }

    for (const project of projects) {
      await upsertProjectWithPg(client, project)
    }

    await cleanupWithPg(client, store)
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }

  return {
    driver: 'pg',
    topics: topics.length,
    tags: tags.length,
    articles: articles.length,
    projects: projects.length
  }
}

const run = async () => {
  const env = await readEnvFile()
  applyEnvironment(env)

  const store = await readFallbackStore()

  if (!store) {
    return
  }

  try {
    const result = await importWithPrisma(store)
    console.log(
      `Imported ${result.topics} topics, ${result.tags} tags, ${result.articles} articles, and ${result.projects} projects from ${storePath} via ${result.driver}.`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Prisma import failed, falling back to pg: ${message}`)

    const result = await importWithPg(store)
    console.log(
      `Imported ${result.topics} topics, ${result.tags} tags, ${result.articles} articles, and ${result.projects} projects from ${storePath} via ${result.driver}.`
    )
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
