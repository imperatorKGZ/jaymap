/**
 * Общий контракт рабочей области.
 * Каждая рабочая область — управляемый компонент: состояние живёт
 * в useSidebarState (filters store), а не локально внутри воркспейса.
 * Поэтому фильтры не пропадают при открытии вспомогательных разделов.
 */
export interface WorkspaceProps<T extends Record<string, unknown> = Record<string, unknown>> {
  sectionId: string;
  values: T;
  setValue: (key: keyof T & string, value: unknown) => void;
  onSubmit?: () => void;
}
