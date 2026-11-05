import { useEffect, useRef, useState } from 'react';
import { M3Button } from '../../../components/material/core';
import type { GuidedCase } from './domain';

const errors: Record<string, string> = {
  PDF_TEMPLATE_MISSING: 'The original PvPI template is missing from this checkout.',
  REVISION_CONFLICT: 'This draft changed in another tab. Reopen the saved draft to preview its latest revision.',
  PDF_SELECT_ONE_SERIOUSNESS: 'Choose one seriousness category to preview the official form.',
  PDF_UNSUPPORTED_SCRIPT: 'The form font cannot display some saved characters. Your answers are preserved.',
  PDF_RUNTIME_DEPENDENCIES_MISSING: 'The configured Python environment is missing the pinned PDF packages. Install server/adr/requirements-pdf.txt and set APIP_PDF_PYTHON to that interpreter, then retry.',
  PDF_BUSY: 'The PDF service is busy. Try again.',
};

export function LiveFormPreview({ c, owner }: { c: GuidedCase; owner: string }) {
  const [open, setOpen] = useState(false);
  return <aside className="adr-live-form" aria-label="Original PvPI form preview">
    <h2>Original PvPI form</h2>
    <p>Version 1.4 · saved revision {c.revision}. Confirmed details only.</p>
    <div className="adr-preview-toggle">
      <M3Button variant="outlined" onClick={() => setOpen(!open)}>{open ? 'Hide form preview' : 'Show form preview'}</M3Button>
    </div>
    <div className={open ? 'adr-live-body open' : 'adr-live-body'}>
      <RevisionPreview key={JSON.stringify([owner, c.id, c.revision])} id={c.id} revision={c.revision} owner={owner} open={open} />
    </div>
  </aside>;
}

function RevisionPreview({ id, revision, owner, open }: { id: string; revision: number; owner: string; open: boolean }) {
  const [result, setResult] = useState<{ url: string } | { error: string } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const wide = matchMedia('(min-width: 1000px)');
    let dispose = () => {};
    const sync = () => {
      dispose();
      setResult(null);
      if (!wide.matches && !open) return;
      const controller = new AbortController();
      let url = '';
      const timer = window.setTimeout(async () => {
        try {
          const response = await fetch(`/api/account/adr-guided/${id}/pdf`, {
            method: 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json', 'X-APIP-Account': owner },
            body: JSON.stringify({ expectedRevision: revision }),
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
          });
          if (!response.ok) {
            const data = await response.json();
            throw Error(errors[data.error] ?? 'The preview is unavailable. Check the PDF runtime and retry.');
          }
          if (response.headers.get('X-APIP-Revision') !== String(revision)) throw Error(errors.REVISION_CONFLICT);
          const blob = await response.blob();
          if (controller.signal.aborted) return;
          url = URL.createObjectURL(blob);
          setResult({ url });
        } catch (error) {
          if (!controller.signal.aborted) setResult({ error: (error as Error).message });
        }
      }, 350);
      dispose = () => {
        clearTimeout(timer);
        controller.abort();
        if (url) URL.revokeObjectURL(url);
      };
    };
    sync();
    wide.addEventListener('change', sync);
    return () => { wide.removeEventListener('change', sync); dispose(); };
  }, [id, revision, owner, open, retry]);

  if (!result) return <p role="status">Preparing the saved form preview…</p>;
  if ('error' in result) return <><p role="status">{result.error}</p><M3Button variant="text" onClick={() => setRetry(retry + 1)}>Retry preview</M3Button></>;
  return <>
    <a href={result.url} target="_blank" rel="noopener">Open form preview in a separate viewer</a>
    <FormPage url={result.url} />
  </>;
}

function FormPage({ url }: { url: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    let disposed = false;
    let destroy: (() => void) | undefined;
    let cancel: (() => void) | undefined;
    async function draw() {
      try {
        const [pdf, worker] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        if (disposed || !canvas.current) return;
        pdf.GlobalWorkerOptions.workerSrc = worker.default;
        const loading = pdf.getDocument({ url, isEvalSupported: false });
        destroy = () => { void loading.destroy().catch(() => {}); };
        const page = await (await loading.promise).getPage(1);
        if (disposed || !canvas.current) return;
        const viewport = page.getViewport({ scale: 1.5 });
        const target = canvas.current;
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        const render = page.render({ canvas: target, viewport });
        cancel = () => render.cancel();
        await render.promise;
        if (!disposed) setState('ready');
      } catch {
        if (!disposed) setState('failed');
      }
    }
    void draw();
    return () => { disposed = true; cancel?.(); destroy?.(); };
  }, [url]);
  return <>
    {state === 'loading' && <p role="status">Rendering the first page…</p>}
    {state === 'failed' && <p role="status">The page could not be rendered here. Open the full form in a separate viewer.</p>}
    <canvas ref={canvas} hidden={state !== 'ready'} role="img" aria-label="Live preview of the original PvPI form, page 1" />
  </>;
}
