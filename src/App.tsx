import { useState } from 'react';
import type { Draft, Entry, Grid } from './types';
import Home from './screens/Home';
import NewCode from './screens/NewCode';
import Trainer from './screens/Trainer';
import Done from './screens/Done';
import Recover from './screens/Recover';
import { saveEntry } from './lib/storage';

type Screen = 'home' | 'new' | 'trainer' | 'done' | 'recover';

interface DoneData {
  entry: Entry;
  shareTexts: string[] | null;
  gridData: Grid | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [homeKey, setHomeKey] = useState(0); // bump to force Home to reload its list from storage
  const [draft, setDraft] = useState<Draft | null>(null);
  const [doneData, setDoneData] = useState<DoneData | null>(null);
  const [recoverLabel, setRecoverLabel] = useState<string | null>(null);

  function goHome() {
    setScreen('home');
    setHomeKey(k => k + 1);
  }

  function handleBegin(newDraft: Draft) {
    setDraft(newDraft);
    setScreen('trainer');
  }

  async function handleTrainerFinish(entry: Entry, shareTexts: string[] | null, gridData: Grid | null) {
    await saveEntry(entry.label, entry);
    setDoneData({ entry, shareTexts, gridData });
    setScreen('done');
  }

  function handleRecover(label: string) {
    setRecoverLabel(label);
    setScreen('recover');
  }

  return (
    <div className="wrap">
      <div className="brand">
        <h1>Blindfold</h1>
        <span className="tagline">codes you type but never quite know</span>
      </div>
      <div className="top-rule"></div>

      {screen === 'home' && <Home key={homeKey} onNew={() => setScreen('new')} onRecover={handleRecover} />}
      {screen === 'new' && <NewCode onBack={goHome} onBegin={handleBegin} />}
      {screen === 'trainer' && draft && <Trainer draft={draft} onFinish={handleTrainerFinish} />}
      {screen === 'done' && doneData && (
        <Done entry={doneData.entry} shareTexts={doneData.shareTexts} gridData={doneData.gridData} onDone={goHome} />
      )}
      {screen === 'recover' && recoverLabel && <Recover label={recoverLabel} onBack={goHome} />}
    </div>
  );
}
