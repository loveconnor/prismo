import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configure marked with custom renderer for syntax highlighting
    const renderer = new marked.Renderer();
    
    // Override code block rendering to add syntax highlighting
    const originalCode = renderer.code.bind(renderer);
    renderer.code = function(token: any) {
      const code = token.text;
      const lang = token.lang || 'javascript';
      const prismLang = Prism.languages[lang] || Prism.languages['javascript'];
      
      try {
        const highlighted = Prism.highlight(code, prismLang, lang);
        return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
      } catch (e) {
        // Fallback to default rendering if Prism fails
        return originalCode(token);
      }
    };
    
    // Override inline code rendering
    const originalCodespan = renderer.codespan.bind(renderer);
    renderer.codespan = function(token: any) {
      return `<code class="inline-code">${token.text}</code>`;
    };
    
    marked.setOptions({
      breaks: true,
      gfm: true,
      renderer: renderer
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return this.sanitizer.bypassSecurityTrustHtml('');
    
    console.log('[SafeHtmlPipe] Input markdown:', value.substring(0, 200));
    
    // Convert markdown to HTML with syntax highlighting
    const html = marked.parse(value) as string;
    
    console.log('[SafeHtmlPipe] Output HTML:', html.substring(0, 200));
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}


