"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function ExampleComponents() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [value, setValue] = useState(50);

  return (
    <section id="example-components" className="example-components" aria-label="Example components">
      <div>
        <h2>Buttons</h2>
        <div className="example-buttons">
          <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
          <Button variant="outline" onClick={() => setCount(0)}>Clear count</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
      <div>
        <label htmlFor="example-input">Text input</label>
        <Input id="example-input" value={text} onChange={event => setText(event.target.value)} placeholder="Enter text" />
        <output htmlFor="example-input">{text || "No text entered"}</output>
      </div>
      <div>
        <h2>Slider</h2>
        <Slider value={value} onValueChange={setValue} />
        <output>Value: {value}</output>
      </div>
    </section>
  );
}
