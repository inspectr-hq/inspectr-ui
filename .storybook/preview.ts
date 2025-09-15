import type { Preview } from "@storybook/react";
import "../src/styles/global.css";
// Ensure Monaco loader is configured for stories before any Editor mounts
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
loader.config({ monaco });

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
