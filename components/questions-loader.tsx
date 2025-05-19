"use client"

import { useEffect, useState } from "react"

export function useQuestionsLoader() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuestions() {
      try {
        // Intentamos cargar el archivo para verificar que existe
        const response = await fetch("/preguntas.txt")
        if (!response.ok) {
          throw new Error(`No se pudo cargar el archivo de preguntas: ${response.status} ${response.statusText}`)
        }

        const text = await response.text()
        console.log(`Archivo de preguntas cargado correctamente. Tamaño: ${text.length} bytes`)
        setIsLoaded(true)
      } catch (error) {
        console.error("Error cargando preguntas:", error)
        setError(error instanceof Error ? error.message : "Error desconocido cargando preguntas")
      }
    }

    loadQuestions()
  }, [])

  return { isLoaded, error }
}
