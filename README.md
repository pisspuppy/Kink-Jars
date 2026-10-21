# Kink Jars

A local, single-page recreation of the [Kink Jars website](https://lockedtony.github.io/kink-jars/) with editable jar names. The 28 labels can each be changed to anything up to 40 characters. Name, color, opacity, labels, and fill levels stay in your browser's local storage. Choose a preset or use the color field, hue control, and opacity control to customize the jars.

Each jar has a visible **0** for empty, levels **1–5**, and a **★** favorite level that lifts the lid and pours liquid down the side in the preview and PNG. Use the up and down arrows beside each jar number to reorder it; its fill level moves with it.

Use **Clear jars and descriptions** to empty every jar and blank all 28 descriptions. Your name and color stay in place.

Open `index.html` directly in a browser, or run a local server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Use **Save my jars** to download a PNG. No build step or dependencies are needed. The optional Google Fonts request affects typography only; the page works offline with fallback fonts.

Use **Save setup** to download a shareable `kink-jars-setup.json` file containing only the 28 descriptions. Another person can use **Load setup** to import that file. Loading replaces the descriptions and empties all jars; it keeps that person's own name and color.
