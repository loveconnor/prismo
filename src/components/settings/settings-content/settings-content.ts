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
import { CustomLibrariesService, CustomLibrary } from '../../../services/custom-libraries.service';

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
  avatarUrl = '';
  timeZone = 'America/New_York';
  themeMode = 'System';
  fontFamily: FontFamily = 'system';
  fontSize: FontSize = 'medium';

  emailProgress = true;
  reminderHints = false;
  autoDifficulty = true;
  showMasteryMap = true;

  showDeleteDialog = false;
  
  // Custom libraries
  customLibraries: CustomLibrary[] = [];
  uploadingLibrary = false;
  selectedLanguage: string = 'java';

  constructor(
    private themeService: ThemeService,
    private fontService: FontService,
    private customLibrariesService: CustomLibrariesService
  ) {
    // Initialize font settings from service
    this.fontFamily = this.fontService.getFontFamily();
    this.fontSize = this.fontService.getFontSize();
    
    // Initialize font options based on available fonts
    this.initializeFontOptions();
    
    // Load avatar from localStorage
    try {
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) {
        this.avatarUrl = savedAvatar;
      }
    } catch (error) {
      console.error('Failed to load avatar:', error);
    }
    
    // Load display name from localStorage
    try {
      const savedDisplayName = localStorage.getItem('user_display_name');
      if (savedDisplayName) {
        this.displayName = savedDisplayName;
      }
    } catch (error) {
      console.error('Failed to load display name:', error);
    }
    
    // Subscribe to custom libraries
    this.customLibrariesService.libraries$.subscribe(libraries => {
      this.customLibraries = libraries;
    });
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
  
  readonly languageOptions: SelectOption[] = [
    { value: 'java', label: 'Java (.jar)' },
    { value: 'python', label: 'Python (.py, .whl)' },
    { value: 'javascript', label: 'JavaScript (.js)' },
    { value: 'cpp', label: 'C++ (.a, .so)' }
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File size must be less than 5MB');
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.avatarUrl = e.target.result as string;
        // Save to localStorage
        try {
          localStorage.setItem('user_avatar', this.avatarUrl);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('avatar-updated'));
        } catch (error) {
          console.error('Failed to save avatar:', error);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarUrl = '';
    try {
      localStorage.removeItem('user_avatar');
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('avatar-updated'));
    } catch (error) {
      console.error('Failed to remove avatar:', error);
    }
  }

  onDisplayNameChange(value: string): void {
    this.displayName = value;
    try {
      localStorage.setItem('user_display_name', value);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('displayname-updated'));
    } catch (error) {
      console.error('Failed to save display name:', error);
    }
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

  get uploadButtonClasses(): string {
    return this.isDark
      ? 'bg-[#0d1117] border-[#30363d] text-[#e5e7eb] hover:bg-[#161b22]'
      : 'bg-white border-[#d1d5db] text-[#111827] hover:bg-[#f3f4f6]';
  }

  get removeButtonClasses(): string {
    return this.isDark
      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
      : 'text-red-600 hover:text-red-700 hover:bg-red-50';
  }
  
  // Custom library methods
  onLibraryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validate file size (max 50MB for libraries)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('Library file must be less than 50MB');
      alert('Library file must be less than 50MB');
      return;
    }

    this.uploadingLibrary = true;
    
    this.customLibrariesService.uploadLibrary(file, this.selectedLanguage).subscribe({
      next: (response) => {
        this.uploadingLibrary = false;
        if (response.success) {
          console.log('Library uploaded successfully:', response.library);
          // Reset file input
          input.value = '';
        } else {
          console.error('Failed to upload library:', response.error);
          alert(`Failed to upload library: ${response.error}`);
        }
      },
      error: (error) => {
        this.uploadingLibrary = false;
        console.error('Error uploading library:', error);
        alert('Error uploading library. Please try again.');
        // Reset file input
        input.value = '';
      }
    });
  }
  
  onLanguageChange(value: string): void {
    this.selectedLanguage = value;
  }
  
  toggleLibraryEnabled(library: CustomLibrary): void {
    this.customLibrariesService.toggleLibrary(library.id, !library.enabled).subscribe({
      next: (response) => {
        if (!response.success) {
          console.error('Failed to toggle library:', response.error);
          alert(`Failed to toggle library: ${response.error}`);
        }
      },
      error: (error) => {
        console.error('Error toggling library:', error);
        alert('Error toggling library. Please try again.');
      }
    });
  }
  
  deleteLibrary(library: CustomLibrary): void {
    if (!confirm(`Are you sure you want to delete ${library.filename}?`)) {
      return;
    }
    
    this.customLibrariesService.deleteLibrary(library.id).subscribe({
      next: (response) => {
        if (!response.success) {
          console.error('Failed to delete library:', response.error);
          alert(`Failed to delete library: ${response.error}`);
        }
      },
      error: (error) => {
        console.error('Error deleting library:', error);
        alert('Error deleting library. Please try again.');
      }
    });
  }
  
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  getLibrariesForLanguage(language: string): CustomLibrary[] {
    return this.customLibraries.filter(lib => lib.language === language);
  }
}
