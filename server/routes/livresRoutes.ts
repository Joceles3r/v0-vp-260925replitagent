import { Router } from "express"
import { storage } from "../storage"
import { requireAdmin } from "../middleware/auth"

const router = Router()

// Get all book categories (admin)
router.get("/admin/book-categories", requireAdmin, async (req, res) => {
  try {
    const categories = await storage.getAllBookCategories()
    res.json(categories)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching categories:", error)
    res.status(500).json({ error: "Failed to fetch categories" })
  }
})

// Get books with filters (admin - up to 10,000)
router.get("/admin/books", requireAdmin, async (req, res) => {
  try {
    const { categoryId, status, limit = "10000" } = req.query

    let books = await storage.getAllBooks()

    // Apply filters
    if (categoryId && categoryId !== "all") {
      books = books.filter((b) => b.categoryId === categoryId)
    }

    if (status && status !== "all") {
      books = books.filter((b) => b.status === status)
    }

    // Limit results
    books = books.slice(0, Number.parseInt(limit as string))

    // Enrich with author names
    const enrichedBooks = await Promise.all(
      books.map(async (book) => {
        const author = await storage.getUser(book.authorId)
        return {
          ...book,
          authorName: author?.username || "Unknown",
        }
      }),
    )

    res.json(enrichedBooks)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching books:", error)
    res.status(500).json({ error: "Failed to fetch books" })
  }
})

// Block book and author (admin)
router.post("/admin/books/:bookId/block", requireAdmin, async (req, res) => {
  try {
    const { bookId } = req.params
    const { authorId, reason } = req.body

    // Update book status to rejected
    await storage.updateBook(bookId, {
      status: "rejected",
      updatedAt: new Date(),
    })

    // TODO: Add author to blocklist
    // await storage.blockAuthor(authorId, reason);

    res.json({ success: true, message: "Book and author blocked" })
  } catch (error) {
    console.error("[LivresRoutes] Error blocking book:", error)
    res.status(500).json({ error: "Failed to block book" })
  }
})

// Approve book (admin)
router.post("/admin/books/:bookId/approve", requireAdmin, async (req, res) => {
  try {
    const { bookId } = req.params

    await storage.updateBook(bookId, {
      status: "active",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })

    res.json({ success: true, message: "Book approved" })
  } catch (error) {
    console.error("[LivresRoutes] Error approving book:", error)
    res.status(500).json({ error: "Failed to approve book" })
  }
})

// Get TOP 10 books
router.get("/books/rankings/top10", async (req, res) => {
  try {
    const books = await storage.getActiveBooks()
    const top10 = books
      .filter((b) => b.status === "top10" || (b.finalRank && b.finalRank <= 10))
      .sort((a, b) => (a.finalRank || 999) - (b.finalRank || 999))
      .slice(0, 10)

    const enriched = await Promise.all(
      top10.map(async (book) => {
        const author = await storage.getUser(book.authorId)
        return {
          ...book,
          authorName: author?.username || "Unknown",
        }
      }),
    )

    res.json(enriched)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching TOP 10:", error)
    res.status(500).json({ error: "Failed to fetch TOP 10" })
  }
})

// Get TOP 100 books
router.get("/books/rankings/top100", async (req, res) => {
  try {
    const books = await storage.getActiveBooks()
    const sorted = books
      .sort((a, b) => {
        const rankA = a.finalRank || 999
        const rankB = b.finalRank || 999
        if (rankA !== rankB) return rankA - rankB
        return b.totalVotes - a.totalVotes
      })
      .slice(0, 100)

    const enriched = await Promise.all(
      sorted.map(async (book) => {
        const author = await storage.getUser(book.authorId)
        return {
          ...book,
          authorName: author?.username || "Unknown",
        }
      }),
    )

    res.json(enriched)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching TOP 100:", error)
    res.status(500).json({ error: "Failed to fetch TOP 100" })
  }
})

// Get TOP 300 books
router.get("/books/rankings/top300", async (req, res) => {
  try {
    const books = await storage.getActiveBooks()
    const sorted = books
      .sort((a, b) => {
        const rankA = a.finalRank || 999
        const rankB = b.finalRank || 999
        if (rankA !== rankB) return rankA - rankB
        return b.totalVotes - a.totalVotes
      })
      .slice(0, 300)

    const enriched = await Promise.all(
      sorted.map(async (book) => {
        const author = await storage.getUser(book.authorId)
        return {
          ...book,
          authorName: author?.username || "Unknown",
        }
      }),
    )

    res.json(enriched)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching TOP 300:", error)
    res.status(500).json({ error: "Failed to fetch TOP 300" })
  }
})

// Get category stats
router.get("/books/stats", async (req, res) => {
  try {
    const books = await storage.getActiveBooks()
    const purchases = await Promise.all(books.map((b) => storage.getBookPurchases(b.id)))
    const allPurchases = purchases.flat()

    const stats = {
      totalBooks: books.length,
      totalVotes: books.reduce((sum, b) => sum + b.totalVotes, 0),
      totalSalesEUR: books.reduce((sum, b) => sum + Number.parseFloat(b.totalSalesEUR), 0).toFixed(2),
      uniqueInvestors: new Set(allPurchases.map((p) => p.userId)).size,
      avgEngagement:
        books.length > 0
          ? books.reduce((sum, b) => sum + Number.parseFloat(b.engagementCoeff || "0"), 0) / books.length
          : 0,
    }

    res.json(stats)
  } catch (error) {
    console.error("[LivresRoutes] Error fetching stats:", error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
})

export default router
