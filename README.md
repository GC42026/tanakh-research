# Tanakh Research

[Read the public research journal](https://gc42026.github.io/tanakh-research/).

The journal follows questions in Tanakh, Zohar, and Kabbalah through close readings, Jewish commentary, textual history, and comparative study. The first collection starts with the whole soul in each person and the Exodus as a journey of the many that can be undergone by the individual.

New work appears here as dated, source-linked studies. Each entry identifies what the text says, how a named source reads it, and what the project is still investigating.

The site is published from `main:/docs` through GitHub Pages. To preview it locally:

```sh
python3 -m http.server --bind 127.0.0.1 --directory docs
```

Open <http://localhost:8000/>.

For a new study, use an existing page in `docs/research/` as a starting point. Its shared stylesheet and `entry-heading` and `related` elements carry over the illustrated heading and reading layout.

The atlas lives in `docs/atlas/`. After adding a journal study, add its **Explore this study in the atlas** link with `../atlas/?study=<filename-without-.html>`, then run `python3 scripts/build-atlas-journal.py`. The index takes each study’s title, summary, citations, and related reading from its HTML.

For recorded material, add an entry to `mediaByNode` in `docs/atlas/data.js` using an atlas node ID, journal slug, or canonical Sefaria reference. An entry can contain a `preview` video URL and a `layers` list of objects with `kind` (`audio` or `video`), `title`, `src`, and optional `captions` (WebVTT) and `lang`. Hover previews play muted. The selected node exposes the full media through playback controls.
