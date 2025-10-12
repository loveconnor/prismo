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
import { TextComponent, TextLinkComponent, StrongComponent } from '../../components/ui/text/text';

@Component({
  selector: 'app-forgot-password',
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
    TextComponent,
    TextLinkComponent,
    StrongComponent
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white px-4 py-12 dark:bg-zinc-950">
      <form action="" method="POST" class="grid w-full max-w-sm grid-cols-1 gap-8">
        <app-logo className="h-6 text-zinc-950 dark:text-white" />
        <app-heading>Reset your password</app-heading>
        
        <app-text>Enter your email and we'll send you a link to reset your password.</app-text>
        
        <app-field>
          <app-label for="email">Email</app-label>
          <app-input type="email" id="email" name="email" />
        </app-field>
        
        <app-button type="submit" color="blue" className="w-full">
          Reset password
        </app-button>
        
        <app-text className="text-center">
          Don't have an account?
          <app-text-link href="/register">
            <app-strong>Sign up</app-strong>
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
export class ForgotPasswordComponent {}

