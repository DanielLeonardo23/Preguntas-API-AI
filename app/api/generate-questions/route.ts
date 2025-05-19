import { NextResponse } from "next/server"
import type { Question } from "@/types/question"

export async function POST(request: Request) {
  try {
    const { count, format, seed = Date.now() } = await request.json()
    const numQuestions = count === "all" ? 10 : Number.parseInt(count)

    console.log(`Generando ${numQuestions} preguntas en formato ${format} con semilla ${seed}`)

    // Creamos un generador de números aleatorios con la semilla
    const randomGenerator = createRandomGenerator(seed)

    // Use fallback questions by default
    let generatedQuestions = generateFallbackQuestions(numQuestions, format, randomGenerator)

    try {
      // Try to get sample questions, but don't fail if this doesn't work
      const sampleQuestions = await getSampleQuestions(request)

      // Only proceed with Gemini if we have sample questions
      if (sampleQuestions && sampleQuestions.length > 0) {
        // Create a prompt for Gemini
        const prompt = `
        Genera ${numQuestions} preguntas de ${format === "truefalse" ? "verdadero/falso" : "opción múltiple"} sobre conceptos de inteligencia artificial.
        
        Aquí hay algunos ejemplos de preguntas para basar tu estilo:
        ${sampleQuestions.map((q: Question) => `- ${q.text} (${q.correctAnswer})`).join("\n")}
        
        ${
          format === "multiplechoice"
            ? `IMPORTANTE: DEBES generar preguntas de opción múltiple con EXACTAMENTE 4 opciones (A, B, C, D) para cada pregunta.
        Cada pregunta debe tener un campo "options" que sea un array con 4 opciones.
        La respuesta correcta debe ser una de estas opciones exactamente como aparece en el array.`
            : `Las preguntas deben ser de verdadero/falso, donde la respuesta correcta es "V" para verdadero o "F" para falso.`
        }
        
        Para cada pregunta, proporciona:
        1. El texto de la pregunta
        2. La respuesta correcta ${
          format === "multiplechoice"
            ? "(debe ser exactamente una de las opciones A, B, C o D)"
            : "(V para verdadero, F para falso)"
        }
        ${format === "multiplechoice" ? "3. Cuatro opciones posibles (A, B, C, D)" : ""}
        4. Una breve explicación en español de por qué la respuesta es correcta
        
        Formatea tu respuesta como un array JSON con objetos que contengan los campos "text", "correctAnswer"${
          format === "multiplechoice" ? ', "options"' : ""
        } y "explanation".
        
        IMPORTANTE: 
        - Todas las preguntas, respuestas y explicaciones DEBEN estar en español.
        - Usa la semilla aleatoria ${seed} para generar variabilidad en las preguntas.
        - Asegúrate de que las preguntas sean variadas y cubran diferentes aspectos de la IA.
        `

        // Try to call Gemini API
        const geminiQuestions = await callGeminiAPI(request, prompt, seed)
        if (geminiQuestions && geminiQuestions.length > 0) {
          // Verify and fix the format of the questions
          const validatedQuestions = geminiQuestions.map((q: Question) => {
            // Ensure the question has the correct format
            if (format === "multiplechoice" && (!q.options || q.options.length !== 4)) {
              // If options are missing or not exactly 4, generate them
              return convertToMultipleChoice(q, randomGenerator)
            } else if (format === "truefalse" && (q.options || (q.correctAnswer !== "V" && q.correctAnswer !== "F"))) {
              // If it's supposed to be true/false but has options or incorrect answer format
              return convertToTrueFalse(q)
            }
            return q
          })

          generatedQuestions = validatedQuestions
        }
      }
    } catch (apiError) {
      console.error("Error in API calls:", apiError)
      // Continue with fallback questions
    }

    // Ensure we have the right number of questions
    if (generatedQuestions.length < numQuestions) {
      const additionalQuestions = generateFallbackQuestions(
        numQuestions - generatedQuestions.length,
        format,
        randomGenerator,
      )
      generatedQuestions = [...generatedQuestions, ...additionalQuestions]
    } else if (generatedQuestions.length > numQuestions) {
      generatedQuestions = generatedQuestions.slice(0, numQuestions)
    }

    // Add IDs to the questions and ensure format is correct
    generatedQuestions = generatedQuestions.map((q, i) => {
      const question = { ...q, id: i + 1 }

      // Final format check
      if (format === "multiplechoice" && (!question.options || question.options.length !== 4)) {
        return convertToMultipleChoice(question, randomGenerator)
      } else if (
        format === "truefalse" &&
        (question.options || (question.correctAnswer !== "V" && question.correctAnswer !== "F"))
      ) {
        return convertToTrueFalse(question)
      }

      return question
    })

    return NextResponse.json({ questions: generatedQuestions })
  } catch (error) {
    console.error("Error generating questions:", error)
    // Return fallback questions even in case of error
    const count = 10
    const format = "truefalse"
    const seed = Date.now()
    const randomGenerator = createRandomGenerator(seed)
    const fallbackQuestions = generateFallbackQuestions(count, format, randomGenerator).map((q, i) => ({
      ...q,
      id: i + 1,
    }))

    return NextResponse.json({ questions: fallbackQuestions })
  }
}

// Generador de números aleatorios con semilla
function createRandomGenerator(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Helper function to convert a question to multiple choice format
function convertToMultipleChoice(question: Question, randomGenerator: () => number): Question {
  // If it already has the correct format, return it
  if (question.options && question.options.length === 4 && question.options.includes(question.correctAnswer)) {
    return question
  }

  // Generate options based on the question type
  let options: string[] = []
  let correctAnswer = question.correctAnswer

  if (question.correctAnswer === "V" || question.correctAnswer === "F") {
    // Convert from true/false to multiple choice
    const isTrue = question.correctAnswer === "V"

    if (isTrue) {
      correctAnswer = "A"
      options = [
        "Verdadero, esta afirmación es correcta",
        "Falso, esta afirmación es incorrecta",
        "No se puede determinar con la información dada",
        "La afirmación es parcialmente correcta",
      ]
    } else {
      correctAnswer = "B"
      options = [
        "Verdadero, esta afirmación es correcta",
        "Falso, esta afirmación es incorrecta",
        "No se puede determinar con la información dada",
        "La afirmación es parcialmente correcta",
      ]
    }
  } else {
    // Para otros tipos de preguntas, generamos opciones genéricas
    // Pero usamos el generador aleatorio para introducir variabilidad
    const distractors = [
      "Esta opción es incorrecta",
      "Esta opción también es incorrecta",
      "Ninguna de las anteriores es correcta",
      "Esta alternativa no es válida",
      "Esta respuesta es falsa",
      "Esta opción no es la correcta",
      "Esta alternativa es errónea",
      "Esta no es la respuesta correcta",
    ]

    // Mezclamos los distractores
    const shuffledDistractors = [...distractors]
    for (let i = shuffledDistractors.length - 1; i > 0; i--) {
      const j = Math.floor(randomGenerator() * (i + 1))
      ;[shuffledDistractors[i], shuffledDistractors[j]] = [shuffledDistractors[j], shuffledDistractors[i]]
    }

    // Posición aleatoria para la respuesta correcta
    const correctPosition = Math.floor(randomGenerator() * 4)

    options = Array(4)
      .fill("")
      .map((_, i) => (i === correctPosition ? correctAnswer : shuffledDistractors[i < correctPosition ? i : i - 1]))

    // Actualizamos la respuesta correcta para que coincida con la opción
    correctAnswer = options[correctPosition]
  }

  return {
    ...question,
    options,
    correctAnswer,
  }
}

// Helper function to convert a question to true/false format
function convertToTrueFalse(question: Question): Question {
  // Default to false if we can't determine
  let correctAnswer = "F"

  // Try to determine if the question should be true or false
  if (question.correctAnswer) {
    const answer = question.correctAnswer.toLowerCase()
    if (
      answer.includes("verdadero") ||
      answer.includes("true") ||
      answer === "a" ||
      answer === "sí" ||
      answer === "si"
    ) {
      correctAnswer = "V"
    }
  }

  return {
    ...question,
    correctAnswer,
    options: undefined, // Remove options for true/false questions
  }
}

// Helper function to get sample questions
async function getSampleQuestions(request: Request): Promise<Question[]> {
  try {
    // Use direct import of questions instead of API call
    const hardcodedQuestions = getHardcodedQuestions()
    return hardcodedQuestions.slice(0, 5)
  } catch (error) {
    console.error("Error getting sample questions:", error)
    return []
  }
}

// Helper function to call Gemini API
async function callGeminiAPI(request: Request, prompt: string, seed: number): Promise<Question[]> {
  try {
    // Direct implementation of Gemini API call
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("Gemini API key is not configured")
      return []
    }

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
            seed: seed, // Usamos la semilla para la generación
          },
        }),
      },
    )

    if (!response.ok) {
      console.error("Gemini API error:", response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error("Unexpected Gemini API response structure")
      return []
    }

    const result = data.candidates[0].content.parts[0].text

    // Try to parse the JSON response from Gemini
    try {
      // Look for JSON array in the response
      const jsonMatch = result.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          return parsedQuestions
        }
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
    }

    return []
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return []
  }
}

// Hardcoded questions to avoid network requests
function getHardcodedQuestions(): Question[] {
  return [
    {
      id: 1,
      text: "La poda alfa-beta es una técnica de optimización para el algoritmo minimax.",
      correctAnswer: "V",
      explanation:
        "La poda alfa-beta reduce el número de nodos evaluados en el árbol de búsqueda eliminando ramas que no afectarán la decisión final.",
    },
    {
      id: 2,
      text: "El aprendizaje automático es un subconjunto de la inteligencia artificial que se centra en desarrollar sistemas que pueden aprender de los datos.",
      correctAnswer: "V",
      explanation:
        "El aprendizaje automático es efectivamente un subconjunto de la IA que permite a los sistemas aprender patrones a partir de datos sin ser programados explícitamente.",
    },
    {
      id: 3,
      text: "El test de Turing fue desarrollado para determinar si una máquina puede exhibir un comportamiento inteligente equivalente a un humano.",
      correctAnswer: "V",
      explanation:
        "Alan Turing propuso esta prueba en 1950 como una forma de evaluar la capacidad de una máquina para exhibir inteligencia similar a la humana.",
    },
    {
      id: 4,
      text: "El aprendizaje profundo requiere menos potencia computacional que los algoritmos tradicionales de aprendizaje automático.",
      correctAnswer: "F",
      explanation:
        "El aprendizaje profundo típicamente requiere recursos computacionales significativos debido a la complejidad de las redes neuronales con muchas capas.",
    },
    {
      id: 5,
      text: "Los sistemas expertos siempre utilizan redes neuronales como su tecnología subyacente.",
      correctAnswer: "F",
      explanation:
        "Los sistemas expertos típicamente utilizan sistemas basados en reglas y bases de conocimiento, no redes neuronales.",
    },
  ]
}

function generateFallbackQuestions(count: number, format: string, randomGenerator: () => number): Question[] {
  const questions: Question[] = []

  const fallbackTrueFalseQuestions = [
    {
      text: "La poda alfa-beta es una técnica de optimización para el algoritmo minimax.",
      correctAnswer: "V",
      explanation:
        "La poda alfa-beta reduce el número de nodos evaluados en el árbol de búsqueda eliminando ramas que no afectarán la decisión final.",
    },
    {
      text: "El aprendizaje automático es un subconjunto de la inteligencia artificial que se centra en desarrollar sistemas que pueden aprender de los datos.",
      correctAnswer: "V",
      explanation:
        "El aprendizaje automático es efectivamente un subconjunto de la IA que permite a los sistemas aprender patrones a partir de datos sin ser programados explícitamente.",
    },
    {
      text: "El test de Turing fue desarrollado para determinar si una máquina puede exhibir un comportamiento inteligente equivalente a un humano.",
      correctAnswer: "V",
      explanation:
        "Alan Turing propuso esta prueba en 1950 como una forma de evaluar la capacidad de una máquina para exhibir inteligencia similar a la humana.",
    },
    {
      text: "El aprendizaje profundo requiere menos potencia computacional que los algoritmos tradicionales de aprendizaje automático.",
      correctAnswer: "F",
      explanation:
        "El aprendizaje profundo típicamente requiere recursos computacionales significativos debido a la complejidad de las redes neuronales con muchas capas.",
    },
    {
      text: "Los sistemas expertos siempre utilizan redes neuronales como su tecnología subyacente.",
      correctAnswer: "F",
      explanation:
        "Los sistemas expertos típicamente utilizan sistemas basados en reglas y bases de conocimiento, no redes neuronales.",
    },
    {
      text: "El algoritmo A* garantiza encontrar la solución óptima si la heurística es admisible.",
      correctAnswer: "V",
      explanation:
        "Una heurística admisible nunca sobreestima el costo real, lo que garantiza que A* encuentre la solución óptima.",
    },
    {
      text: "La programación lógica es un paradigma de programación basado en la lógica formal.",
      correctAnswer: "V",
      explanation:
        "La programación lógica utiliza reglas lógicas y hechos para resolver problemas, siendo Prolog uno de sus lenguajes más conocidos.",
    },
    {
      text: "Los algoritmos genéticos se inspiran en el proceso de selección natural.",
      correctAnswer: "V",
      explanation:
        "Los algoritmos genéticos utilizan conceptos como mutación, cruce y selección para evolucionar soluciones a problemas complejos.",
    },
    {
      text: "El procesamiento del lenguaje natural es una tarea resuelta completamente por la IA actual.",
      correctAnswer: "F",
      explanation:
        "Aunque ha habido avances significativos, el procesamiento del lenguaje natural sigue siendo un desafío con muchos problemas abiertos.",
    },
    {
      text: "La visión por computadora puede considerarse un problema resuelto en la IA moderna.",
      correctAnswer: "F",
      explanation:
        "La visión por computadora sigue enfrentando desafíos en entornos no controlados y en tareas que requieren comprensión contextual profunda.",
    },
  ]

  const fallbackMultipleChoiceQuestions = [
    {
      text: "¿Cuál de los siguientes NO es un tipo de aprendizaje automático?",
      options: [
        "Aprendizaje supervisado",
        "Aprendizaje no supervisado",
        "Aprendizaje por refuerzo",
        "Aprendizaje cognitivo",
      ],
      correctAnswer: "Aprendizaje cognitivo",
      explanation:
        "Los tres tipos principales de aprendizaje automático son el aprendizaje supervisado, el aprendizaje no supervisado y el aprendizaje por refuerzo. El aprendizaje cognitivo no es un tipo estándar de aprendizaje automático.",
    },
    {
      text: "¿Qué algoritmo de búsqueda garantiza encontrar la solución óptima si existe?",
      options: ["Búsqueda en profundidad", "Búsqueda en amplitud", "Búsqueda A*", "Ascenso de colina"],
      correctAnswer: "Búsqueda A*",
      explanation:
        "La búsqueda A* garantiza encontrar la solución óptima si la función heurística es admisible (nunca sobreestima el costo).",
    },
    {
      text: "¿Quién es considerado el 'padre de la inteligencia artificial'?",
      options: ["Alan Turing", "John McCarthy", "Marvin Minsky", "Herbert Simon"],
      correctAnswer: "John McCarthy",
      explanation:
        "John McCarthy acuñó el término 'inteligencia artificial' en 1956 y organizó la Conferencia de Dartmouth que lanzó el campo.",
    },
    {
      text: "¿Cuál de las siguientes NO es una aplicación común de la inteligencia artificial?",
      options: [
        "Reconocimiento facial",
        "Diagnóstico médico",
        "Predicción del clima",
        "Generación de números verdaderamente aleatorios",
      ],
      correctAnswer: "Generación de números verdaderamente aleatorios",
      explanation:
        "La generación de números verdaderamente aleatorios es un problema fundamentalmente diferente que requiere procesos físicos, no algoritmos de IA.",
    },
    {
      text: "¿Qué técnica de IA se utiliza para encontrar patrones en grandes conjuntos de datos sin etiquetas?",
      options: [
        "Aprendizaje supervisado",
        "Aprendizaje no supervisado",
        "Aprendizaje por refuerzo",
        "Aprendizaje profundo",
      ],
      correctAnswer: "Aprendizaje no supervisado",
      explanation:
        "El aprendizaje no supervisado busca patrones y estructuras en datos sin etiquetar, como en el clustering y la reducción de dimensionalidad.",
    },
  ]

  // Hacemos una copia de las preguntas para no modificar las originales
  const fallbackQuestions =
    format === "truefalse" ? [...fallbackTrueFalseQuestions] : [...fallbackMultipleChoiceQuestions]

  // Mezclamos las preguntas usando el generador aleatorio
  for (let i = fallbackQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(randomGenerator() * (i + 1))
    ;[fallbackQuestions[i], fallbackQuestions[j]] = [fallbackQuestions[j], fallbackQuestions[i]]
  }

  for (let i = 0; i < count; i++) {
    // Añadimos variabilidad a las preguntas
    const baseQuestion = fallbackQuestions[i % fallbackQuestions.length]
    const variant = Math.floor(randomGenerator() * 1000)

    const question = {
      ...baseQuestion,
      text: `${baseQuestion.text} (Variante ${variant})`,
      explanation: `${baseQuestion.explanation} Esta es la variante ${variant}.`,
    }

    questions.push(question)
  }

  return questions
}
