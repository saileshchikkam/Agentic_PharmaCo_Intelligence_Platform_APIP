import { AccountProvider } from './features/account/AccountProvider';
import React, { useEffect, useState } from 'react';
import './design-system/material-web-imports';
import { DeveloperReference } from './DeveloperReference';
import { applyAppearance, loadAppearance } from './design-system/appearance';
import { AccessPreview, readPreviewRoute } from './features/access/AccessPreview';
const ModelAResearch = import.meta.env.DEV ? React.lazy(() => import('./features/model-a-research/ModelAResearch')) : null;

export function App() {
  const [appearance, setAppearance] = useState(loadAppearance);
  const [preferencesSaved, setPreferencesSaved] = useState(true);
  const [route, setRoute] = useState(readPreviewRoute);

  useEffect(() => {
    let previous={url:window.location.href,state:window.history.state};
    let restoring=false;
    const onHashChange = (event:HashChangeEvent) => {
      if(restoring){restoring=false;return;}
      // Programmatic navigation already asks before leaving. Native browser Back/Forward does not.
      if(event.isTrusted&&!window.dispatchEvent(new Event('apip:before-navigate',{cancelable:true}))){
        const delta=(previous.state?.apipDepth??0)-(window.history.state?.apipDepth??0);
        if(delta){restoring=true;window.history.go(delta);}
        else window.history.replaceState(previous.state,'',previous.url);
        return;
      }
      previous={url:window.location.href,state:window.history.state};
      setRoute(readPreviewRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { setPreferencesSaved(applyAppearance(appearance)); }, [appearance]);
  useEffect(() => {
    document.title = import.meta.env.DEV && window.location.hash === '#/research/model-a' ? 'Fictional MedAssist question lab — APIP' : route.screen === 'developer-reference'
      ? 'APIP — Developer design reference'
      : route.screen === 'profile' ? 'Your profile — APIP' : route.screen === 'sign-in' ? 'Sign in — APIP'
      : route.screen === 'adr-cases' ? 'My ADR Reports — APIP' : route.screen === 'adr-preview' ? 'Fictional ADR intake preview — APIP'
          : route.screen === 'medassist-conversation' ? 'Fictional MedAssist conversation — APIP'
          : route.screen === 'medassist-preview' ? 'MedAssist design preview — APIP'
            : route.screen === 'patient-home' ? 'Patient home preview — APIP' : 'APIP — Agentic Pharma Co-intelligence Platform';
  }, [route]);

  if (ModelAResearch && window.location.hash === '#/research/model-a') {
    return <React.Suspense fallback={<p role="status">Loading local research screen…</p>}><ModelAResearch /></React.Suspense>;
  }
  return <AccountProvider>{route.screen === 'developer-reference'
    ? <DeveloperReference appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />
    : <AccessPreview route={route} appearance={appearance} setAppearance={setAppearance} preferencesSaved={preferencesSaved} />}</AccountProvider>;
}

export default App;
