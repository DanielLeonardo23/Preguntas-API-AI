"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Check, X, ArrowRight, Home, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { parseQuestions } from "@/lib/parse-questions"
import { generateAIQuestions } from "@/lib/generate-ai-questions"
import { generateFeedback } from "@/lib/generate-feedback"
import type { Question } from "@/types/question"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useQuestionsLoader } from "@/components/questions-loader"

export default function QuizPage() {
  const searchParams = useSearchParams()
  const quizType = searchParams.get("type") || "predefined"
  const format = searchParams.get("format") || "truefalse"
  const count = searchParams.get("count") || "10"
  const order = searchParams.get("order") || "random"
  const perSection = Number.parseInt(searchParams.get("perSection") || "5")

  const { isLoaded, error: loaderError } = useQuestionsLoader()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [error, setError] = useState("")

  // Calculate sections
  const totalSections = Math.ceil(questions.length / perSection)
  const currentSectionQuestions = questions.slice(
    currentSectionIndex * perSection,
    (currentSectionIndex + 1) * perSection,
  )

  // Calculate progress
  const progress =
    questions.length > 0
      ? ((currentSectionIndex * perSection + Object.keys(answers).length) / questions.length) * 100
      : 0

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Si hay un error al cargar el archivo, mostramos el error
        if (loaderError) {
          setError(`Error al cargar el archivo de preguntas: ${loaderError}`)
          setLoading(false)
          return
        }

        // Si el archivo no se ha cargado aún, esperamos
        if (!isLoaded && quizType === "predefined") {
          console.log("Esperando a que se cargue el archivo de preguntas...")
          return
        }

        setLoading(true)
        setError("")
        let loadedQuestions: Question[] = []

        if (quizType === "predefined") {
          loadedQuestions = await parseQuestions(count, order, format)
        } else {
          loadedQuestions = await generateAIQuestions(count, format)
        }

        if (loadedQuestions.length === 0) {
          setError("No se encontraron o generaron preguntas. Por favor, inténtalo de nuevo.")
        } else {
          setQuestions(loadedQuestions)
        }
      } catch (err) {
        console.error("Error loading questions:", err)
        setError("Error al cargar las preguntas. Por favor, inténtalo de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [quizType, count, order, format, isLoaded, loaderError])

  const handleAnswer = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex + currentSectionIndex * perSection]: answer,
    }))
  }

  const handleSubmitSection = async () => {
    // Check if all questions in the section are answered
    const allAnswered = currentSectionQuestions.every(
      (_, index) => answers[index + currentSectionIndex * perSection] !== undefined,
    )

    if (!allAnswered) {
      alert("Por favor, responde todas las preguntas antes de enviar.")
      return
    }

    // If this is the last section, show results
    if (currentSectionIndex === totalSections - 1) {
      setShowResults(true)
    } else {
      // Generate feedback for this section
      try {
        setLoadingFeedback(true)
        const sectionQuestions = currentSectionQuestions
        const sectionAnswers = sectionQuestions.map((_, index) => answers[index + currentSectionIndex * perSection])

        const feedbackText = await generateFeedback(sectionQuestions, sectionAnswers)

        setFeedback(feedbackText)
      } catch (err) {
        console.error("Error generating feedback:", err)
        setFeedback(
          "<h3>Retroalimentación no disponible</h3><p>No pudimos generar retroalimentación en este momento. Por favor, continúa a la siguiente sección.</p>",
        )
      } finally {
        setLoadingFeedback(false)
      }
    }
  }

  const handleNextSection = () => {
    setCurrentSectionIndex((prev) => prev + 1)
    setFeedback("")
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((question, index) => {
      if (answers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()) {
        correct++
      }
    })
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-6 text-spotify-primary" />
          <p className="text-xl font-medium text-spotify-text">
            Cargando preguntas {quizType === "ai" ? "generadas por IA" : "predefinidas"}...
          </p>
          <p className="text-spotify-subtext mt-2">Esto puede tomar un momento, por favor espera.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-md mx-auto bg-spotify-card border-red-500">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-spotify-text">Error</AlertTitle>
          <AlertDescription className="text-spotify-subtext">{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Link href="/">
            <Button className="spotify-button">
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="spotify-card">
            <CardHeader>
              <CardTitle className="text-center text-spotify-text">Resultados del Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold mb-2 text-spotify-text">{score.percentage}%</p>
                <p className="text-spotify-subtext">
                  Has acertado {score.correct} de {score.total} preguntas
                </p>
              </div>

              <Separator className="bg-spotify-border" />

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const isCorrect = answers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()
                  const userAnswer = answers[index] || "Sin respuesta"

                  return (
                    <div key={index} className={isCorrect ? "spotify-correct" : "spotify-incorrect"}>
                      <div className="p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 rounded-full p-1 ${isCorrect ? "bg-spotify-primary bg-opacity-20 text-spotify-primary" : "bg-red-500 bg-opacity-20 text-red-500"}`}
                          >
                            {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          </div>
                          <div className="w-full">
                            <p className="font-medium text-spotify-text">{question.text}</p>

                            {question.options ? (
                              <div className="mt-2 grid gap-1">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded ${
                                      option === question.correctAnswer
                                        ? "bg-spotify-primary bg-opacity-10 text-spotify-primary"
                                        : option === userAnswer && option !== question.correctAnswer
                                          ? "bg-red-500 bg-opacity-10 text-red-500"
                                          : ""
                                    }`}
                                  >
                                    {option}
                                    {option === question.correctAnswer
                                      ? " ✓"
                                      : option === userAnswer && option !== question.correctAnswer
                                        ? " ✗"
                                        : ""}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm">
                                <p className="text-spotify-subtext">
                                  Tu respuesta:{" "}
                                  <span
                                    className={`font-medium ${isCorrect ? "text-spotify-primary" : "text-red-400"}`}
                                  >
                                    {userAnswer}
                                  </span>
                                </p>
                                <p className="text-spotify-subtext">
                                  Respuesta correcta:{" "}
                                  <span className="font-medium text-spotify-primary">{question.correctAnswer}</span>
                                </p>
                              </div>
                            )}

                            {question.explanation && (
                              <div className="mt-3 p-3 bg-spotify-card border-l-4 border-spotify-primary rounded">
                                <p className="font-medium text-spotify-text">Explicación:</p>
                                <p className="text-spotify-subtext">
                                  {question.options
                                    ? `La respuesta correcta es "${question.correctAnswer}". ${question.explanation}`
                                    : `La respuesta correcta es "${question.correctAnswer === "V" ? "Verdadero" : "Falso"}". ${question.explanation}`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/" className="block w-full sm:w-auto">
                  <Button variant="outline" className="w-full spotify-button-outline">
                    <Home className="mr-2 h-4 w-4" />
                    Volver al Inicio
                  </Button>
                </Link>
                <Link href={`/configure?type=${quizType}`} className="block w-full sm:w-auto">
                  <Button className="w-full spotify-button">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Realizar Otro Quiz
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (feedback) {
    // Convertimos el feedback a un formato más limpio para mostrar
    const cleanFeedback = () => {
      try {
        // Extraemos solo la información relevante del feedback
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = feedback

        // Obtenemos el título y la evaluación general
        const title = tempDiv.querySelector("h3")?.textContent || "Retroalimentación de la Sección"
        const generalEvaluation = Array.from(tempDiv.querySelectorAll("p"))
          .filter((p) => !p.closest(".question-feedback"))
          .map((p) => p.textContent)
          .join(" ")

        // Obtenemos las preguntas individuales
        const questionFeedbacks = Array.from(tempDiv.querySelectorAll(".question-feedback")).map((qf) => {
          const questionText = qf.querySelector("p.font-medium")?.textContent || ""
          const explanation = qf.querySelector(".bg-spotify-card p.text-spotify-subtext")?.textContent || ""
          return { questionText, explanation }
        })

        return { title, generalEvaluation, questionFeedbacks }
      } catch (e) {
        console.error("Error al limpiar el feedback:", e)
        return null
      }
    }

    const cleanedFeedback = cleanFeedback()

    // Si no podemos limpiar el feedback, mostramos el original
    if (!cleanedFeedback) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="spotify-card">
              <CardHeader>
                <CardTitle className="text-center text-spotify-text">Retroalimentación de la Sección</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-spotify-text prose-headings:text-spotify-text prose-p:text-spotify-subtext prose-li:text-spotify-subtext prose-strong:text-spotify-text">
                  <div dangerouslySetInnerHTML={{ __html: feedback }} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNextSection} className="w-full spotify-button">
                  Siguiente Sección
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )
    }

    // Mostramos el feedback limpio en un formato similar a los resultados finales
    const sectionQuestions = currentSectionQuestions
    const sectionAnswers = sectionQuestions.map((_, index) => answers[index + currentSectionIndex * perSection])

    // Calculamos cuántas respuestas correctas hay en esta sección
    let correctCount = 0
    sectionQuestions.forEach((question, index) => {
      if (sectionAnswers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()) {
        correctCount++
      }
    })

    const percentage = Math.round((correctCount / sectionQuestions.length) * 100)

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="spotify-card">
            <CardHeader>
              <CardTitle className="text-center text-spotify-text">Retroalimentación de la Sección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold mb-2 text-spotify-text">{percentage}%</p>
                <p className="text-spotify-subtext">
                  Has acertado {correctCount} de {sectionQuestions.length} preguntas
                </p>
              </div>

              {cleanedFeedback.generalEvaluation && (
                <div className="p-4 bg-spotify-card rounded-lg">
                  <p className="text-spotify-subtext">{cleanedFeedback.generalEvaluation}</p>
                </div>
              )}

              <Separator className="bg-spotify-border" />

              <div className="space-y-4">
                {sectionQuestions.map((question, index) => {
                  const isCorrect = sectionAnswers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()
                  const userAnswer = sectionAnswers[index] || "Sin respuesta"

                  return (
                    <div key={index} className={isCorrect ? "spotify-correct" : "spotify-incorrect"}>
                      <div className="p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 rounded-full p-1 ${isCorrect ? "bg-spotify-primary bg-opacity-20 text-spotify-primary" : "bg-red-500 bg-opacity-20 text-red-500"}`}
                          >
                            {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                          </div>
                          <div className="w-full">
                            <p className="font-medium text-spotify-text">{question.text}</p>

                            {question.options ? (
                              <div className="mt-2 grid gap-1">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded ${
                                      option === question.correctAnswer
                                        ? "bg-spotify-primary bg-opacity-10 text-spotify-primary"
                                        : option === userAnswer && option !== question.correctAnswer
                                          ? "bg-red-500 bg-opacity-10 text-red-500"
                                          : ""
                                    }`}
                                  >
                                    {option}
                                    {option === question.correctAnswer
                                      ? " ✓"
                                      : option === userAnswer && option !== question.correctAnswer
                                        ? " ✗"
                                        : ""}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm">
                                <p className="text-spotify-subtext">
                                  Tu respuesta:{" "}
                                  <span
                                    className={`font-medium ${isCorrect ? "text-spotify-primary" : "text-red-400"}`}
                                  >
                                    {userAnswer}
                                  </span>
                                </p>
                                <p className="text-spotify-subtext">
                                  Respuesta correcta:{" "}
                                  <span className="font-medium text-spotify-primary">{question.correctAnswer}</span>
                                </p>
                              </div>
                            )}

                            <div className="mt-3 p-3 bg-spotify-card border-l-4 border-spotify-primary rounded">
                              <p className="font-medium text-spotify-text">Explicación:</p>
                              <p className="text-spotify-subtext">
                                {question.options
                                  ? `La respuesta correcta es "${question.correctAnswer}". ${question.explanation}`
                                  : `La respuesta correcta es "${question.correctAnswer === "V" ? "Verdadero" : "Falso"}". ${question.explanation}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNextSection} className="w-full spotify-button">
                Siguiente Sección
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-spotify-subtext">
              Sección {currentSectionIndex + 1} de {totalSections}
            </p>
            <p className="text-sm text-spotify-subtext">
              {Math.min((currentSectionIndex + 1) * perSection, questions.length)} de {questions.length} preguntas
            </p>
          </div>
          <div className="spotify-progress">
            <div className="spotify-progress-value" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="space-y-6">
          {currentSectionQuestions.map((question, index) => {
            const questionIndex = index + currentSectionIndex * perSection
            const selectedAnswer = answers[questionIndex]

            return (
              <Card key={index} className="spotify-card">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-spotify-text">
                    Pregunta {questionIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-spotify-text">{question.text}</p>

                  {format === "truefalse" && !question.options ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant={selectedAnswer === "V" ? "default" : "outline"}
                        onClick={() => handleAnswer(index, "V")}
                        className={selectedAnswer === "V" ? "flex-1 spotify-button" : "flex-1 spotify-button-outline"}
                      >
                        <Check className="mr-2 h-4 w-4" /> Verdadero
                      </Button>
                      <Button
                        variant={selectedAnswer === "F" ? "default" : "outline"}
                        onClick={() => handleAnswer(index, "F")}
                        className={selectedAnswer === "F" ? "flex-1 spotify-button" : "flex-1 spotify-button-outline"}
                      >
                        <X className="mr-2 h-4 w-4" /> Falso
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <Button
                          key={optIndex}
                          variant={selectedAnswer === option ? "default" : "outline"}
                          onClick={() => handleAnswer(index, option)}
                          className={`w-full justify-start text-left ${
                            selectedAnswer === option ? "spotify-button" : "spotify-button-outline"
                          }`}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6">
          <Button onClick={handleSubmitSection} className="w-full spotify-button" disabled={loadingFeedback}>
            {loadingFeedback ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generando Retroalimentación...
              </>
            ) : (
              <>{currentSectionIndex === totalSections - 1 ? "Finalizar Quiz" : "Enviar Sección"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
