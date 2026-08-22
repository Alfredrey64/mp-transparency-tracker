:root {
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

body {
  /* Vite's default template centers content here — that's the bug.
     We remove that so the app fills the full width of the window. */
  display: block;
}
