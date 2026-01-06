
import { GoogleGenAI, Type } from "@google/genai";
import { Client, Appointment } from './types';

export class GeminiAssistant {
  // Always create a new GoogleGenAI instance right before making an API call to ensure it uses the latest config
  private get ai(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async optimizeRoute(addresses: string[]): Promise<string> {
    if (addresses.length < 2) return "Adicione mais endereços para calcular a rota.";
    
    const prompt = `Como um assistente de logística para representantes comerciais, analise estes endereços e sugira a melhor ordem de visita para minimizar o tempo de deslocamento. Considere que o representante inicia e termina o dia na mesma cidade central.
    Endereços:
    ${addresses.join('\n')}
    
    Responda em formato Markdown com a lista ordenada e uma breve justificativa logística.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível otimizar a rota.";
  }

  async summarizeClients(clients: Client[]): Promise<string> {
    const prompt = `Analise a seguinte lista de clientes de um representante comercial e identifique oportunidades ou padrões (ex: clientes da categoria A sem visitas recentes).
    Clientes: ${JSON.stringify(clients)}
    
    Dê conselhos estratégicos em português.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Sem insights no momento.";
  }

  async chat(message: string, context: { clients: Client[], appointments: Appointment[] }): Promise<string> {
    const prompt = `Você é o "Sales Copilot", um assistente de IA integrado ao app de um representante comercial. 
    Você tem acesso aos dados locais do usuário:
    - Clientes: ${JSON.stringify(context.clients)}
    - Agenda: ${JSON.stringify(context.appointments)}
    
    Pergunta do usuário: ${message}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Desculpe, não consegui processar sua solicitação.";
  }
}

export const aiAssistant = new GeminiAssistant();
