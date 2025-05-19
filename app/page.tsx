import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Brain, FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-spotify-text">Aplicación de Quiz</h1>
          <p className="text-lg text-spotify-subtext">
            Pon a prueba tus conocimientos con preguntas generadas por IA o predefinidas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="spotify-card hover:bg-spotify-hover transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-spotify-text">
                <Brain className="h-6 w-6 text-spotify-primary" />
                Preguntas Generadas por IA
              </CardTitle>
              <CardDescription className="text-spotify-subtext">
                Realiza un quiz con preguntas generadas por IA basadas en preguntas existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-spotify-subtext">
                La IA analizará las preguntas existentes y generará preguntas similares adaptadas para evaluar tu
                comprensión de los conceptos de inteligencia artificial.
              </p>
              <Link href="/configure?type=ai" className="block">
                <Button className="w-full spotify-button">
                  Comenzar Quiz de IA <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="spotify-card hover:bg-spotify-hover transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-spotify-text">
                <FileText className="h-6 w-6 text-spotify-primary" />
                Preguntas Predefinidas
              </CardTitle>
              <CardDescription className="text-spotify-subtext">
                Realiza un quiz con preguntas del banco de preguntas predefinido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-spotify-subtext">
                Responde preguntas de nuestra colección seleccionada de conceptos, teorías y aplicaciones de
                inteligencia artificial.
              </p>
              <Link href="/configure?type=predefined" className="block">
                <Button className="w-full spotify-button">
                  Comenzar Quiz Predefinido <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 text-center text-spotify-subtext">
          <p>© 2024 Guillermito Aldana. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
