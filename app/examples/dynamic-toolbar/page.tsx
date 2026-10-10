import "./example.css";
import type { Metadata } from "next";
import { Toolbar } from "@/components/toolbar";
import { ExampleComponents } from "./example-components";

export const metadata: Metadata = {
  title: "Dynamic Island example",
  robots: { index: false, follow: false },
};

export default function ToolbarExample() {
  return (
    <>
      <Toolbar />
      <main data-example className="toolbar-example">
        <h1>Toolbar example</h1>
        <ul className="example-text">
          <li>Heading text</li>
          <li>Body text with <strong>bold</strong> and <em>italic</em> styles.</li>
          <li>0123456789</li>
          <li><a href="#example-components">Link text</a></li>
        </ul>
        <ExampleComponents />
      </main>
    </>
  );
}
