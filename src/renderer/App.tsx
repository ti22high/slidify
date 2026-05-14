import { EditorLayout } from './features/editor/EditorLayout';
import { PlayerView } from './features/presentation/PlayerView';
import { useUiStore } from './store/uiStore';

export function App(): JSX.Element {
  const presenting = useUiStore((s) => s.presenting);
  const stop = useUiStore((s) => s.stopPresenting);
  if (presenting) {
    return <PlayerView onExit={stop} presenter={presenting.mode === 'presenter'} />;
  }
  return <EditorLayout />;
}
