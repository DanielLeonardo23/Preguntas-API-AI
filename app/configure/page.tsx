"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export default function ConfigurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizType = searchParams.get("type") || "predefined"

  const [format, setFormat] = useState("truefalse")
  const [questionCount, setQuestionCount] = useState("10")
  const [questionOrder, setQuestionOrder] = useState("random")
  const [questionsPerSection, setQuestionsPerSection] = useState("5")

  const handleStartQuiz = () => {
    const params = new URLSearchParams()
    params.set("type", quizType)
    params.set("format", format)
    params.set("count", questionCount)
    params.set("order", questionOrder)
    params.set("perSection", questionsPerSection)

    router.push(`/quiz?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center mb-6 text-sm text-spotify-subtext hover:text-spotify-text">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
        </Link>

        <Card className="spotify-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-spotify-text">
              <Settings className="h-5 w-5 text-spotify-primary" />
              Configura tu Quiz
            </CardTitle>
            <CardDescription className="text-spotify-subtext">
              {quizType === "ai" ? "Configura tu quiz generado por IA" : "Configura tu quiz de preguntas predefinidas"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="format" className="text-spotify-text">
                Formato de Preguntas
              </Label>
              <RadioGroup id="format" value={format} onValueChange={setFormat} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="truefalse"
                    id="truefalse"
                    className="border-spotify-primary text-spotify-primary"
                  />
                  <Label htmlFor="truefalse" className="text-spotify-text">
                    Verdadero/Falso
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="multiplechoice"
                    id="multiplechoice"
                    className="border-spotify-primary text-spotify-primary"
                  />
                  <Label htmlFor="multiplechoice" className="text-spotify-text">
                    Opción Múltiple
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount" className="text-spotify-text">
                Número de Preguntas
              </Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger id="questionCount" className="bg-spotify-card border-spotify-border text-spotify-text">
                  <SelectValue placeholder="Selecciona el número de preguntas" />
                </SelectTrigger>
                <SelectContent className="bg-spotify-card border-spotify-border text-spotify-text">
                  <SelectItem value="5">5 preguntas</SelectItem>
                  <SelectItem value="10">10 preguntas</SelectItem>
                  <SelectItem value="20">20 preguntas</SelectItem>
                  <SelectItem value="30">30 preguntas</SelectItem>
                  <SelectItem value="all">Todas las preguntas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {quizType === "predefined" && (
              <div className="space-y-2">
                <Label htmlFor="questionOrder" className="text-spotify-text">
                  Orden de las Preguntas
                </Label>
                <RadioGroup
                  id="questionOrder"
                  value={questionOrder}
                  onValueChange={setQuestionOrder}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="random"
                      id="random"
                      className="border-spotify-primary text-spotify-primary"
                    />
                    <Label htmlFor="random" className="text-spotify-text">
                      Orden Aleatorio
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="sequential"
                      id="sequential"
                      className="border-spotify-primary text-spotify-primary"
                    />
                    <Label htmlFor="sequential" className="text-spotify-text">
                      Orden Secuencial
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="questionsPerSection" className="text-spotify-text">
                Preguntas Por Sección
              </Label>
              <RadioGroup
                id="questionsPerSection"
                value={questionsPerSection}
                onValueChange={setQuestionsPerSection}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="section5" className="border-spotify-primary text-spotify-primary" />
                  <Label htmlFor="section5" className="text-spotify-text">
                    5 preguntas por sección
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="section10" className="border-spotify-primary text-spotify-primary" />
                  <Label htmlFor="section10" className="text-spotify-text">
                    10 preguntas por sección
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartQuiz} className="w-full spotify-button">
              Comenzar Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
