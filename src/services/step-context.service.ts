import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface StepContext {
  stepNumber: number;
  background: string;
  keyConcepts: string[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GenerateStepContextRequest {
  labTitle: string;
  labDescription: string;
  stepNumber: number;
  stepTitle?: string;
  stepDescription?: string;
  totalSteps: number;
  difficulty?: string;
  topic?: string;
}

export interface GenerateLabBackgroundRequest {
  labTitle: string;
  labDescription: string;
  totalSteps: number;
  difficulty?: string;
  topic?: string;
  estimatedTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StepContextService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api/claude';
  private cache = new Map<string, StepContext>();

  /**
   * Generate educational background context for a lab step using AI
   */
  generateStepContext(request: GenerateStepContextRequest): Observable<StepContext> {
    const cacheKey = `${request.labTitle}-${request.stepNumber}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('[StepContext] Using cached context for', cacheKey);
      return of(this.cache.get(cacheKey)!);
    }

    console.log('[StepContext] Generating AI context for step', request.stepNumber);

    const systemPrompt = `You are an expert educational content creator specializing in creating clear, concise learning materials.
Your goal is to provide helpful background information that prepares students for a learning step without overwhelming them.
Keep your explanations under 150 words total. Use simple, encouraging language.
Always respond with valid JSON only.`;

    const message = `Create educational background content for this learning step:

**Lab Title:** ${request.labTitle}
${request.labDescription ? `**Lab Description:** ${request.labDescription}` : ''}
**Current Step:** ${request.stepNumber} of ${request.totalSteps}
${request.stepTitle ? `**Step Title:** ${request.stepTitle}` : ''}
${request.stepDescription ? `**Step Task:** ${request.stepDescription}` : ''}
${request.difficulty ? `**Difficulty Level:** ${request.difficulty}` : ''}

Generate:
1. **Background** (2-3 sentences): Explain what this step is about and why it matters in the learning journey
2. **Key Concepts** (3-5 items): List the most important ideas or terms students should understand
3. **Estimated Time** (number): How many minutes this step should take

Return ONLY this JSON format:
{
  "background": "Your 2-3 sentence explanation here",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "estimatedTime": 5
}`;

    return this.http.post<any>(`${this.baseUrl}/chat`, {
      message,
      system_prompt: systemPrompt,
      max_tokens: 600
    }).pipe(
      map(response => {
        console.log('[StepContext] AI Response received:', response);
        
        if (response.success && response.response) {
          try {
            // Try to parse JSON from the response
            let jsonText = response.response.trim();
            
            // Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }
            
            console.log('[StepContext] Parsing JSON:', jsonText);
            const parsed = JSON.parse(jsonText);
            
            const stepContext: StepContext = {
              stepNumber: request.stepNumber,
              background: parsed.background || 'Continue with this step to learn more.',
              keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
              estimatedTime: typeof parsed.estimatedTime === 'number' ? parsed.estimatedTime : 5,
              difficulty: this.mapDifficulty(request.difficulty)
            };
            
            console.log('[StepContext] Generated context:', stepContext);
            
            // Cache the result
            this.cache.set(cacheKey, stepContext);
            
            return stepContext;
          } catch (e) {
            console.warn('[StepContext] Failed to parse AI response as JSON, using fallback', e);
            console.warn('[StepContext] Raw response was:', response.response);
            return this.getFallbackContext(request);
          }
        }
        console.warn('[StepContext] AI response not successful, using fallback');
        return this.getFallbackContext(request);
      }),
      catchError(error => {
        console.error('[StepContext] Error generating step context:', error);
        return of(this.getFallbackContext(request));
      })
    );
  }

  /**
   * Generate comprehensive lab background information using AI
   */
  generateLabBackground(request: GenerateLabBackgroundRequest): Observable<StepContext> {
    const cacheKey = `lab-bg-${request.labTitle}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('[StepContext] Using cached lab background for', cacheKey);
      return of(this.cache.get(cacheKey)!);
    }

    console.log('[StepContext] Generating AI lab background');

    const systemPrompt = `You are a focused educational content creator for coding labs.
CRITICAL: You must create content ONLY about the specific topic mentioned in the lab title and description. Do not deviate from the topic.
Always use markdown headers (###) for every section. Keep content brief and practical.
Use: ### headers, **bold**, \`code\`, lists. NO emojis.
Always respond with valid JSON only.`;

    const message = `Create brief background for this SPECIFIC lab topic:

**Lab Title:** ${request.labTitle}
${request.labDescription ? `**Lab Description:** ${request.labDescription}` : ''}
${request.topic ? `**Main Topic:** ${request.topic}` : ''}
${request.totalSteps ? `**Number of Steps:** ${request.totalSteps}` : ''}

CRITICAL REQUIREMENTS:
1. Content must be 100% focused on the lab title topic: "${request.labTitle}"
2. Do NOT create content about unrelated topics
3. Every section MUST start with a ### header (h3)
4. Keep it brief (100-150 words total)

Generate markdown with these sections (EACH with ### header):
### Overview
2-3 sentences explaining what THIS SPECIFIC LAB teaches about ${request.topic || request.labTitle}

### What You'll Practice  
3-4 bullet points of specific skills related to ${request.topic || request.labTitle} (not general programming)

### Key Concepts (optional, only if needed)
List 3-4 main concepts if they weren't already covered

Guidelines:
- Stay 100% on topic: ${request.topic || request.labTitle}
- Use **bold** for key terms specific to the topic
- Use \`code\` for syntax examples related to the topic
- Every section needs ### header (h3)

Return ONLY this JSON:
{
  "background": "### Overview\\n\\n2-3 sentences about ${request.topic || request.labTitle}.\\n\\n### What You'll Practice\\n\\n- Skill 1 about ${request.topic || request.labTitle}\\n- Skill 2\\n- Skill 3",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "estimatedTime": ${request.estimatedTime || 30}
}`;

    return this.http.post<any>(`${this.baseUrl}/chat`, {
      message,
      system_prompt: systemPrompt,
      max_tokens: 1000
    }).pipe(
      map(response => {
        console.log('[StepContext] Lab background AI response received:', response);
        
        if (response.success && response.response) {
          try {
            let jsonText = response.response.trim();
            
            // Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }
            
            console.log('[StepContext] Parsing lab background JSON:', jsonText);
            const parsed = JSON.parse(jsonText);
            
            const labContext: StepContext = {
              stepNumber: 1,
              background: parsed.background || request.labDescription || 'Welcome to this learning lab.',
              keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
              estimatedTime: typeof parsed.estimatedTime === 'number' ? parsed.estimatedTime : request.estimatedTime || 30,
              difficulty: this.mapDifficulty(request.difficulty)
            };
            
            console.log('[StepContext] Generated lab background:', labContext);
            
            // Cache the result
            this.cache.set(cacheKey, labContext);
            
            return labContext;
          } catch (e) {
            console.warn('[StepContext] Failed to parse lab background as JSON, using fallback', e);
            console.warn('[StepContext] Raw response was:', response.response);
            return this.getLabBackgroundFallback(request);
          }
        }
        console.warn('[StepContext] AI response not successful, using fallback');
        return this.getLabBackgroundFallback(request);
      }),
      catchError(error => {
        console.error('[StepContext] Error generating lab background:', error);
        return of(this.getLabBackgroundFallback(request));
      })
    );
  }

  /**
   * Prefetch context for multiple steps
   */
  prefetchStepContexts(requests: GenerateStepContextRequest[]): void {
    requests.forEach(request => {
      this.generateStepContext(request).subscribe();
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get fallback context when AI generation fails
   */
  private getFallbackContext(request: GenerateStepContextRequest): StepContext {
    return {
      stepNumber: request.stepNumber,
      background: `Step ${request.stepNumber} of ${request.totalSteps}${request.stepTitle ? `: ${request.stepTitle}` : ''}. ${request.stepDescription || 'Continue your learning journey with this step.'}`,
      keyConcepts: [],
      estimatedTime: 5,
      difficulty: this.mapDifficulty(request.difficulty)
    };
  }

  /**
   * Get fallback lab background when AI generation fails
   */
  private getLabBackgroundFallback(request: GenerateLabBackgroundRequest): StepContext {
    return {
      stepNumber: 1,
      background: request.labDescription || `Welcome to ${request.labTitle}. This lab will guide you through ${request.totalSteps} steps to build your understanding.`,
      keyConcepts: [],
      estimatedTime: request.estimatedTime || 30,
      difficulty: this.mapDifficulty(request.difficulty)
    };
  }

  /**
   * Map difficulty string to valid type
   */
  private mapDifficulty(difficulty?: string): 'easy' | 'medium' | 'hard' {
    if (!difficulty) return 'medium';
    const lower = difficulty.toLowerCase();
    if (lower === 'beginner' || lower === 'easy') return 'easy';
    if (lower === 'advanced' || lower === 'hard') return 'hard';
    return 'medium';
  }
}
