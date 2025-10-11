import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideIcons } from '@ng-icons/core';
import {
  lucideHouse,
  lucideBookCopy,
  lucideFolder,
  lucideSettings,
  lucideGrid3x3,
  lucideFileText,
  lucideChartBar,
  lucideSparkles,
  lucideBeaker,
  lucideClock,
  lucideStar
} from '@ng-icons/lucide';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideIcons({
      lucideHouse,
      lucideBookCopy,
      lucideFolder,
      lucideSettings,
      lucideGrid3x3,
      lucideFileText,
      lucideChartBar,
      lucideSparkles,
      lucideBeaker,
      lucideClock,
      lucideStar
    })
  ]
};
