import { create as createStore } from 'zustand';

export type Locale = 'ru' | 'en';

type Strings = Record<string, string>;

const en: Strings = {
  // ribbon
  'ribbon.brand': 'Slidify',
  'ribbon.tab.insert': 'Insert',
  'ribbon.tab.design': 'Design',
  'ribbon.tab.animations': 'Animations',
  'ribbon.tab.present': 'Present',
  'ribbon.insert.text': 'Text',
  'ribbon.insert.rectangle': 'Rectangle',
  'ribbon.insert.ellipse': 'Ellipse',
  'ribbon.insert.line': 'Line',
  'ribbon.insert.arrow': 'Arrow',
  'ribbon.insert.table': 'Table',
  'ribbon.insert.image': 'Image…',
  'ribbon.insert.xlsx': 'XLSX…',
  'ribbon.design.hint': 'Pick a theme:',
  'ribbon.animations.empty': 'Select a shape to attach an animation.',
  'ribbon.animations.add': 'Add',
  'ribbon.animations.trigger.onClick': 'on click',
  'ribbon.animations.trigger.withPrevious': 'with previous',
  'ribbon.animations.trigger.afterPrevious': 'after previous',
  'ribbon.present.start': 'Start (F5)',
  'ribbon.present.presenter': 'Presenter mode',
  'ribbon.locale': 'RU',

  // thumbnails
  'sidebar.slides': 'Slides',
  'sidebar.add': 'Add slide',
  'sidebar.duplicate': 'Duplicate slide',
  'sidebar.delete': 'Delete slide',

  // inspector
  'inspector.title': 'Inspector',
  'inspector.empty': 'Select something on the slide to edit its properties.',
  'inspector.multi': '{count} shapes selected.',
  'inspector.notes': 'Speaker notes',
  'inspector.notesPlaceholder': 'Notes shown in presenter view…',
  'inspector.strokeWidth': 'Stroke (pt)',
  'inspector.opacity': 'Opacity',
  'inspector.slideTransition': 'Slide transition',

  // context menu
  'ctx.bringFront': 'Bring to front',
  'ctx.bringForward': 'Bring forward',
  'ctx.sendBackward': 'Send backward',
  'ctx.sendBack': 'Send to back',
  'ctx.duplicate': 'Duplicate',
  'ctx.delete': 'Delete',

  'format.bold': 'Bold (Cmd+B)',
  'format.italic': 'Italic (Cmd+I)',
  'format.underline': 'Underline (Cmd+U)',
  'format.color': 'Text color',
  'format.alignLeft': 'Align left',
  'format.alignCenter': 'Align center',
  'format.alignRight': 'Align right',
  'format.fontFamily': 'Font',
  'format.fontSize': 'Size',
  'format.placeholder': 'Select a text frame to format it.',

  // status bar
  'status.saved': 'Saved {time}',
  'status.unsaved': 'Unsaved changes',
  'status.fileUntitled': 'Untitled',
  'inspector.type': 'Type',
  'inspector.xIn': 'X (in)',
  'inspector.yIn': 'Y (in)',
  'inspector.wIn': 'W (in)',
  'inspector.hIn': 'H (in)',
  'inspector.rotation': 'Rotation (°)',
  'inspector.fill': 'Fill',
  'inspector.stroke': 'Stroke',
  'inspector.delete': 'Delete shape',

  // status bar
  'status.slideOf': 'Slide {n} / {total}',
  'status.zoom': 'Zoom',

  // text toolbar
  'toolbar.fontFamily': 'Font family',
  'toolbar.fontSize': 'Font size',
  'toolbar.bold': 'Bold',
  'toolbar.italic': 'Italic',
  'toolbar.color': 'Text color',
  'toolbar.alignLeft': 'Align left',
  'toolbar.alignCenter': 'Align center',
  'toolbar.alignRight': 'Align right',

  // recovery
  'recovery.title': 'Restore unsaved changes?',
  'recovery.body':
    'Slidify found {n} session(s) that did not shut down cleanly. Restore to continue, or discard.',
  'recovery.restore': 'Restore',
  'recovery.discard': 'Discard',
  'recovery.ops': '{n} op(s)',

  // data preview
  'data.unavailable': 'Dataset unavailable.',
  'data.column': 'Column',
  'data.count': 'Count',
  'data.sum': 'Sum',
  'data.avg': 'Avg',
  'data.noNumeric': 'No numeric columns to summarise.',

  // player
  'player.next': 'Next',
  'player.elapsed': 'Elapsed',
  'player.noNotes': 'No speaker notes.',
  'player.notes': 'Notes',
  'player.exitHint': 'Press Esc to exit',
};

const ru: Strings = {
  // ribbon
  'ribbon.brand': 'Slidify',
  'ribbon.tab.insert': 'Вставка',
  'ribbon.tab.design': 'Дизайн',
  'ribbon.tab.animations': 'Анимация',
  'ribbon.tab.present': 'Показ',
  'ribbon.insert.text': 'Текст',
  'ribbon.insert.rectangle': 'Прямоугольник',
  'ribbon.insert.ellipse': 'Эллипс',
  'ribbon.insert.line': 'Линия',
  'ribbon.insert.arrow': 'Стрелка',
  'ribbon.insert.table': 'Таблица',
  'ribbon.insert.image': 'Изображение…',
  'ribbon.insert.xlsx': 'XLSX…',
  'ribbon.design.hint': 'Выберите тему:',
  'ribbon.animations.empty': 'Выделите фигуру, чтобы добавить анимацию.',
  'ribbon.animations.add': 'Добавить',
  'ribbon.animations.trigger.onClick': 'по клику',
  'ribbon.animations.trigger.withPrevious': 'с предыдущей',
  'ribbon.animations.trigger.afterPrevious': 'после предыдущей',
  'ribbon.present.start': 'Запустить (F5)',
  'ribbon.present.presenter': 'Режим докладчика',
  'ribbon.locale': 'EN',

  // thumbnails
  'sidebar.slides': 'Слайды',
  'sidebar.add': 'Добавить слайд',
  'sidebar.duplicate': 'Дублировать слайд',
  'sidebar.delete': 'Удалить слайд',

  // inspector
  'inspector.title': 'Свойства',
  'inspector.empty': 'Выделите объект, чтобы изменить его свойства.',
  'inspector.multi': 'Выделено объектов: {count}.',
  'inspector.notes': 'Заметки докладчика',
  'inspector.notesPlaceholder': 'Заметки видны в режиме докладчика…',
  'inspector.strokeWidth': 'Толщина обводки (pt)',
  'inspector.opacity': 'Прозрачность',
  'inspector.slideTransition': 'Переход слайда',

  // context menu
  'ctx.bringFront': 'На передний план',
  'ctx.bringForward': 'Переместить вперёд',
  'ctx.sendBackward': 'Переместить назад',
  'ctx.sendBack': 'На задний план',
  'ctx.duplicate': 'Дублировать',
  'ctx.delete': 'Удалить',

  'format.bold': 'Полужирный (Cmd+B)',
  'format.italic': 'Курсив (Cmd+I)',
  'format.underline': 'Подчёркнутый (Cmd+U)',
  'format.color': 'Цвет текста',
  'format.alignLeft': 'По левому краю',
  'format.alignCenter': 'По центру',
  'format.alignRight': 'По правому краю',
  'format.fontFamily': 'Шрифт',
  'format.fontSize': 'Размер',
  'format.placeholder': 'Выделите текст, чтобы форматировать.',

  // status bar
  'status.saved': 'Сохранено {time}',
  'status.unsaved': 'Несохранённые изменения',
  'status.fileUntitled': 'Без названия',
  'inspector.type': 'Тип',
  'inspector.xIn': 'X (дюйм)',
  'inspector.yIn': 'Y (дюйм)',
  'inspector.wIn': 'Ш (дюйм)',
  'inspector.hIn': 'В (дюйм)',
  'inspector.rotation': 'Поворот (°)',
  'inspector.fill': 'Заливка',
  'inspector.stroke': 'Обводка',
  'inspector.delete': 'Удалить фигуру',

  // status bar
  'status.slideOf': 'Слайд {n} / {total}',
  'status.zoom': 'Масштаб',

  // text toolbar
  'toolbar.fontFamily': 'Шрифт',
  'toolbar.fontSize': 'Размер',
  'toolbar.bold': 'Полужирный',
  'toolbar.italic': 'Курсив',
  'toolbar.color': 'Цвет текста',
  'toolbar.alignLeft': 'По левому краю',
  'toolbar.alignCenter': 'По центру',
  'toolbar.alignRight': 'По правому краю',

  // recovery
  'recovery.title': 'Восстановить несохранённые изменения?',
  'recovery.body':
    'Slidify нашёл {n} сессию(и) с некорректным завершением. Восстановите, чтобы продолжить, или отбросьте данные.',
  'recovery.restore': 'Восстановить',
  'recovery.discard': 'Отбросить',
  'recovery.ops': 'операций: {n}',

  // data preview
  'data.unavailable': 'Набор данных недоступен.',
  'data.column': 'Колонка',
  'data.count': 'Кол-во',
  'data.sum': 'Сумма',
  'data.avg': 'Среднее',
  'data.noNumeric': 'Нет числовых колонок для сводки.',

  // player
  'player.next': 'Далее',
  'player.elapsed': 'Время',
  'player.noNotes': 'Заметок нет.',
  'player.notes': 'Заметки',
  'player.exitHint': 'Esc — выйти',
};

const dictionaries: Record<Locale, Strings> = { ru, en };

interface I18nStore {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18nStore = createStore<I18nStore>((set) => ({
  locale: 'ru',
  setLocale: (l) => set({ locale: l }),
}));

export function translate(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>,
): string {
  const raw = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

/** React hook returning a translator bound to the current locale. */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const locale = useI18nStore((s) => s.locale);
  return (key, vars) => translate(key, locale, vars);
}
