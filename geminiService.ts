
import { GoogleGenAI } from "@google/genai";
import { Client, Appointment } from './types.ts';

export class GeminiAssistant {
  private get ai(): GoogleGenAI | null {
    // Verificação segura de API_KEY em ambiente de navegador
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    if (!apiKey) {
      console.warn("Gemini API Key não encontrada. As funções de IA estarão desativadas.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  async optimizeRoute(addresses: string[]): Promise<string> {
    if (!this.ai) return "Assistente de IA indisponível (Chave de API ausente).";
    if (addresses.length < 2) return "Adicione mais endereços para calcular a rota.";
    
    const prompt = `Como um assistente de logística para representantes comerciais, analise estes endereços e sugira a melhor ordem de visita para minimizar o tempo de deslocamento.
    Endereços:
    ${addresses.join('\n')}
    
    Responda em formato Markdown.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Não foi possível otimizar a rota.";
    } catch (e) {
      return "Erro ao conectar com a IA.";
    }
  }

  async chat(message: string, context: { clients: Client[], appointments: Appointment[] }): Promise<string> {
    if (!this.ai) return "O Chat de IA requer uma API Key configurada.";

    const prompt = `Você é o "Sales Copilot". Dados atuais:
    - Clientes: ${context.clients.length}
    - Agenda: ${context.appointments.length}
    
    Pergunta: ${message}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Sem resposta.";
    } catch (e) {
      return "Erro na comunicação com a IA.";
    }
  }
}

export const aiAssistant = new GeminiAssistant();
