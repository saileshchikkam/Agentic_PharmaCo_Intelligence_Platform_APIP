import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/design-system/material-web-imports';
import { M3TextField, M3Checkbox } from '../src/components/material/core';

/** Isolated development fixture: no account service, real credentials or patient records. */
function Regression() {
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState('');
  const [fixed, setFixed] = useState('');
  const [checked, setChecked] = useState(false);
  return <main><h1>Profile loading regression</h1>
    <button onClick={() => setLoading(value => !value)}>Toggle loading</button>
    <p role="status">{loading ? 'Loading' : 'Ready'}</p>
    <fieldset disabled={loading}><legend>Previous fieldset behavior</legend>
      <M3TextField label="Previous field" value={original} onChange={e => setOriginal(e.target.value)} />
    </fieldset>
    <fieldset aria-disabled={loading}><legend>Explicit control behavior</legend>
      <M3TextField disabled={loading} label="Fixed field" value={fixed} onChange={e => setFixed(e.target.value)} />
      <M3Checkbox disabled={loading} checked={checked} onChange={setChecked} label="Fixed checkbox" />
    </fieldset>
    <output>Entered: {fixed}; checked: {String(checked)}</output>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Regression />);
