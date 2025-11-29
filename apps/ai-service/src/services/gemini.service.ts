import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { createError } from '../middleware/error-handler';

interface ClassifyTicketParams {
  text: string;
  title?: string;
  college?: string;
  department?: string;
  additionalContext?: string;
}

interface PredictPriorityParams {
  text: string;
  title?: string;
  category?: string;
}

interface ModerateContentParams {
  text: string;
  checkSpam: boolean;
  checkProfanity: boolean;
  checkHarassment: boolean;
}

interface GenerateReplyParams {
  ticketTitle: string;
  ticketDescription: string;
  conversationHistory: Array<{ role: string; message: string; timestamp?: Date }>;
  ticketCategory: string;
  responderRole: string;
  tone: 'formal' | 'friendly' | 'empathetic';
}

interface SummarizeTicketParams {
  ticketTitle?: string;
  ticketDescription: string;
  messages?: Array<{ role: string; message: string }>;
  maxLength: number;
}

interface AnalyzeTrendsParams {
  tickets: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    createdAt: Date;
  }>;
  timeRange?: { from: Date; to: Date };
}

interface ChatbotIntakeParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentStep?: string;
}

const SLA_HOURS = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 6,
};

export class GeminiService {
  private model: GenerativeModel;
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not set - AI features will return mock data');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    // Using gemini-pro which is stable and widely available
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async classifyTicket(params: ClassifyTicketParams) {
    const prompt = `You are a ticket classification system for BBD Educational Group (Babu Banarasi Das University, BBD NITM, BBD NIIT, BBD Dental College).

Analyze the following complaint/suggestion and classify it:

Title: ${params.title || 'N/A'}
Description: ${params.text}
${params.college ? `College: ${params.college}` : ''}
${params.department ? `Department: ${params.department}` : ''}
${params.additionalContext ? `Additional Context: ${params.additionalContext}` : ''}

Respond with a JSON object containing:
{
  "category": "TRANSPORT" | "HOSTEL" | "ACADEMIC" | "ADMINISTRATIVE" | "OTHER",
  "confidence": 0.0 to 1.0,
  "suggestedDepartment": "department name if academic/administrative",
  "suggestedRoutingLevel": "HOD" | "DIRECTOR" | "CAMPUS_ADMIN" | "TRANSPORT_INCHARGE" | "HOSTEL_WARDEN",
  "reasoning": "brief explanation of classification"
}

Category definitions:
- TRANSPORT: Issues related to college buses, routes, timing, drivers, bus conditions
- HOSTEL: Issues related to hostel rooms, food, facilities, security, wardens
- ACADEMIC: Issues related to classes, faculty, exams, curriculum, labs, library
- ADMINISTRATIVE: Issues related to fees, documents, certificates, office staff
- OTHER: Any other issues not fitting above categories

Routing rules:
- TRANSPORT → TRANSPORT_INCHARGE
- HOSTEL → HOSTEL_WARDEN
- ACADEMIC → HOD (of relevant department)
- ADMINISTRATIVE → HOD or relevant admin
- OTHER → HOD

Respond only with the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Classification error:', error);
      // Return default classification
      return {
        category: 'OTHER',
        confidence: 0.5,
        suggestedDepartment: null,
        suggestedRoutingLevel: 'HOD',
        reasoning: 'Default classification due to processing error',
      };
    }
  }

  async predictPriority(params: PredictPriorityParams) {
    const prompt = `You are a priority assessment system for a complaint management system at BBD Educational Group.

Analyze the following complaint and predict its priority:

Title: ${params.title || 'N/A'}
Description: ${params.text}
${params.category ? `Category: ${params.category}` : ''}

Respond with a JSON object containing:
{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0 to 1.0,
  "slaHours": number (72 for LOW, 48 for MEDIUM, 24 for HIGH, 6 for CRITICAL),
  "reasoning": "brief explanation"
}

Priority guidelines:
- CRITICAL (6h SLA): Safety issues, harassment, urgent infrastructure failures, medical emergencies
- HIGH (24h SLA): Significant service disruptions, exam-related urgent issues, major facility problems
- MEDIUM (48h SLA): Standard complaints affecting daily activities, moderate inconveniences
- LOW (72h SLA): Minor suggestions, general feedback, non-urgent improvements

Respond only with the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.slaHours = SLA_HOURS[parsed.priority as keyof typeof SLA_HOURS] || 48;
        return parsed;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Priority prediction error:', error);
      return {
        priority: 'MEDIUM',
        confidence: 0.5,
        slaHours: 48,
        reasoning: 'Default priority due to processing error',
      };
    }
  }

  async moderateContent(params: ModerateContentParams) {
    const prompt = `You are a content moderation system for an educational institution's complaint system.

Analyze the following text for inappropriate content:

"${params.text}"

Check for:
${params.checkSpam ? '- Spam or automated content' : ''}
${params.checkProfanity ? '- Profanity or vulgar language' : ''}
${params.checkHarassment ? '- Harassment, threats, or hate speech' : ''}

Respond with a JSON object containing:
{
  "isToxic": boolean,
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "recommendedAction": "ALLOW" | "FLAG" | "BLOCK",
  "categories": {
    "spam": boolean,
    "profanity": boolean,
    "harassment": boolean,
    "hate": boolean,
    "threat": boolean
  },
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

Guidelines:
- ALLOW: Clean content, no issues
- FLAG: Minor issues, needs review but can proceed
- BLOCK: Serious violations, should be hidden until reviewed

Be lenient with frustrated but legitimate complaints. Focus on actual harmful content.

Respond only with the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Moderation error:', error);
      return {
        isToxic: false,
        severity: 'LOW',
        recommendedAction: 'ALLOW',
        categories: {
          spam: false,
          profanity: false,
          harassment: false,
          hate: false,
          threat: false,
        },
        confidence: 0.5,
        reasoning: 'Default moderation result due to processing error',
      };
    }
  }

  async generateReplyDraft(params: GenerateReplyParams) {
    const historyText = params.conversationHistory
      .map((m) => `${m.role}: ${m.message}`)
      .join('\n');

    const prompt = `You are drafting a reply for a ${params.responderRole} at BBD Educational Group responding to a ${params.ticketCategory} ticket.

Ticket Title: ${params.ticketTitle}
Ticket Description: ${params.ticketDescription}

Conversation History:
${historyText || 'No previous messages'}

Tone: ${params.tone}

Generate a professional, ${params.tone} reply that:
1. Acknowledges the issue
2. Shows empathy if appropriate
3. Provides relevant information or next steps
4. Maintains professionalism

Respond with a JSON object containing:
{
  "subject": "Re: ${params.ticketTitle}",
  "body": "your drafted reply text",
  "suggestedActions": ["action 1", "action 2"]
}

The body should be 2-4 paragraphs. Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Reply generation error:', error);
      return {
        subject: `Re: ${params.ticketTitle}`,
        body: 'Thank you for bringing this to our attention. We are looking into this matter and will get back to you shortly.',
        suggestedActions: ['Review the issue', 'Respond with resolution'],
      };
    }
  }

  async summarizeTicket(params: SummarizeTicketParams) {
    const messagesText = params.messages
      ? params.messages.map((m) => `${m.role}: ${m.message}`).join('\n')
      : '';

    const prompt = `Summarize the following complaint/suggestion ticket:

Title: ${params.ticketTitle || 'N/A'}
Description: ${params.ticketDescription}

${messagesText ? `Conversation:\n${messagesText}` : ''}

Respond with a JSON object containing:
{
  "shortSummary": "1-2 sentence summary (max ${params.maxLength} chars)",
  "detailedSummary": "longer summary if needed",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "positive" | "neutral" | "negative"
}

Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Summarization error:', error);
      const truncatedDesc = params.ticketDescription.substring(0, params.maxLength);
      return {
        shortSummary: truncatedDesc + (params.ticketDescription.length > params.maxLength ? '...' : ''),
        detailedSummary: params.ticketDescription,
        keyPoints: [],
        sentiment: 'neutral',
      };
    }
  }

  async analyzeTrends(params: AnalyzeTrendsParams) {
    const ticketSummaries = params.tickets
      .slice(0, 50) // Limit to 50 tickets for context
      .map((t) => `[${t.category}] ${t.title}: ${t.description.substring(0, 100)}...`)
      .join('\n');

    const prompt = `Analyze the following complaint tickets from BBD Educational Group and identify trends:

Tickets:
${ticketSummaries}

Respond with a JSON object containing:
{
  "clusters": [
    {
      "theme": "theme name",
      "count": number,
      "percentage": number,
      "keywords": ["keyword1", "keyword2"],
      "examples": ["example issue 1"],
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "topIssues": [
    {
      "issue": "issue description",
      "frequency": number,
      "severity": "low" | "medium" | "high"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "summary": "overall analysis summary"
}

Focus on actionable insights for campus administration. Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Trend analysis error:', error);
      return {
        clusters: [],
        topIssues: [],
        recommendations: ['Unable to analyze trends at this time'],
        summary: 'Analysis unavailable',
      };
    }
  }

  async chatbotIntake(params: ChatbotIntakeParams) {
    const conversationHistory = params.messages
      .map((m) => `${m.role === 'user' ? 'Student' : 'Bot'}: ${m.content}`)
      .join('\n');

    const prompt = `You are a helpful chatbot for BBD Educational Group's complaint & suggestion system.

Your job is to help students submit complaints or suggestions through a conversational interface.

Conversation so far:
${conversationHistory}

Current step: ${params.currentStep || 'greeting'}

Steps to collect:
1. greeting - Welcome and ask what they need help with
2. type - Determine if it's a complaint or suggestion
3. category - Determine category (transport, hostel, academic, administrative, other)
4. college - Which college (BBD University, BBD NITM, BBD NIIT, BBD Dental)
5. department - Which department if academic
6. title - Get a brief title for the issue
7. description - Get detailed description
8. confirmation - Confirm all details before submission

Respond with a JSON object:
{
  "message": "your response to the user",
  "nextStep": "next step name",
  "isComplete": boolean (true if all info collected),
  "extractedData": {
    "category": "TRANSPORT" | "HOSTEL" | "ACADEMIC" | "ADMINISTRATIVE" | "OTHER" | null,
    "college": "college name" | null,
    "department": "department name" | null,
    "title": "ticket title" | null,
    "description": "full description" | null,
    "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null,
    "type": "complaint" | "suggestion" | null
  }
}

Be conversational, helpful, and patient. Extract information from the conversation naturally.
If user provides multiple pieces of information at once, extract all of them.
Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Chatbot error:', error);
      return {
        message: "I'm sorry, I'm having trouble understanding. Could you please tell me if you want to submit a complaint or a suggestion?",
        nextStep: 'type',
        isComplete: false,
        extractedData: {},
      };
    }
  }

  async enhanceText(params: { text: string; title?: string; type: 'complaint' | 'suggestion' }) {
    const prompt = `You are an AI assistant helping users write better ${params.type}s for BBD Educational Group.

Enhance the following ${params.type} to make it:
1. More professional and formal in tone
2. Clear and well-structured
3. Specific with actionable details
4. Grammatically correct
5. Free of emotional language or offensive content
6. Maintain the original meaning and intent

${params.title ? `Title: ${params.title}` : ''}
Original Text:
${params.text}

Respond with a JSON object:
{
  "enhancedTitle": "improved title if provided, or generate one if not",
  "enhancedText": "the enhanced version of the text",
  "improvements": ["list of improvements made"],
  "suggestions": ["additional suggestions for the user"]
}

Keep the enhanced text roughly the same length. Make it professional but not overly formal.
Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          enhancedTitle: parsed.enhancedTitle,
          enhancedText: parsed.enhancedText,
          improvements: parsed.improvements || [],
          suggestions: parsed.suggestions || [],
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Text enhancement error:', error);
      return {
        enhancedTitle: params.title,
        enhancedText: params.text,
        improvements: [],
        suggestions: ['Unable to enhance text at this time. Please try again.'],
      };
    }
  }

  async adminAssistant(params: { messages: Array<{ role: string; content: string }>; context?: string }) {
    const conversationHistory = params.messages
      .map((m) => `${m.role === 'user' ? 'Admin' : 'AI Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an AI assistant for administrators at BBD Educational Group's complaint & suggestion management system.

Your role is to help administrators:
1. Suggest solutions for complaints based on the issue description
2. Recommend actions to take
3. Draft professional responses to users
4. Analyze patterns in complaints
5. Suggest escalation paths if needed

${params.context ? `Current Ticket Context:\n${params.context}\n` : ''}

Conversation:
${conversationHistory}

Provide helpful, professional advice. Consider:
- BBD's organizational hierarchy (Department -> College -> Campus -> System Admin)
- Different complaint categories (Transport, Hostel, Academic, Administrative)
- SLA requirements and urgency levels
- Past solutions for similar issues

Respond with a JSON object:
{
  "response": "your helpful response",
  "suggestedActions": ["action 1", "action 2"],
  "draftResponse": "optional draft response to the user if requested",
  "relatedPolicies": ["relevant policy or procedure"],
  "escalationNeeded": boolean,
  "escalationReason": "reason if escalation needed"
}

Be professional, thorough, and action-oriented. Respond only with the JSON object.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response,
          suggestedActions: parsed.suggestedActions || [],
          draftResponse: parsed.draftResponse,
          relatedPolicies: parsed.relatedPolicies || [],
          escalationNeeded: parsed.escalationNeeded || false,
          escalationReason: parsed.escalationReason,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      logger.error('Admin assistant error:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request. Please try rephrasing your question or provide more details about the complaint you're handling.",
        suggestedActions: [],
        draftResponse: null,
        relatedPolicies: [],
        escalationNeeded: false,
        escalationReason: null,
      };
    }
  }
}

