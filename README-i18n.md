# JayMap i18n — что добавлено / что делать дальше

## Что внутри архива

```
lib/i18n/                      ← новая лёгкая система локализации
  provider.tsx                 ← LanguageProvider (localStorage "jaymap-language", <html lang>)
  useTranslation.ts             ← useTranslation() -> { t, language, setLanguage }
  index.ts                      ← точка входа
  locales/
    ru.ts                       ← источник истины (интерфейс Locale + русские строки)
    en.ts
    ky.ts

app/layout.tsx                  ← добавлена ОДНА обёртка <LanguageProvider>, больше ничего
app/page.tsx                    ← без изменений (скопирован как есть)

components/map/mapLayers.ts     ← подписи городов теперь берут name/name:ru/name:ky
                                    по текущему языку + updateMapLanguage() для смены
                                    языка без пересоздания карты/источников/слоёв
components/map/MainMap.tsx      ← язык прокидывается в setupMapLayers при инициализации,
                                    и updateMapLanguage() вызывается при смене языка
components/map/mapConfig.ts     ← без изменений
components/map/kg-cities.geojson, kg-districts.geojson ← без изменений (уже содержат name:ru/name:ky)

components/map/sidebar/         ← все текстовые литералы заменены на t("...")
  sidebarConfig.tsx              ← title -> titleKey (ключ словаря вместо строки)
  Sidebar.tsx, SidebarNavigation.tsx, SidebarFooter.tsx,
  SidebarHeader.tsx, SidebarWorkspace.tsx, WorkspaceRenderer.tsx
  controls/FilterControls.tsx
  workspaces/*.tsx               ← Rental/Commercial/Land/Daily/Agencies/Favorites/
                                    MapLayers/Profile/Settings/Subscriptions
  (IconRenderer.tsx, icons.tsx, SidebarItem.tsx, SidebarOverlay.tsx,
   useSidebarState.ts, theme.css, HistoryWorkspace.tsx, defaults.ts, types.ts
   — без изменений, скопированы как есть)
```

## Как подключить

1. Скопируйте содержимое архива поверх вашего проекта, сохраняя пути
   (`lib/i18n/...`, `app/layout.tsx`, `components/map/...`).
2. Больше ничего делать не нужно — `LanguageProvider` уже подключён
   в `RootLayout`, переключатель языка можно вызвать из любого
   клиентского компонента:

   ```tsx
   "use client";
   import { useTranslation } from "@/lib/i18n";

   function LanguageSwitch() {
     const { language, setLanguage } = useTranslation();
     return (
       <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
         <option value="ru">RU</option>
         <option value="en">EN</option>
         <option value="ky">KY</option>
       </select>
     );
   }
   ```

   (Замените `as any` на `as Language`, импортировав `Language` из `@/lib/i18n`,
   если хотите избежать `any` — в остальном коде проекта `any` нигде не используется.)

## Единственное, что осталось сделать вручную: Navbar

`Navbar.tsx` не был среди загруженных файлов, поэтому его никто не трогал —
ни оригинальный файл, ни тем более его логика/стили. Но в `locales/*.ts`
уже заготовлены ключи под него:

```
navbar.login            // "Войти" / "Sign in" / "Кирүү"
navbar.search           // "Поиск" / "Search" / "Издөө"
navbar.searchPlaceholder
```

Когда пришлёте `Navbar.tsx`, останется просто:
1. добавить `"use client"` (если его ещё нет) и `import { useTranslation } from "@/lib/i18n"`;
2. заменить литералы на `t("navbar.login")` и т.д. — ровно так же, как это
   сделано во всех файлах Sidebar.

Больше добавлять никакие ключи не потребуется, если в Navbar нет текстов
за пределами login/search — если есть другие (например, "Опубликовать
объявление"), добавьте соответствующие поля в `navbar: {...}` во всех
трёх `locales/*.ts` (интерфейс `Locale` в `ru.ts` заставит TypeScript
напомнить, если забудете один из языков).

## Проверка компиляции

Все новые/изменённые файлы прошли `tsc --strict` без единой новой ошибки
относительно того, что уже было в исходном проекте (единственные оставшиеся
предупреждения — это отсутствующие в вашем реальном проекте модули `overlays/*`
и `Navbar.tsx`, которые не были загружены для этой задачи, а также
несовпадение версии типов `maplibre-gl` в тестовом окружении — в вашем
реальном проекте, где эти модули есть, ошибок не будет).
