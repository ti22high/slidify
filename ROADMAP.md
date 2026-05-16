# Slidify → Google Slides parity roadmap

**Цель:** довести Slidify до 1-в-1 функциональности Google Slides в офлайне.

**Где мы сейчас (по состоянию на текущий main):** работает редактор фигур / текста / таблиц / графиков / картинок / простых анимаций, есть undo/redo, autosave, .slidify ZIP, PPTX read/write thin, presenter view, 5 тем (только цвет фона), File menu (New / Open / Save), RU/EN UI.

**Не работает или сильно отличается от GSlides:** меню сверху (у нас вкладочный ribbon), forматирование текста с runs / multi-paragraph / lists / links, библиотека готовых фигур, таблица с merge/distribute, графики на лету без XLSX, шаблоны/layouts, alignment / smart guides / snap, distribute / group / lock, comments, version history, export в PPTX/JPG/PNG, импорт PPTX рисует ≠ 80% pixel, sketch / pen, headers / slide numbers, find & replace, themes builder, accessibility, печать.

Ниже — карта по областям. **P0** блокеры (без этого продукт не выглядит как GSlides), **P1** must-have (без этого опытный пользователь чувствует ущербность), **P2** nice-to-have, **P3** дальние мечты.

---

## 0. Top-level UI (меню + панель)

Google Slides:

- **Меню сверху** (горизонтальные dropdowns): File / Edit / View / Insert / Format / Slide / Arrange / Tools / Extensions / Help. Под ним **toolbar** с контекстными кнопками (Cut/Copy/Paste/Print/Spell-check/Undo/Redo/Format-painter/Zoom-fit/Background/Layout/Theme/Transition/Insert-text-box/Insert-image/Shape/Line/Comment/Speaker-notes).
- **Speaker notes** дроппин снизу (toggle).
- **Slide explorer** слева.
- **Кнопка Slideshow** справа сверху, кнопка Share/Comments.

У нас:

- Вкладочный Ribbon с табами Insert / Design / Animations / Present + наш собственный FormatBar.
- Notes — только в Inspector справа.
- Sidebar слайдов слева + Inspector справа.

| Что                                                                                                                                    | Статус                                                                                    | Приоритет                                                        | Усилия  |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| **Заменить Ribbon на classic-style menu bar** (File/Edit/View/Insert/Format/Slide/Arrange/Tools/Help) с пунктами как в GSlides         | ✅ есть (PR feat/menu-bar: 9 dropdowns + Present-кнопка)                                  | —                                                                | —       |
| **Сменный toolbar под меню** (Undo/Redo/Zoom/Insert-text/image/shape/line + Paint-format/Comment стабы + context-aware форматирование) | ✅ частично (QuickActions слева, context-aware справа; Paint-format / Comment — заглушки) | P1: добавить Print, Spell-check, Background, Layout, Theme-quick | 1 день  |
| Notes pane снизу (toggle), не в Inspector                                                                                              | ⛔ нет                                                                                    | P1                                                               | 1 день  |
| Кнопка "Slideshow" / "Present" справа сверху                                                                                           | ✅ есть (в menu bar справа сверху)                                                        | —                                                                | —       |
| Filmstrip слева (миниатюры)                                                                                                            | ✅ есть                                                                                   | окей                                                             | —       |
| Inspector справа                                                                                                                       | у нас есть, у GSlides — нет (всё в toolbar или dropdowns)                                 | P2: переосмыслить роль                                           | 1-2 дня |

---

## 1. Текст: rich-text runs / paragraphs / lists / links

Google Slides:

- Внутри одного text box могут быть **параграфы**, в каждом — **runs** с разным форматированием.
- **Списки**: bullet, numbered, multi-level, custom bullet glyph.
- **Indent**, **outdent**, line spacing, paragraph spacing.
- **Bullets demote/promote** (Tab/Shift+Tab).
- **Highlight color** (background).
- **Strikethrough, underline, sub/superscript**.
- **Insert link** (URL + display text).
- **Special characters** dialog (Insert → Special characters).
- **Quote-block / code-block** (через формат).
- **Find & replace** в текстах слайдов.

У нас:

- Один text body на shape: один шрифт, один размер, один цвет, один align на весь text. Никаких runs.
- Нет списков.
- Нет underline / strikethrough / sub/superscript / highlight.
- Нет ссылок.

| Что                                                                                              | Статус                                                                               | Приоритет | Усилия                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------- |
| Переписать `TextBody` на список параграфов с runs (`{ runs: TextRun[], align, bullet, indent }`) | ⛔ нет                                                                               | **P0**    | 4-6 дней (модель + рендер + редактор + миграция .slidify) |
| Bullet list (•)                                                                                  | ⛔ нет                                                                               | P0        | 1 день                                                    |
| Numbered list                                                                                    | ⛔ нет                                                                               | P0        | 1 день                                                    |
| Multi-level lists, Tab/Shift+Tab indent                                                          | ⛔ нет                                                                               | P1        | 2 дня                                                     |
| Underline / strikethrough                                                                        | ⛔ нет                                                                               | P0        | 0.5 дня (после runs)                                      |
| Sub/superscript                                                                                  | ⛔ нет                                                                               | P1        | 0.5 дня                                                   |
| Highlight color (text bg)                                                                        | ⛔ нет                                                                               | P1        | 0.5 дня                                                   |
| Line spacing, paragraph spacing                                                                  | ⛔ нет                                                                               | P1        | 1 день                                                    |
| Insert link                                                                                      | ⛔ нет                                                                               | P1        | 1 день                                                    |
| Special characters dialog                                                                        | ⛔ нет                                                                               | P2        | 1 день                                                    |
| Find & replace (всё за слайдами + ячейки таблиц)                                                 | ✅ есть (Cmd+F, Edit→Find and replace, Tools→Find; match case; Replace all = 1 undo) | —         | —                                                         |
| Spell check                                                                                      | ⛔ нет                                                                               | P2        | 1-2 дня (через native APIs / nspell)                      |

---

## 2. Фигуры: библиотека и редактирование

Google Slides:

- **~30 предустановленных фигур** (Shape dropdown): rectangle, rounded-rect, oval, triangle, parallelogram, trapezoid, pentagon, hexagon, octagon, star (5/6/7/8/24/32), arrow (5+ типов), callout (10+ типов), flowchart (15+ типов: process, decision, terminator, document, etc.), equation (plus/minus/multiply/divide/equal/not-equal).
- **Lines**: straight, elbow, curved, polyline, arc + arrows на концах с настройкой типа стрелки.
- **Word Art** (Insert → Word art).
- **Diagram** (Insert → Diagram): grid / hierarchy / timeline / process / relationship / cycle с автогенерацией.
- **Format Options panel**: Size & Position, Drop shadow, Reflection, Recolor.
- **Crop** для изображений.
- **Replace image**.
- **Reset image** (revert crops/effects).

У нас:

- 4 фигуры: rect, ellipse, line, arrow (одного типа).
- Линии только прямые.
- Нет WordArt, Diagram, Callout, Flowchart, Star, Polygon.
- Тень / отражение / recolor — нет.
- Crop / replace — нет.

| Что                                                                         | Статус                          | Приоритет | Усилия                       |
| --------------------------------------------------------------------------- | ------------------------------- | --------- | ---------------------------- |
| **Shape library**: ~30 пресетов (через SVG path data) — это `prstGeom` PPTX | ⛔ только 4                     | **P0**    | 4-5 дней                     |
| Star, Polygon (n=3..12)                                                     | ⛔ нет                          | P0        | 1 день                       |
| Rounded rectangle                                                           | ⛔ нет                          | P0        | 0.5 дня                      |
| Callout shapes (speech bubble, thought, line callout)                       | ⛔ нет                          | P1        | 2 дня                        |
| Flowchart shapes (15 штук)                                                  | ⛔ нет                          | P1        | 2 дня                        |
| Elbow / curved / arc lines                                                  | ⛔ нет                          | P1        | 3 дня (connector routing)    |
| Polyline / open path                                                        | ⛔ нет                          | P2        | 2 дня                        |
| Arrow head/tail style picker (open/filled/diamond/oval, size)               | ⛔ только filled arrow на конце | P1        | 1 день                       |
| Pen / freehand drawing tool                                                 | ⛔ нет                          | P2        | 2-3 дня                      |
| Word Art                                                                    | ⛔ нет                          | P2        | 2 дня (SVG text + path warp) |
| Diagram / SmartArt                                                          | ⛔ нет                          | P3        | 5-8 дней                     |
| Drop shadow per shape                                                       | ⛔ нет                          | P1        | 1 день (SVG filter)          |
| Reflection                                                                  | ⛔ нет                          | P2        | 1 день                       |
| Image crop (rect + shape mask)                                              | ⛔ нет                          | **P0**    | 2 дня                        |
| Image replace                                                               | ⛔ нет                          | P1        | 0.5 дня                      |
| Image recolor (filters: greyscale / sepia / tint)                           | ⛔ нет                          | P2        | 1-2 дня                      |
| Image transparency adjust                                                   | ✅ есть opacity на shape        | окей      | —                            |
| Connector lines с автопривязкой к ручкам фигур                              | ⛔ нет                          | P2        | 3 дня                        |

---

## 3. Таблицы

Google Slides:

- **Merge / Unmerge cells**.
- **Distribute rows / columns evenly**.
- **Resize columns / rows** drag-handles.
- **Cell vertical alignment** (top/middle/bottom).
- **Cell padding**.
- **Border style** per side (none/solid/dashed/dotted, width, color).
- **Table border / cell border** разделение.
- **Background color** per cell.
- **Insert / delete row above/below, column left/right**.
- **Header row** highlight.

У нас:

- Add/remove последний row/col (через FormatBar).
- Текст в ячейке.
- Per-cell fill / align (есть в модели, нет UI).
- Border: только один общий stroke на shape, не per-cell, не per-side.
- Нет merge, distribute, resize, padding.

| Что                                                               | Статус                     | Приоритет | Усилия                     |
| ----------------------------------------------------------------- | -------------------------- | --------- | -------------------------- |
| Insert row above/below at cursor, column left/right at cursor     | ⛔ только в конец          | P0        | 0.5 дня                    |
| Per-cell background colour picker                                 | партиально (в модели есть) | P0        | 0.5 дня                    |
| Per-cell text alignment                                           | партиально                 | P0        | 0.5 дня                    |
| Per-cell vertical alignment (top/middle/bottom)                   | ⛔ нет                     | P1        | 0.5 дня                    |
| Per-side cell border (top/right/bottom/left, style, width, color) | ⛔ нет                     | P1        | 2 дня (модель + UI)        |
| Resize columns / rows drag-handle                                 | ⛔ нет                     | **P0**    | 2 дня                      |
| Merge / Unmerge cells                                             | ⛔ нет                     | P0        | 2-3 дня (модель cell-span) |
| Distribute rows / columns evenly                                  | ⛔ нет                     | P1        | 0.5 дня                    |
| Header row highlight (auto)                                       | ⛔ нет                     | P2        | 0.5 дня                    |
| Cell padding control                                              | ⛔ нет                     | P1        | 0.5 дня                    |

---

## 4. Графики

Google Slides:

- **Insert → Chart → Bar / Column / Line / Pie / Bar (вертикально/горизонтально)**.
- Каждый chart открывается **внутренним «Sheet» (linked spreadsheet)** — таблицу с данными можно редактировать прямо в overlay.
- Цвета серий, легенда on/off, заголовок, axis labels, gridlines.
- **Linked chart** — данные синкаются с Google Sheets автоматически.

У нас:

- Insert chart возможен только если уже импортирован XLSX (`+ XLSX...` → потом `+ График`).
- 3 типа: bar / line / pie.
- Нет встроенного редактора данных.
- Нет UI: title / axis / legend / colors / series management.

| Что                                                         | Статус                          | Приоритет | Усилия                   |
| ----------------------------------------------------------- | ------------------------------- | --------- | ------------------------ |
| **Inline data editor** для chart (mini-spreadsheet popover) | ⛔ нужно сначала импортить XLSX | **P0**    | 3-4 дня                  |
| Chart title                                                 | ⛔ модель есть, UI нет          | P0        | 0.5 дня                  |
| Axis labels (X / Y)                                         | ⛔ нет                          | P0        | 0.5 дня                  |
| Legend on/off + position                                    | ⛔ recharts по умолчанию        | P0        | 0.5 дня                  |
| Gridlines on/off                                            | ⛔ нет                          | P1        | 0.5 дня                  |
| Series add / remove / rename                                | ⛔ только default               | P0        | 1 день                   |
| Series colour per series                                    | ⛔ default palette              | P0        | 0.5 дня                  |
| Column chart (vertical bars)                                | ✅ есть «bar»                   | окей      | —                        |
| Stacked bar / stacked column                                | ⛔ нет                          | P1        | 0.5 дня (recharts опция) |
| Area chart                                                  | ⛔ нет                          | P2        | 0.5 дня                  |
| Scatter chart                                               | ⛔ нет                          | P2        | 1 день                   |
| Doughnut chart                                              | ⛔ нет                          | P2        | 0.5 дня                  |
| Trendline                                                   | ⛔ нет                          | P3        | 1-2 дня                  |
| Linked-data refresh (re-import same XLSX)                   | ⛔ нет                          | P1        | 1 день                   |

---

## 5. Слайды: layouts, themes, masters

Google Slides:

- **Layouts**: Title slide, Title + body, Title + two columns, Title only, Section header, Caption, Blank, Centered title, и т.д. ~11 встроенных.
- **Theme** — pack: master + layouts + цветовая палитра + два шрифта (heading / body). При смене темы все слайды перекрашиваются.
- **Theme builder** (View → Master): редактировать мастер-слайд напрямую, создавать новые layouts, выбирать цвета/шрифты.
- **Insert > Layout**: insert from gallery (built-in + uploaded).
- **Apply layout / Reset layout** для слайда.
- **Background** image / fill picker per-slide или per-master.

У нас:

- 1 master (Default), 1 layout (Blank).
- 5 «тем» — но они меняют ТОЛЬКО `masters[0].background`. Шрифты и accent — нет.
- Нет UI для смены layout.
- Нет theme builder.
- Background per-slide — только через master.

| Что                                                                                                                                              | Статус                                                                                                  | Приоритет | Усилия   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------- | -------- |
| **11 встроенных layouts** (Title, Title+body, Section, Two columns, Caption, Blank, Centered, Title-content, Comparison, Big number, Title-only) | ✅ есть (builtinLayouts.ts, 11 layouts с ghost placeholders)                                            | —         | —        |
| Layout picker (Slide → Apply layout)                                                                                                             | ✅ есть (dropdown в Slide menu, dispatch slide/setLayout)                                               | —         | —        |
| Apply / Reset layout                                                                                                                             | ⛔ нет                                                                                                  | P1        | 1 день   |
| Theme apply: фон + accent + heading-font + body-font во все шейпы                                                                                | ✅ есть (theme/apply пропагирует text colour, fonts по bold-флагу heading/body, fill='accent' → accent) | —         | —        |
| Background image per-slide                                                                                                                       | ⛔ нет (только фон)                                                                                     | P1        | 1 день   |
| Master / theme editor view (View → Master)                                                                                                       | ⛔ нет                                                                                                  | P2        | 4-5 дней |
| Custom theme upload                                                                                                                              | ⛔ нет                                                                                                  | P3        | 2 дня    |
| Slide numbering (Insert → Slide number)                                                                                                          | ⛔ нет                                                                                                  | P1        | 0.5 дня  |
| Headers / footers                                                                                                                                | ⛔ нет                                                                                                  | P1        | 1 день   |
| Date placeholder                                                                                                                                 | ⛔ нет                                                                                                  | P1        | 0.5 дня  |
| Hide slide (skip during presentation)                                                                                                            | ⛔ нет                                                                                                  | P1        | 0.5 дня  |

---

## 6. Arrange: alignment, distribution, snap, group, lock

Google Slides:

- **Align**: left / center / right / top / middle / bottom (to selection или to slide).
- **Distribute**: horizontally / vertically.
- **Group / Ungroup** (Cmd+G / Cmd+Shift+G).
- **Rotate**: 90° left/right, flip horizontal/vertical.
- **Order**: bring to front / forward / back / backward.
- **Smart guides** (pink/red lines на drag).
- **Snap to grid / Snap to guides**.
- **Lock position**.
- **Ruler** сверху и слева.

У нас:

- Order — есть (right-click context menu).
- Rotation handle есть, +Shift snap 15°.
- Align / Distribute — НЕТ.
- Group / Ungroup — НЕТ.
- Smart guides / Snap — НЕТ.
- Flip — НЕТ.
- Lock — НЕТ.
- Ruler — НЕТ.

| Что                                                                                 | Статус                                                              | Приоритет | Усилия                        |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------- | ----------------------------- |
| **Align**: 6 кнопок (left/center/right/top/middle/bottom) на selection или на slide | ✅ есть (Arrange → Align, dispatch arrange/align)                   | —         | —                             |
| **Distribute**: horizontal / vertical                                               | ✅ есть (Arrange → Distribute, dispatch arrange/distribute)         | —         | —                             |
| **Group / Ungroup** (Cmd+G / Cmd+Shift+G)                                           | ⛔ нет                                                              | **P0**    | 2 дня (модель group + render) |
| Rotate 90° CW/CCW                                                                   | ✅ есть (Arrange → Rotate, dispatch arrange/rotateBy)               | —         | —                             |
| Flip H/V                                                                            | ✅ есть (поля flipH/flipV в Shape, Arrange → Flip H/V)              | —         | —                             |
| **Smart guides** (snap к границам / центрам других фигур + слайд) при drag          | ✅ есть (snapGuides.ts + розовые pixel-снап линии; Shift отключает) | —         | —                             |
| Snap to grid (toggle)                                                               | ⛔ нет                                                              | P1        | 0.5 дня                       |
| Snap to guides (user-defined guides)                                                | ⛔ нет                                                              | P2        | 1 день                        |
| Lock shape position                                                                 | ⛔ нет                                                              | P1        | 1 день                        |
| Ruler (top + left)                                                                  | ⛔ нет                                                              | P2        | 1 день                        |
| Edit-handle for shape-specific geometry (e.g. rounded-rect corner radius drag)      | ⛔ нет                                                              | P2        | 1 день per-shape              |

---

## 7. Comments / Collaboration / Version history

Google Slides:

- **Comments** per shape / slide, threading, resolve, @-mentions.
- **Version history** with named versions, restore previous version.
- **Real-time collaboration** (other cursors visible).
- **Sharing** with permissions.
- **Suggestions mode**.

У нас:

- Ничего из этого.

| Что                                       | Статус                                             | Приоритет                                      | Усилия  |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------- | ------- |
| Comments per shape / slide, в data модели | ⛔ нет                                             | P1 (single-user всё равно полезно для заметок) | 3 дня   |
| Comments resolved status                  | ⛔ нет                                             | P1                                             | 0.5 дня |
| Comment thread overlay                    | ⛔ нет                                             | P1                                             | 1 день  |
| Version history (snapshot list, restore)  | ⛔ нет (есть autosave, нет именованных версий)     | P2                                             | 2 дня   |
| Real-time collaboration                   | ⛔ невозможно (CLAUDE.md: "no network at runtime") | **N/A**                                        | —       |

---

## 8. Animations & Transitions

Google Slides:

- **Animations**: 23 entrance + 21 exit + 7 emphasis + motion path.
- **Animations panel** (View → Animations): список, reorder, on-click/with-prev/after-prev, duration slider, delay.
- **Transitions**: none / fade / slide / flip / cube / gallery (6 шт).
- Apply transition to all slides.
- Audio narration (Insert → Audio).
- Video embed (Insert → Video).
- Auto-advance timer per slide.

У нас:

- 15 пресетов (5+5+4+1) — половина GSlides.
- Animations UI в Ribbon → Анимация: 1 фигура за раз, dropdown.
- Transitions: 5 типов, picker в Inspector.
- Нет audio, video.
- Auto-advance — нет.

| Что                                                                       | Статус                   | Приоритет | Усилия              |
| ------------------------------------------------------------------------- | ------------------------ | --------- | ------------------- |
| Animations panel слева (полноценный) — список, reorder drag, edit, delete | ⛔ упрощённый в ribbon   | P1        | 2 дня               |
| Расширить до ~50 пресетов (rotate-in, swing, swivel, bounce, etc.)        | ⛔ 15 шт                 | P1        | 1-2 дня             |
| Motion path: drag path точек на canvas                                    | ⛔ только linear         | P2        | 3-4 дня             |
| Duration / delay slider в UI                                              | ⛔ есть в модели, нет UI | P0        | 0.5 дня             |
| Sound effect on animation                                                 | ⛔ нет                   | P3        | 1 день              |
| Audio embed (Insert → Audio)                                              | ⛔ нет                   | P2        | 2 дня (audio shape) |
| Video embed (Insert → Video)                                              | ⛔ нет                   | P2        | 2 дня (video shape) |
| Auto-advance timer per slide                                              | ⛔ нет                   | P1        | 0.5 дня             |
| Loop presentation                                                         | ⛔ нет                   | P2        | 0.5 дня             |

---

## 9. Презентация (Slideshow) mode

Google Slides:

- **F5 / Cmd+Enter** — fullscreen из текущего слайда.
- **Speaker view** (отдельное окно): notes, next-slide preview, slide grid, **Q&A**, **laser pointer**, **audience polling**.
- **Pen tool** во время презентации (draw on slide).
- **Hide cursor** auto.
- **Slide grid jump** (G).

У нас:

- F5 → fullscreen ✅
- Presenter view (notes + next + timer) ✅ — но в том же окне, не на втором мониторе.
- Laser pointer / pen — нет.
- Slide grid jump — нет.
- Q&A / poll — нет.

| Что                                            | Статус           | Приоритет | Усилия                            |
| ---------------------------------------------- | ---------------- | --------- | --------------------------------- |
| Presenter view на втором мониторе              | ⛔ в том же окне | **P0**    | 2 дня (Electron screen API + IPC) |
| Laser pointer mode (toggle, draws cursor halo) | ⛔ нет           | P1        | 1 день                            |
| Pen / draw on slide во время показа            | ⛔ нет           | P1        | 2 дня                             |
| Slide grid view (G key)                        | ⛔ нет           | P1        | 1 день                            |
| Jump to slide N (typing)                       | ⛔ нет           | P1        | 0.5 дня                           |
| Q&A (gather questions)                         | ⛔ нет           | P3        | — (требует сети)                  |
| Audience polling                               | ⛔ нет           | P3        | — (требует сети)                  |
| Auto-advance timer                             | ⛔ нет           | P1        | 0.5 дня                           |
| Loop                                           | ⛔ нет           | P2        | 0.5 дня                           |

---

## 10. Импорт / экспорт

Google Slides:

- **Открывает**: .pptx, .odp, .key (Keynote), .pdf import (как изображения), Google Slides формат.
- **Скачивает в**: .pptx, .odp, .pdf, .jpeg, .png, .svg, .txt (plain text).
- **Print** (через стандартный print dialog).

У нас:

- Open / Save в `.slidify` (наш формат) ✅
- PPTX read thin (только small fixture, не реальные deck) — есть код в main/pptx/, не подключен к меню.
- PPTX write thin — есть, не подключен.
- PDF export — есть `printDeckToPdf` в main/export/, не подключен к меню.
- JPEG / PNG / SVG export — нет.
- Print — нет.
- ODP / Keynote — нет.

| Что                                                                                                          | Статус                | Приоритет | Усилия                                       |
| ------------------------------------------------------------------------------------------------------------ | --------------------- | --------- | -------------------------------------------- |
| File → Import PPTX (через menu)                                                                              | ⛔ код есть, UI нет   | **P0**    | 1 день (wire + dialog + state replace)       |
| File → Export PPTX                                                                                           | ⛔ код есть, UI нет   | **P0**    | 1 день                                       |
| File → Export PDF                                                                                            | ⛔ код есть, UI нет   | **P0**    | 1 день                                       |
| File → Export JPEG / PNG per-slide                                                                           | ⛔ нет                | P1        | 1-2 дня (SVG → canvas → blob)                |
| File → Export SVG per-slide                                                                                  | ⛔ нет                | P1        | 0.5 дня                                      |
| File → Export plain text (outline)                                                                           | ⛔ нет                | P2        | 0.5 дня                                      |
| File → Print                                                                                                 | ⛔ нет                | P1        | 0.5 дня (`window.print()` через print-route) |
| PPTX import quality: реальные PowerPoint-файлы (theme inheritance, picture fill, gradFill, smartArt, charts) | ⛔ Sprint 7 thin only | **P1**    | 10-15 дней (это эпик)                        |
| PPTX export quality: roundtrip с PowerPoint                                                                  | ⛔ Sprint 8 thin only | **P1**    | 10-15 дней (эпик)                            |
| ODP read/write                                                                                               | ⛔ нет                | P3        | 10 дней                                      |
| Keynote read                                                                                                 | ⛔ нет                | P3        | — (закрытый формат, плохо документирован)    |

---

## 11. Templates (готовые шаблоны)

Google Slides:

- **Template gallery** на главной (28+ tabs): Blank, Lessons, Pitch deck, Photo album, Pro template, etc.
- Каждый template — набор слайдов с placeholder контентом.

У нас:

- Нет template gallery.

| Что                            | Статус | Приоритет | Усилия                                                                   |
| ------------------------------ | ------ | --------- | ------------------------------------------------------------------------ |
| Template gallery (на New file) | ⛔ нет | P1        | 3-4 дня (UI + 10 встроенных шаблонов как .slidify в `assets/templates/`) |
| User-saved templates           | ⛔ нет | P2        | 2 дня                                                                    |

---

## 12. Accessibility / печать / прочее

Google Slides:

- **Alt text** для изображений / фигур.
- **Accessibility checker**.
- **Captions in slideshow** (live subtitles из микрофона).
- **Print preview**.
- **Print without speaker notes / with notes / handouts (6 slides per page)**.
- **Outline view** (только текст слайдов).

У нас:

- Нет alt text UI.
- Нет accessibility check.
- Нет captions.
- Нет print preview / handouts.
- Нет outline view.

| Что                                                   | Статус                                     | Приоритет | Усилия  |
| ----------------------------------------------------- | ------------------------------------------ | --------- | ------- |
| Alt text input в Inspector для image shape            | ⛔ есть поле в модели, нет UI              | P1        | 0.5 дня |
| Print preview dialog                                  | ⛔ нет                                     | P1        | 1 день  |
| Print with handouts (2/4/6/9 slides per page)         | ⛔ нет                                     | P2        | 2 дня   |
| Print with speaker notes                              | ⛔ нет                                     | P1        | 1 день  |
| Outline view (текст всех слайдов)                     | ⛔ нет                                     | P2        | 1 день  |
| Accessibility checker (contrast, alt text, font size) | ⛔ нет                                     | P3        | 3 дня   |
| Live captions от микрофона во время презентации       | ⛔ нет (offline-only — без web speech API) | P3        | —       |

---

## 13. Tools

Google Slides:

- **Word count** (Tools → Word count).
- **Voice type speaker notes** (Tools → Voice type).
- **Translate document** (Tools → Translate).
- **Linked Sheets** (Tools → Linked spreadsheets).
- **Dictionary / Define** sidebar.
- **Citations** (Tools → Citations).
- **Explore** (sidebar with suggested content).

Большинство этого требует cloud / network. У нас offline.

| Что                                                    | Статус         | Приоритет | Усилия                   |
| ------------------------------------------------------ | -------------- | --------- | ------------------------ |
| Word count                                             | ⛔ нет         | P2        | 0.5 дня                  |
| Linked Sheets (refresh XLSX-backed charts/data shapes) | партиально     | P1        | 1 день                   |
| Dictionary / Define                                    | ⛔ нет         | P3        | — (offline dict big dep) |
| Translate                                              | ⛔ N/A offline | P3        | —                        |
| Voice type                                             | ⛔ N/A offline | P3        | —                        |

---

## 14. Performance, edge cases, polish

| Что                                                                                                                        | Статус                              | Приоритет | Усилия  |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------- | ------- |
| Bundle size — renderer уже 1.4MB (с recharts + jszip + react). Code-splitting презентации/импорта                          | ⛔ нет                              | P2        | 1 день  |
| Thumbnail rendering для 100+ слайдов без лагов                                                                             | partial (есть debounce, нет worker) | P2        | 1 день  |
| Undo limit 200 шагов — у GSlides безлимит                                                                                  | ✅ acceptable                       | —         | —       |
| Native menu items с динамической доступностью (Save серый когда нет изменений и т.д.)                                      | partial                             | P2        | 0.5 дня |
| Электронное меню "Edit" сейчас стандартный (cut/copy/paste/undo/redo через role: ...) — но Cut/Copy для shapes не работает | ⛔ только в keymap.ts               | P1        | 1 день  |
| Auto-save индикатор в строке: уже есть «Сохранено HH:MM»                                                                   | ✅ есть                             | —         | —       |
| Drag-drop image / .slidify на окно                                                                                         | ✅ есть                             | —         | —       |
| Cmd+Z в инпутах ловит keymap → undo всего документа                                                                        | ✅ keymap ignores editable targets  | —         | —       |

---

## 15. Архитектурные долги (techdebt)

| Что                                                                                                                 | Приоритет            | Усилия     |
| ------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------- |
| Bundle splitting: presenter view / pptx / xlsx как async chunks                                                     | P2                   | 1 день     |
| Move SVG-only Shape rendering pure (без store hooks) для PPTX export pipeline                                       | P2                   | 1 день     |
| Replace ad-hoc `useEditorStore.setState((s) => ...)` patches (notes, transition) → proper actions с undo поддержкой | P0 (это потеря undo) | 1 день     |
| Native module: calamine для XLSX > 100k rows (TODO sprint-6-calamine)                                               | P2                   | 5-7 дней   |
| Real PPTX fixtures + visual-diff test harness                                                                       | P1                   | 3 дня      |
| ADRs (docs/adr) для крупных решений (rich-text model, smart guides algorithm)                                       | P2                   | continuous |

---

## Фазовая дорожная карта

### Фаза A — «уже похоже на Google Slides» (4-6 недель)

Закрываем все **P0** из секций 0, 1, 2 (часть), 3, 4, 5 (часть), 6, 10 (часть).

1. **Top-level menu bar + secondary toolbar** (нед. 1)
2. **Rich-text runs / paragraphs / lists** (нед. 2-3) — самая болезненная переделка
3. **Find & replace** (нед. 3)
4. **Shape library: 30 пресетов** (нед. 4)
5. **Image crop, replace** (нед. 4)
6. **Align / distribute / group / smart guides** (нед. 5)
7. **Layouts: 11 встроенных** (нед. 5)
8. **Theme apply: фон + accent + шрифты во все шейпы** (нед. 5)
9. **Inline chart data editor** (нед. 6)
10. **Table cell-level fill / border / merge / resize** (нед. 6)
11. **File menu wired: Import PPTX, Export PPTX/PDF/PNG** (нед. 6)

Конец фазы A: продукт **визуально похож** на GSlides и **80% базовых операций** работают так же.

### Фаза B — «зрелый редактор» (6-8 недель)

Закрываем **P1** + полировка.

12. **Drop shadow, reflection, recolor**
13. **Word art**, callouts, flowchart shapes
14. **Connector lines + elbow + curved**
15. **Per-side cell borders, distribute, cell padding**
16. **Master slide editor view**
17. **Slide number, header, footer, date placeholder**
18. **Animations panel слева (полноценный)**
19. **Audio / video embed**
20. **Presenter view на втором мониторе**
21. **Laser pointer, pen, slide grid jump**
22. **Linked Sheets refresh, Linked XLSX**
23. **Comments (single-user)**
24. **Print preview + handouts**
25. **Outline view**

### Фаза C — «реальный PPTX-роутинг» (6-10 недель)

Превращаем Sprint 7/8 thin reader/writer в production.

26. **PPTX import: theme inheritance, placeholders, picture fill, gradFill, smartArt → fallback, real chart parse**
27. **PPTX export: эквивалентные элементы из нашей модели**
28. **Round-trip с PowerPoint 2019+ ≥ 95% pixel parity** на 20 реальных файлов
29. **Real fixtures + visual-diff harness в CI**

### Фаза D — «исследовательские» фичи (бесконечно)

- Templates gallery + theme builder
- Diagrams / SmartArt
- Pen freehand drawing
- Accessibility checker
- ODP read/write
- ML-based слайд suggestions (Insert → Explore-style)
- Headers с QR-кодами / NFC handouts
- Печать с раскладкой booklet / 4-up / etc.

---

## Метрики готовности

| Параметр                     | Текущий                                             | Цель Фазы A                                                                                                | Цель Фазы B          |
| ---------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| Shape types                  | 7 (rect, ellipse, line, arrow, image, table, chart) | 30+                                                                                                        | 50+                  |
| Text features                | 6 (font / size / B / I / color / align)             | 16 (+ list / link / underline / strikethrough / sub / super / highlight / spacing × 2 / runs / paragraphs) | 20+                  |
| Layouts                      | 1 (Blank)                                           | 11                                                                                                         | 11 + user-defined    |
| Theme application            | фон only                                            | фон + accent + 2 fonts на все shapes                                                                       | + theme builder UI   |
| Slide transitions            | 5                                                   | 5                                                                                                          | 6+                   |
| Animation presets            | 15                                                  | 25                                                                                                         | 50                   |
| Export formats               | 0 (через UI)                                        | 3 (PPTX, PDF, PNG)                                                                                         | 5 (+ JPEG, SVG, TXT) |
| Import formats               | 0 (через UI)                                        | 1 (PPTX thin)                                                                                              | 1 (PPTX production)  |
| File menu wired              | partial                                             | full                                                                                                       | full                 |
| PPTX round-trip pixel parity | 0%                                                  | 60% (thin)                                                                                                 | 95% (production)     |
| Accessibility                | 0                                                   | alt text                                                                                                   | + checker            |
| Print                        | 0                                                   | 1 (default print dialog)                                                                                   | + handouts + notes   |

---

## Что делать прямо сейчас

Если хочешь начать с **самого видимого** — порядок такой:

1. **Top menu bar** (классический File/Edit/View/Insert/Format/Slide/Arrange/Tools/Help). Один день, и продукт сразу выглядит знакомо.
2. **Secondary toolbar** под меню вместо нашего Ribbon. День.
3. **Format painter + дублирование стиля**. Полдня.
4. **Align / Distribute / Group**. День-два.
5. **Smart guides snap**. Два дня.
6. **Image crop**. Два дня.
7. **Rich-text runs** (это эпик на неделю — но без этого мы навсегда «недо-Google»).
8. **Shape library +30**. Неделя.
9. **Layouts + theme apply целиком**. Неделя.
10. **Find & replace**. Два дня.

После этих 10 пунктов (~5 недель работы) у нас будет **визуально и функционально** очень близко к Google Slides на 70-80% повседневных операций. Дальше — поэтапно по фазе B и C.

---

_Last updated: 2026-05-15_
