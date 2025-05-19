import type { Question } from "@/types/question"

export async function generateFeedback(questions: Question[], answers: string[]): Promise<string> {
  try {
    // Call the API to generate feedback
    const response = await fetch("/api/generate-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questions,
        answers,
      }),
    })

    if (!response.ok) {
      console.error("Failed to generate feedback:", await response.text())
      throw new Error("Failed to generate feedback")
    }

    const data = await response.json()
    return data.feedback
  } catch (error) {
    console.error("Error generating feedback:", error)

    // Generate fallback feedback if API call fails
    return generateFallbackFeedback(questions, answers)
  }
}

function generateFallbackFeedback(questions: Question[], answers: string[]): string {
  // Calculate how many correct answers
  let correctCount = 0
  questions.forEach((question, index) => {
    if (answers[index]?.toLowerCase() === question.correctAnswer?.toLowerCase()) {
      correctCount++
    }
  })

  const percentage = Math.round((correctCount / questions.length) * 100)

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
