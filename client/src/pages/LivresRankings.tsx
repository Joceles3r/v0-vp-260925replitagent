"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, Users, BookOpen, Star } from "lucide-react"

interface BookWithStats {
  id: string
  title: string
  authorName: string
  unitPriceEUR: string
  totalVotes: number
  totalSalesEUR: string
  uniqueBuyers: number
  finalRank?: number
  engagementCoeff: string
  thumbnailUrl?: string
}

interface CategoryStats {
  totalBooks: number
  totalVotes: number
  totalSalesEUR: string
  uniqueInvestors: number
  avgEngagement: number
}

export default function LivresRankings() {
  const [top10Books, setTop10Books] = useState<BookWithStats[]>([])
  const [top100Books, setTop100Books] = useState<BookWithStats[]>([])
  const [top300Books, setTop300Books] = useState<BookWithStats[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("top10")

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    setLoading(true)
    try {
      const [top10Res, top100Res, top300Res, statsRes] = await Promise.all([
        fetch("/api/books/rankings/top10"),
        fetch("/api/books/rankings/top100"),
        fetch("/api/books/rankings/top300"),
        fetch("/api/books/stats"),
      ])

      const [top10Data, top100Data, top300Data, statsData] = await Promise.all([
        top10Res.json(),
        top100Res.json(),
        top300Res.json(),
        statsRes.json(),
      ])

      setTop10Books(top10Data)
      setTop100Books(top100Data)
      setTop300Books(top300Data)
      setStats(statsData)
    } catch (error) {
      console.error("[LivresRankings] Error fetching rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1er</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2ème</Badge>
    if (rank === 3) return <Badge className="bg-orange-600">🥉 3ème</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  const getEngagementColor = (coeff: number) => {
    if (coeff >= 8) return "text-green-600"
    if (coeff >= 5) return "text-blue-600"
    if (coeff >= 3) return "text-yellow-600"
    return "text-gray-600"
  }

  const renderBookCard = (book: BookWithStats, index: number) => {
    const rank = book.finalRank || index + 1
    const engagement = Number.parseFloat(book.engagementCoeff)

    return (
      <Card key={book.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">{getRankBadge(rank)}</div>

            {/* Book Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{book.title}</h3>
                <p className="text-sm text-muted-foreground">par {book.authorName}</p>
              </div>

              {/* Stats Gauges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Votes</span>
                    <span className="font-medium">{book.totalVotes}</span>
                  </div>
                  <Progress value={Math.min(100, (book.totalVotes / 100) * 100)} className="h-2" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engagement</span>
                    <span className={`font-medium ${getEngagementColor(engagement)}`}>{engagement.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min(100, (engagement / 10) * 100)} className="h-2" />
                </div>
              </div>

              {/* Additional Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{book.uniqueBuyers} acheteurs</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{book.totalSalesEUR}€ CA</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{book.unitPriceEUR}€</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement des classements...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Classement LIVRES</h1>
        <p className="text-muted-foreground">Découvrez les meilleurs auteurs et leurs œuvres</p>
      </div>

      {/* Global Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Livres Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Votes Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                CA Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSalesEUR}€</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Investisseurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueInvestors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rankings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="top10" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            TOP 10
          </TabsTrigger>
          <TabsTrigger value="top100">TOP 100</TabsTrigger>
          <TabsTrigger value="top300">TOP 300</TabsTrigger>
        </TabsList>

        <TabsContent value="top10" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                TOP 10 Auteurs et Livres
              </CardTitle>
              <CardDescription>Les 10 meilleurs livres du mois avec auto-report automatique</CardDescription>
            </CardHeader>
          </Card>
          <div className="space-y-4">{top10Books.map((book, index) => renderBookCard(book, index))}</div>
        </TabsContent>

        <TabsContent value="top100" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TOP 100 Auteurs et Livres</CardTitle>
              <CardDescription>Les 100 meilleurs livres - Éligibles au repêchage (25€)</CardDescription>
            </CardHeader>
          </Card>
          <div className="space-y-4">{top100Books.map((book, index) => renderBookCard(book, index))}</div>
        </TabsContent>

        <TabsContent value="top300" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TOP 300 Auteurs et Livres</CardTitle>
              <CardDescription>Classement complet jusqu'à 300 auteurs</CardDescription>
            </CardHeader>
          </Card>
          <div className="space-y-4">{top300Books.map((book, index) => renderBookCard(book, index))}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
