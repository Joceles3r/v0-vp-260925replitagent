"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Ban, CheckCircle, Clock, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Book {
  id: string
  title: string
  authorId: string
  authorName: string
  categoryId: string
  status: "pending" | "active" | "top10" | "completed" | "rejected"
  unitPriceEUR: string
  totalVotes: number
  totalSalesEUR: string
  uniqueBuyers: number
  finalRank?: number
  createdAt: string
}

interface BookCategory {
  id: string
  name: string
  displayName: string
  status: "waiting" | "active" | "closed"
  currentAuthorCount: number
  targetAuthorCount: number
  maxAuthorCount: number
  cycleStartedAt: string
  cycleEndsAt: string
}

export function LivresQueueManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 50
  const MAX_VISIBLE_QUEUE = 10000

  useEffect(() => {
    fetchData()
  }, [selectedCategory, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const categoriesRes = await fetch("/api/admin/book-categories")
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData)

      // Fetch books
      let url = "/api/admin/books?limit=" + MAX_VISIBLE_QUEUE
      if (selectedCategory !== "all") {
        url += `&categoryId=${selectedCategory}`
      }
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }

      const booksRes = await fetch(url)
      const booksData = await booksRes.json()
      setBooks(booksData)
    } catch (error) {
      console.error("[LivresQueue] Error fetching data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBlockBook = async (bookId: string, authorId: string) => {
    if (!confirm("Bloquer ce livre et cet auteur pour non-respect du règlement ?")) {
      return
    }

    try {
      await fetch(`/api/admin/books/${bookId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId, reason: "Violation du règlement" }),
      })

      toast({
        title: "Livre bloqué",
        description: "Le livre et l'auteur ont été bloqués",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de bloquer le livre",
        variant: "destructive",
      })
    }
  }

  const handleApproveBook = async (bookId: string) => {
    try {
      await fetch(`/api/admin/books/${bookId}/approve`, {
        method: "POST",
      })

      toast({
        title: "Livre approuvé",
        description: "Le livre a été approuvé et activé",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le livre",
        variant: "destructive",
      })
    }
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const paginatedBooks = filteredBooks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "En attente" },
      active: { variant: "default", icon: CheckCircle, label: "Actif" },
      top10: { variant: "default", icon: CheckCircle, label: "TOP 10" },
      completed: { variant: "outline", icon: CheckCircle, label: "Terminé" },
      rejected: { variant: "destructive", icon: Ban, label: "Rejeté" },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const stats = {
    total: books.length,
    pending: books.filter((b) => b.status === "pending").length,
    active: books.filter((b) => b.status === "active").length,
    top10: books.filter((b) => b.status === "top10").length,
    rejected: books.filter((b) => b.status === "rejected").length,
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Livres dans la file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À approuver</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">En compétition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.top10}</div>
            <p className="text-xs text-muted-foreground">Gagnants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Bloqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>File d'attente des auteurs LIVRES</CardTitle>
          <CardDescription>Gestion jusqu'à 10,000 auteurs visibles - {filteredBooks.length} résultats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou auteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="top10">TOP 10</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rang</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Acheteurs</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : paginatedBooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Aucun livre trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBooks.map((book, index) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">
                      {book.finalRank || (currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.authorName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {categories.find((c) => c.id === book.categoryId)?.displayName || "N/A"}
                    </TableCell>
                    <TableCell>{book.unitPriceEUR}€</TableCell>
                    <TableCell>{book.totalVotes}</TableCell>
                    <TableCell>{book.totalSalesEUR}€</TableCell>
                    <TableCell>{book.uniqueBuyers}</TableCell>
                    <TableCell>{getStatusBadge(book.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(book.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {book.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleApproveBook(book.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleBlockBook(book.id, book.authorId)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} ({filteredBooks.length} résultats)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
