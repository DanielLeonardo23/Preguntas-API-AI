import { NextResponse } from "next/server"
import type { Question } from "@/types/question"

export async function POST(request: Request) {
  try {
    const { questions, answers } = await request.json()

    // Calculate how many correct answers
    let correctCount = 0
    const results = questions.map((question: Question, index: number) => {
      const userAnswer = answers[index] || "Sin respuesta"
      const isCorrect = userAnswer.toLowerCase() === question.correctAnswer?.toLowerCase()
      if (isCorrect) correctCount++

      return {
        question: question.text,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation || "",
        options: question.options || [],
      }
    })

    const percentage = Math.round((correctCount / questions.length) * 100)

    // Generate fallback feedback
    const fallbackFeedback = generateFallbackFeedback(questions, answers, correctCount, percentage)

    try {
      // Try to call Gemini API directly
      const apiKey = process.env.GEMINI_API_KEY

      if (!apiKey) {
        console.error("Gemini API key is not configured")
        return NextResponse.json({ feedback: fallbackFeedback })
      }

      // Create a prompt for Gemini
      const prompt = `
      Acabo de completar una sección de quiz sobre conceptos de inteligencia artificial. 
      Obtuve ${correctCount} de ${questions.length} preguntas correctas (${percentage}%).
      
      Aquí están las preguntas y mis respuestas:
      ${results
        .map((result, i) => {
          let questionInfo = `Pregunta ${i + 1}: ${result.question}\n`

          if (result.options && result.options.length > 0) {
            questionInfo += `Opciones:\n`
            result.options.forEach((option) => {
              questionInfo += `- ${option}${option === result.correctAnswer ? " (CORRECTA)" : ""}\n`
            })
          }

          questionInfo += `Mi respuesta: ${result.userAnswer}\n`
          questionInfo += `Respuesta correcta: ${result.correctAnswer}\n`
          questionInfo += `Resultado: ${result.isCorrect ? "Correcta" : "Incorrecta"}\n`

          if (result.explanation) {
            questionInfo += `Explicación: ${result.explanation}\n`
          }

          return questionInfo
        })
        .join("\n\n")}
      
      Por favor, proporciona:
      1. Una breve evaluación de mi desempeño general
      2. Retroalimentación DETALLADA para CADA pregunta, especialmente las que respondí incorrectamente
      3. Para cada pregunta, explica POR QUÉ la respuesta correcta es correcta y POR QUÉ las otras opciones son incorrectas (si aplica)
      4. IMPORTANTE: Menciona EXPLÍCITAMENTE cuál es la alternativa correcta en cada explicación
      5. Sugerencias específicas para mejorar mi comprensión de estos conceptos
      
      Formatea tu respuesta como HTML que se pueda insertar directamente en una página web. Usa etiquetas <h3>, <p>, <ul>, <li>, <div>, <strong> y otras etiquetas HTML según sea necesario.
      
      IMPORTANTE: 
      - Toda la retroalimentación DEBE estar en español.
      - Incluye una sección para CADA pregunta con su retroalimentación específica.
      - Usa <div class="question-feedback"> para envolver la retroalimentación de cada pregunta individual.
      - SIEMPRE menciona explícitamente cuál es la alternativa correcta en cada explicación, por ejemplo: "La respuesta correcta es C: Un sistema de IA cuyo funcionamiento interno es difícil de entender o interpretar."
      `

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        },
      )

      if (!response.ok) {
        console.error("Gemini API error:", response.status, response.statusText)
        return NextResponse.json({ feedback: fallbackFeedback })
      }

      const data = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error("Unexpected Gemini API response structure")
        return NextResponse.json({ feedback: fallbackFeedback })
      }

      const feedback = data.candidates[0].content.parts[0].text

      // If Gemini fails to provide a response, use the fallback
      if (!feedback) {
        console.log("No feedback from Gemini, using fallback")
        return NextResponse.json({ feedback: fallbackFeedback })
      }

      return NextResponse.json({ feedback })
    } catch (error) {
      console.error("Error generating feedback:", error)
      return NextResponse.json({ feedback: fallbackFeedback })
    }
  } catch (error) {
    console.error("Error processing feedback request:", error)

    // Generate generic fallback feedback if we can't even parse the request
    const genericFeedback = `
      <h3>Retroalimentación de la Sección</h3>
      <p>Gracias por completar esta sección del quiz.</p>
      <p>Debido a un error técnico, no podemos proporcionar retroalimentación detallada en este momento.</p>
      <p>Por favor, continúa con la siguiente sección o intenta nuevamente más tarde.</p>
    `

    return NextResponse.json({ feedback: genericFeedback })
  }
}

function generateFallbackFeedback(
  questions: Question[],
  answers: string[],
  correctCount: number,
  percentage: number,
): string {
  let feedback = `<h3>Retroalimentación de la Sección</h3>
    <p>Has respondido ${correctCount} de ${questions.length} preguntas correctamente (${percentage}%).</p>`

  if (percentage >= 80) {
    feedback += `<p>¡Excelente trabajo! Tienes una sólida comprensión de estos conceptos de IA.</p>`
  } else if (percentage >= 60) {
    feedback += `<p>¡Buen trabajo! Tienes un conocimiento decente de estos conceptos, pero hay margen para mejorar.</p>`
  } else {
    feedback += `<p>Podrías querer revisar estos conceptos más a fondo antes de continuar.</p>`
  }

  feedback += `<h4>Revisión de Preguntas:</h4>`

  questions.forEach((question, index) => {
    const isCorrect = answers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()
    const userAnswer = answers[index] || "Sin respuesta"

    feedback += `<div class="question-feedback mb-4 p-3 rounded ${isCorrect ? "bg-green-900 bg-opacity-10" : "bg-red-900 bg-opacity-10"}">
      <p class="font-medium text-spotify-text">Pregunta ${index + 1}: ${question.text}</p>
      
      ${
        question.options
          ? `<div class="mt-2 mb-2">
          <p class="text-spotify-subtext">Opciones:</p>
          <ul class="list-disc pl-5 text-spotify-subtext">
            ${question.options
              .map(
                (option) =>
                  `<li class="${option === question.correctAnswer ? "text-spotify-primary" : option === userAnswer && option !== question.correctAnswer ? "text-red-400" : ""}">${option}${option === question.correctAnswer ? " ✓" : option === userAnswer && option !== question.correctAnswer ? " ✗" : ""}</li>`,
              )
              .join("")}
          </ul>
        </div>`
          : `<div class="mt-2 mb-2">
          <p class="text-spotify-subtext">Tu respuesta: <span class="font-medium ${isCorrect ? "text-spotify-primary" : "text-red-400"}">${userAnswer}</span></p>
          <p class="text-spotify-subtext">Respuesta correcta: <span class="font-medium text-spotify-primary">${question.correctAnswer === "V" ? "Verdadero" : "Falso"}</span></p>
        </div>`
      }
      
      <div class="mt-2 p-2 bg-spotify-card rounded">
        <p class="font-medium text-spotify-text">Explicación:</p>
        <p class="text-spotify-subtext">
          ${
            question.options
              ? `La respuesta correcta es "${question.correctAnswer}". ${question.explanation}`
              : `La respuesta correcta es "${question.correctAnswer === "V" ? "Verdadero" : "Falso"}". ${question.explanation}`
          }
        </p>
        
        ${
          !isCorrect
            ? `<p class="text-spotify-subtext mt-2">
            <strong>Sugerencia para mejorar:</strong> Revisa cuidadosamente los conceptos relacionados con esta pregunta. 
            ${question.explanation ? "La explicación proporcionada puede ayudarte a entender mejor este tema." : ""}
          </p>`
            : ""
        }
      </div>
    </div>`
  })

  return feedback
}
