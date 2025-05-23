'use client'

import { useState, useEffect, useRef, MouseEventHandler } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, RotateCw, Book, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Note } from '@/payload-types'
import { useNotes } from '@/hooks/notes'

type Flashcard = {
  front: string
  back: string
  category: string
}

export default function FlashcardApp() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const notes = useNotes()
  const [activeTab, setActiveTab] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Extract unique categories
    const uniqueCategories = [...new Set(flashcards.map((card) => card.category))]
    setCategories(uniqueCategories)
  }, [flashcards])

  const filteredFlashcards =
    activeTab === 'all' ? flashcards : flashcards.filter((card) => card.category === activeTab)

  const handlePrevCard = () => {
    if (animating) return
    setAnimating(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredFlashcards.length - 1,
      )
      setAnimating(false)
    }, 300)
  }

  const handleNextCard = () => {
    if (animating) return
    setAnimating(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex < filteredFlashcards.length - 1 ? prevIndex + 1 : 0,
      )
      setAnimating(false)
    }, 300)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleMouseMove: MouseEventHandler = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      // Calculate mouse position relative to card center
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      setMousePosition({ x, y })
    }
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 })
  }

  const handleGenerateFlashcardsClick = async () => {
    setNoteModalOpen(true)
  }

  const handleSelectNote = (note: Note) => {
    setIsGenerating(true)
    try {
      setTimeout(async () => {
        const newCards = await fetchFlashcardsFromBackend(note.id)
        setFlashcards((prev) => [...prev, ...newCards.flashcards])
        setIsGenerating(false)
        setNoteModalOpen(false)
      }, 1500)
    } catch (err) {
      console.error('Error generating flashcards:', err)
      setIsGenerating(false)
    }
  }

  async function fetchFlashcardsFromBackend(note_id: string): Promise<{ flashcards: Flashcard[] }> {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note_id }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.statusText}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Error fetching flashcards:', error)
      return {
        flashcards: [],
      }
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNoteModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevCard()
      if (e.key === 'ArrowRight') handleNextCard()
      if (e.key === ' ') handleFlip()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, filteredFlashcards.length, animating])

  // Reset current index when changing tabs
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [activeTab])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white">
      <main className="container mx-auto px-6 py-8 flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl bg-slate-800/50 backdrop-blur border border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600 animate-gradient-x text-center">
              Interaktywne Fiszki
            </CardTitle>
            <p className="text-center text-gray-400">Ucz się z interaktywnymi fiszkami</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start p-1 bg-slate-800">
                <TabsTrigger value="all" className="flex-shrink-0">
                  Wszystkie ({flashcards.length})
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="flex-shrink-0">
                    {category} ({flashcards.filter((card) => card.category === category).length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Postęp</span>
                <span className="text-sm text-gray-400">
                  {filteredFlashcards.length > 0
                    ? `${currentIndex + 1} / ${filteredFlashcards.length} (${Math.round(((currentIndex + 1) / filteredFlashcards.length) * 100)}%)`
                    : '0 / 0 (0%)'}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width:
                      filteredFlashcards.length > 0
                        ? `${((currentIndex + 1) / filteredFlashcards.length) * 100}%`
                        : '0%',
                  }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="bg-slate-800 px-4 py-2 rounded-lg shadow">
                <div className="text-sm text-gray-400">Kategoria</div>
                <div className="text-lg font-medium text-blue-300">
                  {filteredFlashcards[currentIndex]?.category || 'Brak'}
                </div>
              </div>

              <div className="text-lg font-medium bg-slate-800 px-4 py-2 rounded-lg shadow">
                <div className="text-sm text-gray-400">Fiszka</div>
                <div className="text-lg font-medium text-white">
                  {filteredFlashcards.length > 0
                    ? `${currentIndex + 1} z ${filteredFlashcards.length}`
                    : '0 z 0'}
                </div>
              </div>

              <Button
                onClick={handleGenerateFlashcardsClick}
                disabled={isGenerating}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Wygeneruj nowe fiszki
                  </>
                )}
              </Button>
            </div>

            {filteredFlashcards.length > 0 ? (
              <div className="relative w-full" style={{ perspective: '1000px' }}>
                <div
                  ref={cardRef}
                  className={`relative w-full h-64 md:h-80 cursor-pointer transition-all duration-500 ${animating ? 'opacity-50' : ''}`}
                  onClick={handleFlip}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `
                      ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} 
                      rotateX(${mousePosition.y * 0.0}deg) 
                      rotateY(${mousePosition.x * 0.0}deg)
                    `,
                    transition: isFlipped ? 'transform 0.5s' : 'transform 0.5s',
                  }}
                >
                  {/* Front of card */}
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg border border-blue-600"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-3 left-3 px-2 py-1 bg-blue-800 text-xs rounded-md text-blue-200">
                      Pytanie
                    </div>
                    <p className="text-3xl font-bold text-center text-white">
                      {filteredFlashcards[currentIndex]?.front}
                    </p>
                  </div>

                  {/* Back of card */}
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-green-800 to-green-600 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg border border-green-500"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="absolute top-3 left-3 px-2 py-1 bg-green-700 text-xs rounded-md text-green-200">
                      Odpowiedź
                    </div>
                    <p className="text-3xl font-bold text-center text-white">
                      {filteredFlashcards[currentIndex]?.back}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center items-center mt-4 gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-center text-gray-400">Kliknij kartę aby ją obrócić</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 md:h-80 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 p-6">
                <Book className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-xl font-medium text-slate-400 text-center">
                  Brak fiszek w tej kategorii
                </p>
                <p className="text-sm text-slate-500 text-center mt-2">
                  Wygeneruj nowe fiszki lub wybierz inną kategorię
                </p>
              </div>
            )}
          </CardContent>

          {/* Note selection dialog */}
          <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
            <DialogContent className="bg-slate-800 border border-slate-700 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Wybierz notatkę do wygenerowania fiszek
                </DialogTitle>
              </DialogHeader>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RotateCw className="h-8 w-8 text-blue-400 animate-spin mb-4" />
                  <p className="text-blue-400">Generowanie fiszek...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {notes.data?.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer text-white transition border border-slate-600 hover:border-blue-500"
                      onClick={() => handleSelectNote(note)}
                    >
                      <div className="font-semibold text-lg mb-1">
                        {typeof note.title === 'object' ? JSON.stringify(note.title) : note.title}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {typeof note.content === 'object'
                          ? JSON.stringify(note.content).substring(0, 100)
                          : note.content}
                        ...
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white"
                  onClick={() => setNoteModalOpen(false)}
                  disabled={isGenerating}
                >
                  Zamknij
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CardFooter className="flex-col space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handlePrevCard}
                className="flex items-center bg-gray-800 border-slate-700 hover:bg-gray-700 text-white"
                disabled={animating || filteredFlashcards.length === 0}
              >
                <ChevronLeft className="mr-1" />
                Poprzednia
              </Button>
              <Button
                onClick={handleNextCard}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                disabled={animating || filteredFlashcards.length === 0}
              >
                Następna
                <ChevronRight className="ml-1" />
              </Button>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg shadow text-center w-full">
              <p className="font-medium mb-2 text-white">Skróty klawiszowe</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="bg-slate-700 px-2 py-1 rounded mr-2">←</span>
                  <span>Poprzednia</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-slate-700 px-2 py-1 rounded mr-2">→</span>
                  <span>Następna</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-slate-700 px-2 py-1 rounded mr-2">spacja</span>
                  <span>Obróć</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </main>

      <style jsx global>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 8s linear infinite;
        }
        .animate-gradient-x {
          background-size: 200% auto;
        }
      `}</style>
    </div>
  )
}
