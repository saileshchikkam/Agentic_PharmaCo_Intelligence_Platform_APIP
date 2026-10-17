import React, { useEffect, useState } from 'react';
import './design-system/material-web-imports';
import { DeveloperReference } from './DeveloperReference';
import { applyAppearance, loadAppearance } from './design-system/appearance';
import { AccessPreview, readPreviewRoute } from './features/access/AccessPreview';

export function App() {
  const [appearance, setAppearance] = useState(loadAppearance);
  const [preferencesSaved, setPreferencesSaved] = useState(true);
  const [route, setRoute] = useState(readPreviewRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readPreviewRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { setPreferencesSaved(applyAppearance(appearance)); }, [appearance]);
  useEffect(() => {
    document.title = route.screen === 'developer-reference'
      ? 'APIP — Developer design reference'
      : route.screen === 'sign-in' ? 'Sign in — APIP'
      : route.screen === 'adr-preview' ? 'Fictional ADR intake preview — APIP'
          : route.screen === 'medassist-preview' ? 'MedAssist design preview — APIP'
            : route.screen === 'patient-home' ? 'Patient home preview — APIP' : 'APIP — Agentic Pharma Co-intelligence Platform';
  }, [route]);

  return route.screen === 'developer-reference'
    ? <DeveloperReference appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
    : <AccessPreview route={route} appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />;
}

export default App;
