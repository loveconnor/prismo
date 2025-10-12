import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../../components/ui/logo/logo';
import { ButtonComponent } from '../../components/ui/button/button';
import { FieldComponent } from '../../components/ui/field/field';
import { HeadingComponent } from '../../components/ui/heading/heading';
import { InputComponent } from '../../components/ui/input/input';
import { LabelComponent } from '../../components/ui/label/label';
import { PasswordInputComponent } from '../../components/ui/password-input/password-input';
import { TextComponent, TextLinkComponent, StrongComponent } from '../../components/ui/text/text';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LogoComponent,
    ButtonComponent,
    FieldComponent,
    HeadingComponent,
    InputComponent,
    LabelComponent,
    PasswordInputComponent,
    TextComponent,
    TextLinkComponent,
    StrongComponent
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white px-4 py-12 dark:bg-zinc-950">
      <form action="" method="POST" class="grid w-full max-w-sm grid-cols-1 gap-8">
        <app-logo className="h-6 text-zinc-950 dark:text-white" />
        <app-heading>Create your account</app-heading>
        
        <app-field>
          <app-label for="email">Email</app-label>
          <app-input type="email" id="email" name="email" />
        </app-field>
        
        <app-field>
          <app-label for="name">Full name</app-label>
          <app-input type="text" id="name" name="name" />
        </app-field>
        
        <app-field>
          <app-label for="password">Password</app-label>
          <app-password-input id="password" name="password" />
        </app-field>
        
        <app-button type="submit" color="blue" className="w-full">
          Create account
        </app-button>
        
        <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">Or continue with</div>
        
        <app-button type="button" variant="outline" className="w-full">
          <svg
            data-slot="icon"
            class="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </app-button>
        
        <app-text className="text-center">
          Already have an account?
          <app-text-link href="/login">
            <app-strong>Sign in</app-strong>
          </app-text-link>
        </app-text>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class RegisterComponent {}

