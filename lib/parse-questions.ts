import type { Question } from "@/types/question"

export async function parseQuestions(count: string, order: string, format = "truefalse"): Promise<Question[]> {
  try {
    // Obtener todas las preguntas disponibles desde el archivo
    let questions = await getAllQuestions()

    // Si no hay preguntas, usar las hardcoded como fallback
    if (!questions || questions.length === 0) {
      console.warn("No se pudieron cargar preguntas del archivo, usando preguntas de respaldo")
      questions = getHardcodedQuestions()
    }

    console.log(`Total de preguntas disponibles: ${questions.length}`)

    // Convertir preguntas al formato solicitado si es necesario
    if (format === "multiplechoice") {
      questions = questions.map(convertToMultipleChoice)
    }

    // Randomizar si es necesario - SIEMPRE creamos una nueva copia para no modificar el original
    let selectedQuestions: Question[] = []

    if (order === "random") {
      // Usamos una semilla aleatoria basada en la hora actual para asegurar variabilidad
      const seed = Date.now()
      const randomGenerator = createRandomGenerator(seed)

      // Creamos un array con todos los índices y lo mezclamos
      const indices = Array.from({ length: questions.length }, (_, i) => i)
      shuffleArrayWithSeed(indices, randomGenerator)

      // Determinamos cuántas preguntas seleccionar
      const numQuestions = count === "all" ? questions.length : Math.min(Number.parseInt(count), questions.length)

      // Seleccionamos las preguntas según los índices mezclados
      selectedQuestions = indices.slice(0, numQuestions).map((index) => questions[index])

      console.log(`Seleccionadas ${selectedQuestions.length} preguntas aleatorias de ${questions.length}`)
    } else {
      // Orden secuencial
      selectedQuestions = [...questions]

      // Limitar el número de preguntas si es necesario
      if (count !== "all") {
        const numQuestions = Number.parseInt(count)
        selectedQuestions = selectedQuestions.slice(0, numQuestions)
      }
    }

    return selectedQuestions
  } catch (error) {
    console.error("Error parsing questions:", error)
    throw error
  }
}

// Función para obtener todas las preguntas del archivo
async function getAllQuestions(): Promise<Question[]> {
  try {
    // En un entorno de navegador, necesitamos hacer una solicitud para obtener el contenido del archivo
    const response = await fetch("/preguntas.txt")
    if (!response.ok) {
      throw new Error(`Error al cargar preguntas.txt: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    console.log(`Archivo preguntas.txt cargado, tamaño: ${text.length} bytes`)

    // Parsear el contenido del archivo
    return parseQuestionsFromText(text)
  } catch (error) {
    console.error("Error leyendo el archivo de preguntas:", error)
    return []
  }
}

// Función para parsear las preguntas desde el texto
function parseQuestionsFromText(text: string): Question[] {
  try {
    // Intentamos parsear como JSON primero
    try {
      const jsonData = JSON.parse(text)
      if (Array.isArray(jsonData)) {
        console.log(`Parseadas ${jsonData.length} preguntas desde JSON`)
        return jsonData
      }
    } catch (e) {
      console.log("El archivo no es JSON válido, intentando parsear como texto estructurado")
    }

    // Si no es JSON, asumimos que es un formato de texto estructurado
    // Dividimos por líneas y buscamos patrones
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const questions: Question[] = []
    let currentQuestion: Partial<Question> = {}

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Detectar si es una nueva pregunta (comienza con número o identificador)
      if (/^\d+[.):]/.test(line) || /^[Pp]regunta\s+\d+/.test(line)) {
        // Si ya teníamos una pregunta en proceso, la guardamos
        if (currentQuestion.text) {
          questions.push(currentQuestion as Question)
          currentQuestion = {}
        }

        // Extraer el texto de la pregunta
        const textMatch = line.match(/^\d+[.):]\s*(.+)/) || line.match(/^[Pp]regunta\s+\d+[:.)]\s*(.+)/)
        if (textMatch) {
          currentQuestion.text = textMatch[1].trim()
          currentQuestion.id = questions.length + 1
        }
      }
      // Detectar respuesta correcta
      else if (/^[Rr]espuesta:?\s*([VF]|[Vv]erdadero|[Ff]also)/i.test(line)) {
        const match = line.match(/^[Rr]espuesta:?\s*([VF]|[Vv]erdadero|[Ff]also)/i)
        if (match) {
          const answer = match[1].toUpperCase()
          currentQuestion.correctAnswer = answer.startsWith("V") ? "V" : "F"
        }
      }
      // Detectar explicación
      else if (/^[Ee]xplicaci[oó]n:?\s*(.+)/i.test(line)) {
        const match = line.match(/^[Ee]xplicaci[oó]n:?\s*(.+)/i)
        if (match) {
          currentQuestion.explanation = match[1].trim()
        }
      }
      // Si la línea no tiene un formato especial y no tenemos texto de pregunta aún,
      // asumimos que es el texto de la pregunta
      else if (!currentQuestion.text) {
        currentQuestion.text = line
        currentQuestion.id = questions.length + 1
      }
      // Si ya tenemos texto pero no explicación, asumimos que es la explicación
      else if (!currentQuestion.explanation) {
        currentQuestion.explanation = line
      }
    }

    // No olvidar añadir la última pregunta
    if (currentQuestion.text) {
      questions.push(currentQuestion as Question)
    }

    console.log(`Parseadas ${questions.length} preguntas desde texto estructurado`)
    return questions
  } catch (error) {
    console.error("Error parseando preguntas desde texto:", error)
    return []
  }
}

// Generador de números aleatorios con semilla
function createRandomGenerator(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Fisher-Yates shuffle con semilla aleatoria
function shuffleArrayWithSeed<T>(array: T[], randomGenerator: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomGenerator() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// Convert a true/false question to multiple choice
function convertToMultipleChoice(question: Question): Question {
  // If it's already multiple choice, return as is
  if (question.options && question.options.length > 0) {
    return question
  }

  // If it's a true/false question, convert it
  const isTrue = question.correctAnswer === "V"

  let options: string[]
  let correctAnswer: string

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

  return {
    ...question,
    options,
    correctAnswer,
  }
}

// Hardcoded questions to avoid network requests - solo se usan como fallback
function getHardcodedQuestions(): Question[] {
  return [
    {
      id: 1,
      text: "Programas nada parecidos al test de Turing: JULIA, ELIZA",
      correctAnswer: "F",
      explanation:
        "ELIZA y JULIA son programas que intentan simular conversación humana, lo que está relacionado con el test de Turing.",
    },
    {
      id: 2,
      text: "Ordenar un cubo mágico (esto es colocar el cubo de tal forma que cada cara del cubo tenga un solo color) es un problema de decisión.",
      correctAnswer: "F",
      explanation: "Ordenar un cubo mágico es un problema de localización, no un problema de decisión.",
    },
    // Mantenemos algunas preguntas hardcodeadas como fallback, pero solo se usarán si no se pueden cargar las del archivo
  ]
}
