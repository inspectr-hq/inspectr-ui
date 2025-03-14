# Inspectr UI

React UI components for [Inspectr](https://github.com/inspectr-hq/inspectr#readme).

<img src="https://raw.githubusercontent.com/inspectr-hq/inspectr/main/assets/inspectr-app.png" alt="Request Inspectr" width="80%">

## Introduction

**Inspectr UI** is a collection of React UI components built for the [Inspectr](https://github.com/inspectr-hq/inspectr#readme) project. It leverages modern tools like Vite and TailwindCSS to provide a fast, customizable, and modular UI library for your React applications.

## Installation

<a href="https://www.npmjs.com/package/@inspectr/ui" alt="Latest Stable Version">![npm](https://img.shields.io/npm/v/@inspectr/ui.svg)</a>
<a href="https://www.npmjs.com/package/@inspectr/ui" alt="Total Downloads">![npm](https://img.shields.io/npm/dw/@inspectr/ui.svg)</a>

Install the package via npm:

```
npm install @inspectr/ui
```

## Usage

Import the components and accompanying CSS into your React project:

```jsx
import React from 'react';
import { InspectrApp } from '@inspectr/ui';
import '@inspectr/ui/style.css';

const App = () => (
  <div>
    <InspectrApp />
  </div>
);

export default App;
```

## Storybook

Explore and test components in isolation with Storybook.

- Start Storybook locally:

```bash
npm run storybook
```

- Build a static Storybook site:

```
npm run build-storybook
```

## Contributing

Contributions are welcome! If you have ideas, improvements, or bug fixes, please open an issue or submit a pull request via the [GitHub repository](https://github.com/inspectr-hq/inspectr-ui).

## Bugs & Issues

Found a bug or have a feature request? Please report it via the [issue tracker](https://github.com/inspectr-hq/inspectr-ui/issues).
