import React, { useState } from 'react';
import { M3Button, M3Chip, M3TextField } from '../../components/material/core';
import './medassist.css';

type Language = 'en' | 'te';
type Message = { id: number; role: 'patient' | 'assistant'; text: string };

const copy = {
  en: {
    badge: 'Fictional design preview',
    title: 'A space to talk things through',
    intro: 'MedAssist is being designed to help organise a health question and prepare for a conversation with a professional.',
    notice: 'Design preview only. No AI is connected, and this screen does not assess symptoms or provide medical guidance. Use fictional examples only.',
    welcome: 'Tell me what you would like help organising. I can help shape your notes for a conversation with a qualified professional.',
    placeholder: 'Write a fictional example…',
    send: 'Add to preview',
    composerHelp: 'Your message stays in this page session and is not sent to a model or professional.',
    language: 'Language',
    english: 'English',
    telugu: 'తెలుగు',
    response: 'This preview does not interpret messages. The AI conversation, care guidance, and clinical review are not connected yet. Your example was not saved or sent.',
    reportTitle: 'Report a medicine experience',
    reportText: 'You can go directly to ADR reporting at any time. MedAssist is optional.',
    openAdr: 'Open ADR preview',
    empty: 'Start with a fictional example, or go directly to the medicine report preview.',
  },
  te: {
    badge: 'కల్పిత రూపకల్పన ప్రివ్యూ',
    title: 'మీ మాటలను సులభంగా చెప్పండి',
    intro: 'ఆరోగ్య ప్రశ్నలను క్రమబద్ధీకరించి, నిపుణుడితో మాట్లాడేందుకు సిద్ధం కావడానికి MedAssist రూపొందుతోంది.',
    notice: 'ఇది రూపకల్పన ప్రివ్యూ మాత్రమే. AI అనుసంధానం లేదు; లక్షణాల అంచనా లేదా వైద్య సలహా ఇవ్వదు. కల్పిత ఉదాహరణలనే ఉపయోగించండి.',
    welcome: 'మీరు క్రమబద్ధీకరించాలనుకునే విషయాన్ని చెప్పండి. అర్హత కలిగిన నిపుణుడితో మాట్లాడేందుకు మీ గమనికలను సర్దుబాటు చేయడంలో సహాయపడగలను.',
    placeholder: 'కల్పిత ఉదాహరణను రాయండి…',
    send: 'ప్రివ్యూలో చేర్చు',
    composerHelp: 'మీ సందేశం ఈ పేజీ సెషన్‌లోనే ఉంటుంది; మోడల్‌కు లేదా నిపుణుడికి పంపబడదు.',
    language: 'భాష',
    english: 'English',
    telugu: 'తెలుగు',
    response: 'ఈ ప్రివ్యూ సందేశాలను విశ్లేషించదు. AI సంభాషణ, సంరక్షణ మార్గదర్శకం, వైద్య సమీక్ష ఇంకా అనుసంధానం కాలేదు. మీ ఉదాహరణ సేవ్ చేయబడలేదు లేదా పంపబడలేదు.',
    reportTitle: 'మందు అనుభవాన్ని నివేదించండి',
    reportText: 'మీరు ఎప్పుడైనా నేరుగా ADR నివేదికకు వెళ్లవచ్చు. MedAssist తప్పనిసరి కాదు.',
    openAdr: 'ADR ప్రివ్యూ తెరువు',
    empty: 'కల్పిత ఉదాహరణతో ప్రారంభించండి లేదా నేరుగా మందు నివేదిక ప్రివ్యూకు వెళ్లండి.',
  },
} as const;

export function MedAssistPreview({ onOpenAdr }: { onOpenAdr: () => void }) {
  const [language, setLanguage] = useState<Language>('en');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const t = copy[language];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const id = Date.now();
    setMessages((current) => [
      ...current,
      { id, role: 'patient', text },
      { id: id + 1, role: 'assistant', text: t.response },
    ]);
    setDraft('');
  };

  return <section className="medassist-preview" aria-labelledby="medassist-title">
    <div className="medassist-preview-topline">
      <div className="medassist-language" role="group" aria-label={t.language}>
        <span>{t.language}</span>
        <M3Chip type="filter" label={t.english} selected={language === 'en'} onClick={() => setLanguage('en')} />
        <M3Chip type="filter" label={t.telugu} selected={language === 'te'} onClick={() => setLanguage('te')} />
      </div>
    </div>

    <header className="medassist-heading">
      <span className="medassist-preview-badge">{t.badge}</span>
      <p className="access-eyebrow">MedAssist AI</p>
      <h1 id="medassist-title" tabIndex={-1}>{t.title}</h1>
      <p>{t.intro}</p>
    </header>

    <div className="medassist-preview-notice" role="note">
      <span className="material-symbols-outlined" aria-hidden="true">info</span>
      <p>{t.notice}</p>
    </div>

    <div className="medassist-conversation" aria-label={language === 'en' ? 'Conversation preview' : 'సంభాషణ ప్రివ్యూ'}>
      <div className="medassist-message medassist-message-assistant">
        <span className="material-symbols-outlined" aria-hidden="true">health_and_safety</span>
        <p>{t.welcome}</p>
      </div>
      {messages.map((message) => <div key={message.id} className={`medassist-message medassist-message-${message.role}`}>
        {message.role === 'assistant' && <span className="material-symbols-outlined" aria-hidden="true">info</span>}
        <p>{message.text}</p>
      </div>)}
      {messages.length === 0 && <p className="medassist-empty-hint">{t.empty}</p>}
    </div>

    <form className="medassist-composer" onSubmit={submit}>
      <M3TextField id="medassist-message" label={language === 'en' ? 'Your fictional example' : 'మీ కల్పిత ఉదాహరణ'}
        type="textarea" rows={4} value={draft} maxLength={1200} onChange={(event) => setDraft(event.target.value)} />
      <div className="medassist-composer-footer">
        <span>{t.composerHelp}</span>
        <M3Button type="submit" variant="filled" leadingIcon="send" disabled={!draft.trim()}>{t.send}</M3Button>
      </div>
    </form>

    <aside className="medassist-adr-link">
      <div>
        <h2>{t.reportTitle}</h2>
        <p>{t.reportText}</p>
      </div>
      <M3Button variant="outlined" trailingIcon="arrow_forward" onClick={onOpenAdr}>{t.openAdr}</M3Button>
    </aside>
  </section>;
}
