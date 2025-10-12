import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { WidgetState, WidgetEvent, ModuleDefinition } from '../types/widget.types';

interface ModuleState {
  moduleId: string;
  widgets: Map<string, WidgetState>;
  isCompleted: boolean;
  progress: number;
  totalTime: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetStateService {
  private modulesSubject = new BehaviorSubject<Map<string, ModuleState>>(new Map());
  private eventsSubject = new BehaviorSubject<WidgetEvent[]>([]);
  
  public modules$ = this.modulesSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();

  constructor() {}

  /**
   * Initialize a new module with its widgets
   */
  public initializeModule(moduleDefinition: ModuleDefinition): void {
    const moduleState: ModuleState = {
      moduleId: moduleDefinition.id,
      widgets: new Map(),
      isCompleted: false,
      progress: 0,
      totalTime: 0,
      lastUpdated: new Date()
    };

    // Initialize widget states
    moduleDefinition.widgets.forEach(widgetConfig => {
      const widgetState: WidgetState = {
        id: widgetConfig.id,
        is_completed: false,
        is_loading: false,
        has_error: false,
        time_spent: 0,
        attempts: 0,
        last_updated: new Date(),
        data: widgetConfig.props || {}
      };
      moduleState.widgets.set(widgetConfig.id, widgetState);
    });

    const currentModules = this.modulesSubject.value;
    currentModules.set(moduleDefinition.id, moduleState);
    this.modulesSubject.next(new Map(currentModules));
  }

  /**
   * Update widget state
   */
  public updateWidgetState(moduleId: string, widgetId: string, updates: Partial<WidgetState>): void {
    const modules = this.modulesSubject.value;
    const module = modules.get(moduleId);
    
    if (!module) {
      console.warn(`Module ${moduleId} not found`);
      return;
    }

    const widget = module.widgets.get(widgetId);
    if (!widget) {
      console.warn(`Widget ${widgetId} not found in module ${moduleId}`);
      return;
    }

    // Update widget state
    const updatedWidget = { ...widget, ...updates, last_updated: new Date() };
    module.widgets.set(widgetId, updatedWidget);

    // Update module progress
    this.updateModuleProgress(module);

    // Emit event
    this.emitEvent({
      widget_id: widgetId,
      event_type: 'state_change',
      data: updates,
      timestamp: new Date()
    });

    this.modulesSubject.next(new Map(modules));
  }

  /**
   * Get widget state
   */
  public getWidgetState(moduleId: string, widgetId: string): Observable<WidgetState | undefined> {
    return this.modules$.pipe(
      map(modules => {
        const module = modules.get(moduleId);
        return module?.widgets.get(widgetId);
      }),
      distinctUntilChanged()
    );
  }

  /**
   * Get all widget states for a module
   */
  public getModuleWidgetStates(moduleId: string): Observable<WidgetState[]> {
    return this.modules$.pipe(
      map(modules => {
        const module = modules.get(moduleId);
        return module ? Array.from(module.widgets.values()) : [];
      }),
      distinctUntilChanged()
    );
  }

  /**
   * Get module state
   */
  public getModuleState(moduleId: string): Observable<ModuleState | undefined> {
    return this.modules$.pipe(
      map(modules => modules.get(moduleId)),
      distinctUntilChanged()
    );
  }

  /**
   * Check if module is completed
   */
  public isModuleCompleted(moduleId: string): Observable<boolean> {
    return this.getModuleState(moduleId).pipe(
      map(module => module?.isCompleted ?? false),
      distinctUntilChanged()
    );
  }

  /**
   * Get module progress (0-100)
   */
  public getModuleProgress(moduleId: string): Observable<number> {
    return this.getModuleState(moduleId).pipe(
      map(module => module?.progress ?? 0),
      distinctUntilChanged()
    );
  }

  /**
   * Get total time spent in module
   */
  public getModuleTotalTime(moduleId: string): Observable<number> {
    return this.getModuleState(moduleId).pipe(
      map(module => module?.totalTime ?? 0),
      distinctUntilChanged()
    );
  }

  /**
   * Get completed widgets count
   */
  public getCompletedWidgetsCount(moduleId: string): Observable<number> {
    return this.getModuleWidgetStates(moduleId).pipe(
      map(widgets => widgets.filter(w => w.is_completed).length),
      distinctUntilChanged()
    );
  }

  /**
   * Get widgets with errors
   */
  public getErrorWidgets(moduleId: string): Observable<WidgetState[]> {
    return this.getModuleWidgetStates(moduleId).pipe(
      map(widgets => widgets.filter(w => w.has_error)),
      distinctUntilChanged()
    );
  }

  /**
   * Reset widget state
   */
  public resetWidget(moduleId: string, widgetId: string): void {
    this.updateWidgetState(moduleId, widgetId, {
      is_completed: false,
      has_error: false,
      attempts: 0,
      time_spent: 0,
      data: {}
    });
  }

  /**
   * Reset entire module
   */
  public resetModule(moduleId: string): void {
    const modules = this.modulesSubject.value;
    const module = modules.get(moduleId);
    
    if (!module) return;

    // Reset all widgets
    module.widgets.forEach((widget, widgetId) => {
      module.widgets.set(widgetId, {
        ...widget,
        is_completed: false,
        has_error: false,
        attempts: 0,
        time_spent: 0,
        data: {}
      });
    });

    // Reset module state
    module.isCompleted = false;
    module.progress = 0;
    module.totalTime = 0;
    module.lastUpdated = new Date();

    this.modulesSubject.next(new Map(modules));
  }

  /**
   * Get events for a specific widget
   */
  public getWidgetEvents(widgetId: string): Observable<WidgetEvent[]> {
    return this.events$.pipe(
      map(events => events.filter(e => e.widget_id === widgetId))
    );
  }

  /**
   * Get events for a module
   */
  public getModuleEvents(moduleId: string): Observable<WidgetEvent[]> {
    return this.events$.pipe(
      map(events => events.filter(e => {
        const modules = this.modulesSubject.value;
        const module = modules.get(moduleId);
        return module && module.widgets.has(e.widget_id);
      }))
    );
  }

  /**
   * Clear old events (keep last N events)
   */
  public clearOldEvents(keepCount: number = 1000): void {
    const events = this.eventsSubject.value;
    if (events.length > keepCount) {
      const recentEvents = events.slice(-keepCount);
      this.eventsSubject.next(recentEvents);
    }
  }

  /**
   * Export module state for persistence
   */
  public exportModuleState(moduleId: string): any {
    const modules = this.modulesSubject.value;
    const module = modules.get(moduleId);
    
    if (!module) return null;

    return {
      moduleId: module.moduleId,
      widgets: Array.from(module.widgets.entries()).map(([id, state]) => ({
        id,
        state
      })),
      isCompleted: module.isCompleted,
      progress: module.progress,
      totalTime: module.totalTime,
      lastUpdated: module.lastUpdated,
      exportedAt: new Date()
    };
  }

  /**
   * Import module state from persistence
   */
  public importModuleState(stateData: any): void {
    const modules = this.modulesSubject.value;
    const module: ModuleState = {
      moduleId: stateData.moduleId,
      widgets: new Map(stateData.widgets.map((w: any) => [w.id, w.state])),
      isCompleted: stateData.isCompleted,
      progress: stateData.progress,
      totalTime: stateData.totalTime,
      lastUpdated: new Date(stateData.lastUpdated)
    };

    modules.set(module.moduleId, module);
    this.modulesSubject.next(new Map(modules));
  }

  // Private methods
  private updateModuleProgress(module: ModuleState): void {
    const widgets = Array.from(module.widgets.values());
    const totalWidgets = widgets.length;
    const completedWidgets = widgets.filter(w => w.is_completed).length;
    
    module.progress = totalWidgets > 0 ? Math.round((completedWidgets / totalWidgets) * 100) : 0;
    module.totalTime = widgets.reduce((sum, w) => sum + w.time_spent, 0);
    module.lastUpdated = new Date();
    
    // Check if module is completed
    module.isCompleted = completedWidgets === totalWidgets && totalWidgets > 0;
  }

  private emitEvent(event: WidgetEvent): void {
    const events = this.eventsSubject.value;
    this.eventsSubject.next([...events, event]);
    
    // Auto-cleanup old events
    if (events.length > 1000) {
      this.clearOldEvents();
    }
  }
}
