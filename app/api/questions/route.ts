import { NextResponse } from "next/server"
import type { Question } from "@/types/question"

export async function GET() {
  try {
    // Return hardcoded questions
    const questions: Question[] = [
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
      {
        id: 3,
        text: "Los algoritmos de búsqueda con información presentan complejidad polinomial respecto al número de niveles del árbol de estado.",
        correctAnswer: "F",
        explanation:
          "Los algoritmos de búsqueda con información también pueden presentar complejidad no polinomial en el peor caso.",
      },
      {
        id: 4,
        text: "El desarrollo de sistemas de créditos financiero basados en reglas de negocio corresponde al paradigma sub-simbólico.",
        correctAnswer: "F",
        explanation:
          "Los sistemas basados en reglas de negocio corresponden al paradigma simbólico, no al sub-simbólico.",
      },
      {
        id: 5,
        text: "La inteligencia es exclusividad de las máquinas hechas de proteínas.",
        correctAnswer: "F",
        explanation:
          "La inteligencia no es exclusiva de los seres biológicos (máquinas hechas de proteínas), también puede existir en sistemas artificiales.",
      },
      {
        id: 6,
        text: "La inteligencia de los software de juego humano-máquina basados en búsqueda en un espacio de estado es dada por la función evaluadora, la estrategia de selección de la jugada a realizar, y los niveles del árbol de estado considerados.",
        correctAnswer: "V",
        explanation:
          "Estos tres elementos son los que determinan la inteligencia de los juegos basados en búsqueda en un espacio de estado.",
      },
      {
        id: 7,
        text: "Los sistemas de información gerencial corresponden a problemas de la inteligencia artificial.",
        correctAnswer: "F",
        explanation:
          "Los sistemas de información gerencial son sistemas de procesamiento de datos, no necesariamente problemas de inteligencia artificial.",
      },
      {
        id: 8,
        text: "La estrategia de diferencia de utilidades juega a la defensiva.",
        correctAnswer: "F",
        explanation: "La estrategia de diferencia de utilidades es considerada ofensiva, no defensiva.",
      },
      {
        id: 9,
        text: "Puede existir un problema no computable que sea intratable.",
        correctAnswer: "V",
        explanation:
          "Los problemas no computables son por definición intratables, ya que no existe un algoritmo que los resuelva.",
      },
      {
        id: 10,
        text: "Una alternativa para hacer que las estrategias de los juegos humano-máquina sean no definidas explícitamente es usar los algoritmos de aprendizaje automático (machine learning).",
        correctAnswer: "V",
        explanation:
          "El aprendizaje automático permite que las estrategias se desarrollen a través del entrenamiento en lugar de ser programadas explícitamente.",
      },
      {
        id: 11,
        text: "Es recomendable usar machine learning para resolver algunos problemas de data mining.",
        correctAnswer: "V",
        explanation: "El machine learning es una herramienta fundamental para resolver problemas de minería de datos.",
      },
      {
        id: 12,
        text: "En la representación de un problema como búsqueda en un espacio de estado es necesario explicitar el espacio de estado.",
        correctAnswer: "V",
        explanation:
          "Para resolver un problema mediante búsqueda en un espacio de estado, es necesario definir claramente dicho espacio.",
      },
      {
        id: 13,
        text: "Un software de juego humano máquina basado en búsqueda en un espacio de estado con árbol de profundidad 10, algoritmo de diferencia de utilidades, pero con función evaluadora constante tiene casi igual comportamiento que un software de juego con nivel principiante.",
        correctAnswer: "V",
        explanation:
          "Una función evaluadora constante no proporciona información útil para la toma de decisiones, lo que resulta en un comportamiento de nivel principiante.",
      },
      {
        id: 14,
        text: "Determinar el número de fichas en el juego de ajedrez es una regla.",
        correctAnswer: "F",
        explanation: "Determinar el número de fichas es una operación de conteo, no una regla del juego.",
      },
      {
        id: 15,
        text: "El desarrollo de un machine learning para predecir la demanda de carros de un modelo es un objetivo de ingeniería de la inteligencia artificial.",
        correctAnswer: "V",
        explanation:
          "Desarrollar sistemas de predicción utilizando machine learning es un objetivo de ingeniería de la IA.",
      },
      {
        id: 16,
        text: "Los métodos de propósito general son eficientes para resolver un problema en particular.",
        correctAnswer: "F",
        explanation:
          "Los métodos de propósito general suelen ser menos eficientes que los métodos específicos para resolver problemas particulares.",
      },
      {
        id: 17,
        text: "Es adecuado el uso de lenguajes de IA para hacer sistemas expertos.",
        correctAnswer: "V",
        explanation:
          "Los lenguajes de IA están diseñados para facilitar el desarrollo de sistemas expertos y otros sistemas inteligentes.",
      },
      {
        id: 18,
        text: "John McCarthy acuña el termino de inteligencia artificial en una conferencia celebrada en Darmouth en 1956.",
        correctAnswer: "V",
        explanation:
          "John McCarthy efectivamente acuñó el término 'inteligencia artificial' en la conferencia de Dartmouth en 1956.",
      },
      {
        id: 19,
        text: "Si un problema decisión es NP-difícil entonces su correspondiente problema de optimización puede ser tratable.",
        correctAnswer: "F",
        explanation:
          "Si un problema de decisión es NP-difícil, su correspondiente problema de optimización también será al menos tan difícil.",
      },
      {
        id: 20,
        text: "Una función evaluadora asociada a los problemas de optimización es dada por la función objetivo a optimizar.",
        correctAnswer: "V",
        explanation:
          "En problemas de optimización, la función evaluadora suele ser la función objetivo que se busca maximizar o minimizar.",
      },
      {
        id: 21,
        text: "El problema del cubo mágico es un problema de localización.",
        correctAnswer: "V",
        explanation:
          "Ordenar un cubo mágico implica encontrar una configuración específica, lo que lo convierte en un problema de localización.",
      },
      {
        id: 22,
        text: "Los algoritmos de búsqueda ciega y con información en el peor caso pueden recorrer todo el espacio de estado, esto es, presentan complejidad no polinomial respecto al número de niveles del árbol de estado.",
        correctAnswer: "V",
        explanation:
          "En el peor caso, estos algoritmos pueden necesitar explorar todo el espacio de estados, lo que resulta en complejidad no polinomial.",
      },
      {
        id: 23,
        text: "El algoritmo alfa-beta es el algoritmo Min-Max con acotación (poda).",
        correctAnswer: "V",
        explanation:
          "El algoritmo alfa-beta es una optimización del algoritmo Min-Max que utiliza poda para reducir el número de nodos evaluados.",
      },
      {
        id: 24,
        text: "El rápido avance de la inteligencia artificial se debe principalmente a la tratabilidad de sus problemas.",
        correctAnswer: "F",
        explanation:
          "Muchos problemas de IA son intratables; el avance se debe más a mejoras en hardware, algoritmos y disponibilidad de datos.",
      },
      {
        id: 25,
        text: "Es adecuado usar inteligencia artificial para hacer pronósticos de la demanda de productos farmacéuticos.",
        correctAnswer: "V",
        explanation: "La IA es adecuada para problemas de pronóstico y predicción basados en datos históricos.",
      },
      {
        id: 26,
        text: "El criterio diferencia de utilidades para juegos humano-máquina es considerado ofensivo.",
        correctAnswer: "V",
        explanation:
          "Este criterio busca maximizar la ventaja sobre el oponente, lo que se considera una estrategia ofensiva.",
      },
      {
        id: 27,
        text: "La principal característica de los sistemas machine learning es la capacidad de aprender a realizar una tarea a través de experiencias.",
        correctAnswer: "V",
        explanation:
          "La capacidad de aprender de los datos y mejorar con la experiencia es la característica definitoria del machine learning.",
      },
      {
        id: 28,
        text: "La disciplina de la inteligencia artificial encargada para desarrollar métodos para el desarrollo y mantenimiento de sistemas expertos de calidad es denominada gestión de conocimiento.",
        correctAnswer: "V",
        explanation:
          "La gestión del conocimiento se ocupa de cómo adquirir, representar y mantener el conocimiento en sistemas expertos.",
      },
      {
        id: 29,
        text: "Los métodos informados con función de evaluación constante se comportan como métodos ciegos.",
        correctAnswer: "V",
        explanation:
          "Si la función de evaluación es constante, no proporciona información útil, por lo que el método se comporta como un método ciego.",
      },
      {
        id: 30,
        text: "El test de Turing se puede resumir, como un juego donde a través de una interacción (como chat) la máquina intenta engañar a un humano que ella es humana, si lo logra se considera que la máquina tiene inteligencia artificial.",
        correctAnswer: "V",
        explanation:
          "Esta es una descripción precisa del test de Turing, donde la capacidad de engañar a un humano se considera evidencia de inteligencia.",
      },
    ]

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Error al obtener las preguntas" }, { status: 500 })
  }
}
