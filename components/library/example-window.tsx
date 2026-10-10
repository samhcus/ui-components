"use client";

import { useState } from "react";
import { RotateCcw, Monitor, Smartphone } from "lucide-react";

export function ExampleWindow() {
  const [revision, setRevision] = useState(0);
  const [narrow, setNarrow] = useState(false);
  return <div className="example-window">
    <div className="example-chrome">
      <span className="example-address"><span aria-hidden>● ● ●</span> example / dynamic island</span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={narrow ? "Use wide example" : "Use phone example"} aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>{narrow ? <Smartphone size={15} /> : <Monitor size={15} />}</button>
        <button type="button" onClick={() => { setRevision(revision + 1); }} aria-label="Restart example"><RotateCcw size={14} /><span>Restart</span></button>
      </div>
    </div>
    <div className="example-viewport">
      <iframe key={revision} title="Dynamic Island Toolbar interactive example" src="/examples/dynamic-toolbar" sandbox="allow-scripts allow-downloads" className={narrow ? "example-frame example-phone" : "example-frame"} />
    </div>
    <p className="example-caption" role="status">Changes stay inside this window.</p>
  </div>;
}
