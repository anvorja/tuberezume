import type { Summary } from "./types"

/* Datos de ejemplo del frontend. Resúmenes escritos a mano como demostración
   del formato; no provienen de ningún backend ni de la transcripción real. */

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString()

const base = {
  status: "ready" as const,
  progress: 1,
  demo: true,
}

export const SEED: Summary[] = [
  {
    ...base,
    id: "demo-gpt",
    url: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
    videoId: "kCc8FmEb1nY",
    title: "Construyamos GPT desde cero, en código, paso a paso",
    channel: "Andrej Karpathy",
    durationSec: 6975,
    createdAt: ago(60 * 5),
    tldr: "Se construye un modelo de lenguaje tipo GPT en PyTorch, empezando por un modelo de bigramas sobre texto de Shakespeare y llegando a un Transformer completo con auto-atención multi-cabeza. La idea central: la atención es un promedio ponderado de los tokens anteriores, donde los pesos se aprenden.",
    keyPoints: [
      "Un modelo de lenguaje predice el siguiente carácter o token a partir del contexto anterior.",
      "La atención permite que cada posición consulte a las anteriores; una máscara triangular impide mirar el futuro.",
      "Query, key y value son proyecciones lineales: la similitud query-key decide cuánto de cada value se mezcla.",
      "Residuales y LayerNorm hacen posible entrenar redes profundas de forma estable.",
      "El modelo del video es un decodificador; ChatGPT añade preentrenamiento a gran escala y ajuste con preferencias.",
    ],
    chapters: [
      {
        start: 0,
        title: "Qué vamos a construir",
        summary: "Objetivo: un GPT pequeño entrenado sobre un archivo de texto.",
      },
      {
        start: 480,
        title: "Bigramas y la pérdida",
        summary: "Primer modelo mínimo, muestreo y entropía cruzada.",
      },
      {
        start: 2340,
        title: "El truco matemático de la atención",
        summary: "Promedios acumulados con multiplicación de matrices y softmax enmascarado.",
      },
      {
        start: 3600,
        title: "Auto-atención con query, key y value",
        summary: "Una cabeza de atención, escalado por raíz de la dimensión.",
      },
      {
        start: 5100,
        title: "Bloque Transformer completo",
        summary: "Multi-cabeza, red feed-forward, residuales y LayerNorm.",
      },
      {
        start: 6300,
        title: "Del modelo del video a ChatGPT",
        summary: "Qué falta: escala, preentrenamiento y alineamiento.",
      },
    ],
    transcript: [
      { start: 0, text: "Hola a todos. Hoy vamos a construir un GPT, desde cero, en código, y paso a paso." },
      { start: 38, text: "Empezamos con un archivo de texto: todas las obras de Shakespeare concatenadas." },
      { start: 480, text: "El modelo más simple posible es uno de bigramas: mira solo el carácter anterior." },
      { start: 2340, text: "Aquí está el truco matemático: un promedio acumulado se puede escribir como una multiplicación de matrices triangular." },
      { start: 3600, text: "Cada token emite una query, qué busco, y una key, qué contengo." },
      { start: 5100, text: "Ahora juntamos todo: atención multi-cabeza, una red feed-forward y conexiones residuales." },
      { start: 6300, text: "Lo que construimos es un decodificador. Para llegar a ChatGPT falta escala y una etapa de alineamiento." },
    ],
  },
  {
    ...base,
    id: "demo-nn",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
    videoId: "aircAruvnKk",
    title: "¿Qué es una red neuronal?",
    channel: "3Blue1Brown",
    durationSec: 1120,
    createdAt: ago(60 * 27),
    tldr: "Introducción visual a una red neuronal que reconoce dígitos escritos a mano: capas de neuronas con pesos y sesgos, donde aprender significa ajustar miles de parámetros para que la salida acierte.",
    keyPoints: [
      "Una neurona es un número entre 0 y 1: su activación.",
      "Cada conexión tiene un peso; cada neurona, un sesgo. Juntos son los parámetros.",
      "La red del ejemplo tiene unos 13 mil parámetros para clasificar imágenes de 28 por 28 píxeles.",
      "Aprender es encontrar los valores de los parámetros que minimizan el error.",
    ],
    chapters: [
      { start: 0, title: "El problema de reconocer dígitos", summary: "Por qué es fácil para un humano y difícil de programar." },
      { start: 260, title: "Capas, pesos y sesgos", summary: "Cómo se calcula la activación de cada neurona." },
      { start: 780, title: "Aprender es ajustar parámetros", summary: "La red como una función con miles de perillas." },
    ],
    transcript: [
      { start: 0, text: "Mira este dígito, un tres escrito a muy baja resolución. Tu cerebro lo reconoce sin esfuerzo." },
      { start: 260, text: "La primera capa tiene una neurona por píxel, y cada una guarda un número: su activación." },
      { start: 780, text: "Cuando decimos que la red aprende, nos referimos a que encuentra los pesos y sesgos correctos." },
    ],
  },
  {
    ...base,
    id: "demo-llm",
    url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
    videoId: "zjkBMFhNj_g",
    title: "Introducción a los grandes modelos de lenguaje",
    channel: "Andrej Karpathy",
    durationSec: 3588,
    createdAt: ago(60 * 74),
    tldr: "Charla sobre qué es un LLM en la práctica: dos archivos, los parámetros y el código que los ejecuta. Cubre cómo se entrena, cómo se alinea para ser asistente, hacia dónde van las capacidades y los riesgos de seguridad.",
    keyPoints: [
      "Un LLM es esencialmente un archivo de parámetros más un programa corto que lo ejecuta.",
      "El preentrenamiento comprime internet en parámetros; el ajuste fino lo convierte en asistente.",
      "Las leyes de escala predicen mejoras con más parámetros y más datos.",
      "Los LLM empiezan a usar herramientas: navegar, calcular y generar código.",
      "Hay riesgos específicos: jailbreaks, inyección de instrucciones y datos envenenados.",
    ],
    chapters: [
      { start: 0, title: "Dos archivos", summary: "Parámetros y código de inferencia." },
      { start: 780, title: "Cómo se entrena", summary: "Preentrenamiento y ajuste fino." },
      { start: 1920, title: "Hacia dónde va", summary: "Escala, herramientas y sistemas multimodales." },
      { start: 2880, title: "Seguridad", summary: "Jailbreaks e inyección de instrucciones." },
    ],
    transcript: [
      { start: 0, text: "Hoy quiero hablarles de los modelos de lenguaje grandes, y de qué son realmente." },
      { start: 780, text: "El entrenamiento consiste en comprimir una enorme porción de internet dentro de los parámetros." },
      { start: 1920, text: "Estos modelos empiezan a usar herramientas, igual que lo haría una persona." },
      { start: 2880, text: "Todo esto trae nuevas clases de ataques que apenas empezamos a entender." },
    ],
  },
]
