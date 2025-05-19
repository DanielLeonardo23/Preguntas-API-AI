import type { Question } from "@/types/question"

export async function generateAIQuestions(count: string, format: string): Promise<Question[]> {
  try {
    const numQuestions = count === "all" ? 10 : Number.parseInt(count)

    // Generamos una semilla aleatoria para asegurar variabilidad
    const seed = Date.now()

    // Call the API to generate questions with the seed
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count: numQuestions,
        format: format,
        seed: seed, // Pasamos la semilla al API
      }),
    })

    if (!response.ok) {
      console.error("Failed to generate questions:", await response.text())
      throw new Error("Failed to generate questions")
    }

    const data = await response.json()

    // Verify that the questions have the correct format
    const questions = data.questions.map((q: Question) => {
      if (format === "multiplechoice" && (!q.options || q.options.length !== 4)) {
        return convertToMultipleChoice(q)
      } else if (format === "truefalse" && q.options) {
        return convertToTrueFalse(q)
      }
      return q
    })

    return questions
  } catch (error) {
    console.error("Error generating AI questions:", error)

    // Return fallback questions if API call fails
    return getFallbackQuestions(count, format)
  }
}

// Helper function to convert a question to multiple choice format
function convertToMultipleChoice(question: Question): Question {
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
      correctAnswer = "Verdadero, esta afirmación es correcta"
      options = [
        "Verdadero, esta afirmación es correcta",
        "Falso, esta afirmación es incorrecta",
        "No se puede determinar con la información dada",
        "La afirmación es parcialmente correcta",
      ]
    } else {
      correctAnswer = "Falso, esta afirmación es incorrecta"
      options = [
        "Verdadero, esta afirmación es correcta",
        "Falso, esta afirmación es incorrecta",
        "No se puede determinar con la información dada",
        "La afirmación es parcialmente correcta",
      ]
    }
  } else {
    // For other types of questions, generate generic options
    options = [
      correctAnswer, // The correct answer
      "Esta opción es incorrecta",
      "Esta opción también es incorrecta",
      "Ninguna de las anteriores es correcta",
    ]
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

function getFallbackQuestions(count: string, format: string): Question[] {
  const numQuestions = count === "all" ? 10 : Number.parseInt(count)

  // Usamos una semilla aleatoria para variar las preguntas
  const seed = Date.now()
  const randomGenerator = createRandomGenerator(seed)

  const fallbackTrueFalseQuestions = [
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
    {
      id: 6,
      text: "El algoritmo A* garantiza encontrar la solución óptima si la heurística es admisible.",
      correctAnswer: "V",
      explanation:
        "Una heurística admisible nunca sobreestima el costo real, lo que garantiza que A* encuentre la solución óptima.",
    },
    {
      id: 7,
      text: "La programación lógica es un paradigma de programación basado en la lógica formal.",
      correctAnswer: "V",
      explanation:
        "La programación lógica utiliza reglas lógicas y hechos para resolver problemas, siendo Prolog uno de sus lenguajes más conocidos.",
    },
    {
      id: 8,
      text: "Los algoritmos genéticos se inspiran en el proceso de selección natural.",
      correctAnswer: "V",
      explanation:
        "Los algoritmos genéticos utilizan conceptos como mutación, cruce y selección para evolucionar soluciones a problemas complejos.",
    },
    {
      id: 9,
      text: "El procesamiento del lenguaje natural es una tarea resuelta completamente por la IA actual.",
      correctAnswer: "F",
      explanation:
        "Aunque ha habido avances significativos, el procesamiento del lenguaje natural sigue siendo un desafío con muchos problemas abiertos.",
    },
    {
      id: 10,
      text: "La visión por computadora puede considerarse un problema resuelto en la IA moderna.",
      correctAnswer: "F",
      explanation:
        "La visión por computadora sigue enfrentando desafíos en entornos no controlados y en tareas que requieren comprensión contextual profunda.",
    },
    {
      id: 11,
      text: "Las redes neuronales convolucionales son especialmente efectivas para el procesamiento de imágenes.",
      correctAnswer: "V",
      explanation:
        "Las CNN están diseñadas para detectar patrones espaciales en datos como imágenes, lo que las hace muy efectivas para tareas de visión por computadora.",
    },
    {
      id: 12,
      text: "El aprendizaje por refuerzo es un tipo de aprendizaje supervisado.",
      correctAnswer: "F",
      explanation:
        "El aprendizaje por refuerzo es un paradigma distinto al aprendizaje supervisado, donde un agente aprende a través de la interacción con un entorno y recibe recompensas.",
    },
    {
      id: 13,
      text: "La computación cuántica puede resolver todos los problemas NP-completos en tiempo polinomial.",
      correctAnswer: "F",
      explanation:
        "Aunque la computación cuántica ofrece ventajas para ciertos problemas, no hay pruebas de que pueda resolver todos los problemas NP-completos en tiempo polinomial.",
    },
    {
      id: 14,
      text: "El problema del viajante (TSP) es un problema P.",
      correctAnswer: "F",
      explanation:
        "El problema del viajante es NP-difícil, lo que significa que no se conoce un algoritmo que lo resuelva en tiempo polinomial.",
    },
    {
      id: 15,
      text: "Las redes neuronales recurrentes son adecuadas para procesar datos secuenciales como texto o series temporales.",
      correctAnswer: "V",
      explanation:
        "Las RNN tienen conexiones que forman ciclos, lo que les permite mantener un estado interno que captura información sobre secuencias.",
    },
  ]

  const fallbackMultipleChoiceQuestions = [
    {
      id: 1,
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
      id: 2,
      text: "¿Qué algoritmo de búsqueda garantiza encontrar la solución óptima si existe?",
      options: ["Búsqueda en profundidad", "Búsqueda en amplitud", "Búsqueda A*", "Ascenso de colina"],
      correctAnswer: "Búsqueda A*",
      explanation:
        "La búsqueda A* garantiza encontrar la solución óptima si la función heurística es admisible (nunca sobreestima el costo).",
    },
    {
      id: 3,
      text: "¿Quién es considerado el 'padre de la inteligencia artificial'?",
      options: ["Alan Turing", "John McCarthy", "Marvin Minsky", "Herbert Simon"],
      correctAnswer: "John McCarthy",
      explanation:
        "John McCarthy acuñó el término 'inteligencia artificial' en 1956 y organizó la Conferencia de Dartmouth que lanzó el campo.",
    },
    {
      id: 4,
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
      id: 5,
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
    {
      id: 6,
      text: "¿Cuál es el principal objetivo del aprendizaje por refuerzo?",
      options: [
        "Maximizar una señal de recompensa a lo largo del tiempo",
        "Clasificar datos en categorías predefinidas",
        "Encontrar patrones ocultos en datos no etiquetados",
        "Generar nuevos datos similares a los datos de entrenamiento",
      ],
      correctAnswer: "Maximizar una señal de recompensa a lo largo del tiempo",
      explanation:
        "El aprendizaje por refuerzo busca que un agente aprenda a tomar decisiones que maximicen una recompensa acumulativa a lo largo del tiempo.",
    },
    {
      id: 7,
      text: "¿Qué tipo de red neuronal es especialmente efectiva para el procesamiento de imágenes?",
      options: [
        "Redes neuronales convolucionales (CNN)",
        "Redes neuronales recurrentes (RNN)",
        "Perceptrón multicapa (MLP)",
        "Redes de creencia profunda (DBN)",
      ],
      correctAnswer: "Redes neuronales convolucionales (CNN)",
      explanation:
        "Las CNN están diseñadas específicamente para procesar datos con estructura de cuadrícula como imágenes, utilizando operaciones de convolución para detectar características.",
    },
    {
      id: 8,
      text: "¿Qué es el problema del sobreajuste (overfitting) en machine learning?",
      options: [
        "Cuando un modelo aprende demasiado de los datos de entrenamiento y funciona mal con datos nuevos",
        "Cuando un modelo es demasiado simple para capturar la complejidad de los datos",
        "Cuando los datos de entrenamiento son insuficientes",
        "Cuando el algoritmo tarda demasiado en converger",
      ],
      correctAnswer: "Cuando un modelo aprende demasiado de los datos de entrenamiento y funciona mal con datos nuevos",
      explanation:
        "El sobreajuste ocurre cuando un modelo se ajusta demasiado a los detalles y ruido en los datos de entrenamiento, perdiendo capacidad de generalización.",
    },
    {
      id: 9,
      text: "¿Qué es un agente inteligente en IA?",
      options: [
        "Una entidad que percibe su entorno y actúa para maximizar sus objetivos",
        "Un programa que puede pasar el test de Turing",
        "Un robot con capacidades de procesamiento de lenguaje natural",
        "Un sistema experto que utiliza reglas predefinidas",
      ],
      correctAnswer: "Una entidad que percibe su entorno y actúa para maximizar sus objetivos",
      explanation:
        "Un agente inteligente es cualquier entidad que percibe su entorno a través de sensores y actúa sobre ese entorno mediante actuadores para lograr sus objetivos.",
    },
    {
      id: 10,
      text: "¿Qué es el aprendizaje profundo (deep learning)?",
      options: [
        "Un subconjunto del machine learning basado en redes neuronales con múltiples capas",
        "Un método para analizar datos en profundidad",
        "Un algoritmo específico para resolver problemas complejos",
        "Una técnica para comprimir grandes conjuntos de datos",
      ],
      correctAnswer: "Un subconjunto del machine learning basado en redes neuronales con múltiples capas",
      explanation:
        "El aprendizaje profundo es un subconjunto del machine learning que utiliza redes neuronales con múltiples capas (profundas) para modelar abstracciones de alto nivel en los datos.",
    },
    {
      id: 11,
      text: "¿Cuál de los siguientes NO es un tipo de función de activación en redes neuronales?",
      options: ["ReLU", "Sigmoid", "Tanh", "Logarítmica"],
      correctAnswer: "Logarítmica",
      explanation:
        "ReLU, Sigmoid y Tanh son funciones de activación comunes en redes neuronales. La función logarítmica no se usa típicamente como función de activación.",
    },
    {
      id: 12,
      text: "¿Qué algoritmo se utiliza para entrenar redes neuronales?",
      options: ["Retropropagación (Backpropagation)", "K-means", "Árboles de decisión", "Naive Bayes"],
      correctAnswer: "Retropropagación (Backpropagation)",
      explanation:
        "La retropropagación es el algoritmo estándar para entrenar redes neuronales, ajustando los pesos mediante el cálculo del gradiente de la función de pérdida.",
    },
    {
      id: 13,
      text: "¿Qué es el aprendizaje por transferencia (transfer learning)?",
      options: [
        "Usar un modelo pre-entrenado en una tarea para otra tarea relacionada",
        "Transferir datos de entrenamiento entre diferentes algoritmos",
        "Mover un modelo de un servidor a otro",
        "Convertir un modelo de un formato a otro",
      ],
      correctAnswer: "Usar un modelo pre-entrenado en una tarea para otra tarea relacionada",
      explanation:
        "El aprendizaje por transferencia aprovecha el conocimiento adquirido en una tarea para mejorar el rendimiento en otra tarea relacionada, ahorrando tiempo y recursos.",
    },
    {
      id: 14,
      text: "¿Qué es GPT en el contexto de la IA?",
      options: [
        "Un modelo de lenguaje basado en transformers",
        "Un algoritmo de búsqueda gráfica",
        "Un protocolo de transferencia generalizada",
        "Un tipo de red neuronal convolucional",
      ],
      correctAnswer: "Un modelo de lenguaje basado en transformers",
      explanation:
        "GPT (Generative Pre-trained Transformer) es una familia de modelos de lenguaje basados en la arquitectura transformer, diseñados para generar texto coherente y contextualmente relevante.",
    },
    {
      id: 15,
      text: "¿Qué es el aprendizaje no supervisado?",
      options: [
        "Aprendizaje a partir de datos no etiquetados",
        "Aprendizaje sin supervisión humana",
        "Aprendizaje a partir de ejemplos negativos",
        "Aprendizaje sin retroalimentación",
      ],
      correctAnswer: "Aprendizaje a partir de datos no etiquetados",
      explanation:
        "El aprendizaje no supervisado es un tipo de aprendizaje automático donde el algoritmo aprende patrones a partir de datos no etiquetados, sin tener respuestas correctas predefinidas.",
    },
  ]

  // Mezclamos las preguntas para introducir variabilidad
  const fallbackQuestions =
    format === "truefalse" ? [...fallbackTrueFalseQuestions] : [...fallbackMultipleChoiceQuestions]
  shuffleArrayWithSeed(fallbackQuestions, randomGenerator)

  // Return the appropriate number of questions
  const result: Question[] = []
  for (let i = 0; i < numQuestions; i++) {
    const question = { ...fallbackQuestions[i % fallbackQuestions.length] }
    question.id = i + 1

    // Añadimos una pequeña variación al texto para simular diferentes preguntas
    question.text = `${question.text} (Variante ${Math.floor(randomGenerator() * 1000)})`

    result.push(question)
  }

  return result
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
