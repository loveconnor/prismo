import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsSectionComponent } from '../settings-section/settings-section';
import { SettingsRowComponent } from '../settings-row/settings-row';
import { InputComponent } from '../../ui/input/input';
import { SelectComponent, SelectOption } from '../../ui/select/select';
import { SwitchComponent } from '../../ui/switch/switch';
import { ButtonComponent } from '../../ui/button/button';
import { ConfirmDialogComponent } from '../../ui/confirm-dialog/confirm-dialog';
import { ThemeService } from '../../../services/theme.service';
import { FontService, FontFamily, FontSize } from '../../../services/font.service';

@Component({
  selector: 'app-settings-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SettingsSectionComponent,
    SettingsRowComponent,
    InputComponent,
    SelectComponent,
    SwitchComponent,
    ButtonComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './settings-content.html',
  styleUrls: ['./settings-content.css']
})
export class SettingsContentComponent {
  @Input() activeSection = 'profile';

  displayName = 'Student';
  timeZone = 'America/New_York';
  themeMode = 'System';
  fontFamily: FontFamily = 'system';
  fontSize: FontSize = 'medium';

  emailProgress = true;
  reminderHints = false;
  autoDifficulty = true;
  showMasteryMap = true;

  showDeleteDialog = false;

  constructor(
    private themeService: ThemeService,
    private fontService: FontService
  ) {
    // Initialize font settings from service
    this.fontFamily = this.fontService.getFontFamily();
    this.fontSize = this.fontService.getFontSize();
    
    // Initialize font options based on available fonts
    this.initializeFontOptions();
  }

  readonly timeZoneOptions: SelectOption[] = [
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata' }
  ];

  readonly themeOptions: SelectOption[] = [
    { value: 'System', label: 'System' },
    { value: 'Light', label: 'Light' },
    { value: 'Dark', label: 'Dark' }
  ];

  fontFamilyOptions: SelectOption[] = [];
  fontLoadingStatus = { isLoading: false, availableCount: 0, totalCount: 5 };

  readonly fontSizeOptions: SelectOption[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  onThemeChange(value: string): void {
    this.themeMode = value;
    this.applyThemePreference();
  }

  private applyThemePreference(): void {
    if (typeof document === 'undefined') return;

    const resolved = this.resolveTheme();
    this.themeService.setTheme(resolved === 'dark');
    try {
      localStorage.setItem('theme', resolved === 'dark' ? 'dark' : 'light');
    } catch {}
  }

  private resolveTheme(): 'light' | 'dark' {
    if (this.themeMode === 'Light') return 'light';
    if (this.themeMode === 'Dark') return 'dark';

    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'dark';
  }

  openDeleteConfirmation(): void {
    this.showDeleteDialog = true;
  }

  closeDeleteConfirmation(): void {
    this.showDeleteDialog = false;
  }

  confirmDelete(): void {
    // Placeholder for delete logic
    this.showDeleteDialog = false;
  }

  onTimeZoneChange(value: string): void {
    this.timeZone = value;
  }

  private initializeFontOptions(): void {
    // Get available font options from the service
    const availableFonts = this.fontService.getAvailableFontOptions();
    this.fontFamilyOptions = availableFonts.map(font => ({
      value: font.value,
      label: font.available ? font.label : `${font.label} (Not Available)`,
      disabled: !font.available
    }));

    // Update loading status
    this.fontLoadingStatus = this.fontService.getFontLoadingStatus();
  }

  onFontFamilyChange(value: string): void {
    const requestedFont = value as FontFamily;
    // Use the best available font (with fallback)
    const bestFont = this.fontService.getBestAvailableFont(requestedFont);
    this.fontFamily = bestFont;
    this.fontService.setFontFamily(bestFont);
  }

  onFontSizeChange(value: string): void {
    this.fontSize = value as FontSize;
    this.fontService.setFontSize(this.fontSize);
  }

  get isDark(): boolean {
    return this.themeService.isDarkMode();
  }

  get controlInputClasses(): string {
    return this.isDark
      ? 'w-[280px] bg-[#0d1117] border-[#30363d] text-[#e5e7eb]'
      : 'w-[280px] bg-white border-[#d1d5db] text-[#111827]';
  }

  get selectTriggerClasses(): string {
    return this.isDark
      ? 'w-[280px] bg-[#0d1117] border-[#30363d] text-[#e5e7eb]'
      : 'w-[280px] bg-white border-[#d1d5db] text-[#111827]';
  }

  get selectContentClasses(): string {
    return this.isDark
      ? 'bg-[#161b22] border-[#30363d]'
      : 'bg-white border-[#d1d5db] shadow-lg';
  }

  get selectOptionClasses(): string {
    return this.isDark 
      ? 'hover:bg-white/10 text-[#e5e7eb] focus:text-[#e5e7eb]' 
      : 'hover:bg-slate-100 text-[#111827] focus:text-[#111827] font-medium';
  }
}
