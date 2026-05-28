# React + Vite (GitBurn Frontend) + FastAPI Backend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules, serving as the interface for **GitBurn — The Ultimate GitHub Roaster**.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

---

## 🛠️ Core Tech Stack

| Layer | Technology | Utility |
| :--- | :--- | :--- |
| **Backend** | FastAPI | High-performance, async-first Python API routing framework |
| | HTTPX | Asynchronous HTTP client for fast GitHub data harvesting |
| | OpenRouter AI | Dynamic LLM integration wrapper managing the prompt layer (`gpt-4o-mini`) |
| **Frontend** | React + Vite | Fast HMR runtime engine and component structural architecture |
| | Tailwind CSS | Utility-first responsive theme configuration styling |
| | Framer Motion | Advanced programmatic layout changes and micro-interaction animations |
| | HTML-to-Image | Client-side visual asset conversion tool for `.png` generation |

---

## 🏗️ How It Works

GitBurn operates by securely aggregating a target user's public GitHub footprint, evaluating project metrics, and pipelining those data structures into an LLM via OpenRouter to generate a personalized, sarcastic developer code review.

### High-Level Data Flow

```
[ Frontend: React/Vite ] ---> (POST /api/roast) ---> [ Backend: FastAPI ]
          ^                                                   |
          |                                                   v
 [ Renders Roast Card ] <--- [ Return JSON Response ] <--- [ OpenRouter AI ] + [ GitHub API ]
```

### 🎛️ Backend Orchestration (FastAPI)

The backend handles asynchronous orchestration, public data aggregation, rate-limit preservation, and AI generation wrapper tasks:

* **Data Aggregation (`fetch_github_data`)**: 
  Queries the GitHub REST API securely using a token to bypass strict public rate limits. It captures root profile objects (followers, following, public bio, creation milestones) and tracks up to 100 public repositories to extract programming language splits and aggregate star metrics.
* **Asynchronous Concurrency (`asyncio.gather`)**: 
  Identifies the **top 5 most recently active repositories** based on push timestamps. It then fires concurrent asynchronous HTTP requests using `httpx` to extract the 5 latest commit messages and raw `README.md` snippets (trimmed to 250 characters to optimize context windows) for each active repo.
* **AI Roast Pipeline (`generate_openai_roast`)**: 
  Compiles raw user metrics into a prompt string. It forwards the payload to the **OpenRouter API** invoking the `openai/gpt-4o-mini` model under a tailored "Cynical Senior Full-Stack Developer" system persona.
* **Persistence & Keep-Alive**: 
  Maintains structural data records using SQLAlchemy and exposes a lightweight `/ping` endpoint to prevent free-tier hosting environments (like Render) from falling asleep.

### 🎨 Frontend Interface (React + Vite)

The frontend is optimized for low-latency feedback loops, interactive graphical micro-interactions, and visual scannability:

* **Interactive State Engine**: The UI cycles dynamically between three explicit lifestyle states:
  * `idle`: Accepting GitHub handle registrations.
  * `analyzing`: A custom terminal emulator mimicking mock system diagnostic sequences (`[INIT]`, `[FETCH]`, `[SCAN]`, `[AI]`) synchronized alongside real-time connection events.
  * `result`: Splits the viewport into an interactive metric sidebar and a real-time output panel.
* **Visual Animations**: 
  * **Framer Motion Integration**: Drives page transition physics, real-time action layout expansions, and floating ambient radial glows.
  * **Typewriter Rendering Loop**: Progressively renders the markdown text array returned by the model using granular animation delay parameters to sustain reading tension.
  * **CSS Glitch Text**: Employs infinite layered element translation ranges over heading titles to mimic a volatile command-line layout.
* **Export Mechanics**: 
  * **Canvas Snapshotting (`html-to-image`)**: Converts the active DOM node layout representing the final damage report directly into a clean, high-resolution `.png` asset entirely client-side.
  * **Social Link Integration**: Dynamically encodes preset payload templates matching text parameters to simplify instantaneous sharing on platform networks like X (formerly Twitter).
