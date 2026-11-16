/**
 * Code blocks in article bodies: light syntax colouring (a pure string pass
 * that runs the same on the server and the client) and copy buttons (added to
 * the live DOM after render). The posts hold shell sessions, config files,
 * SQL, PHP, Python, and pseudocode with no language tags, so the colouring is
 * a small language-neutral scanner rather than a full grammar.
 */
import { escapeHtml } from '../../shared/htmlEscape'
import { decodeHtmlEntities as decodeEntities } from '../../shared/htmlEscape'

export const COPY_LABEL = 'Copy'
export const COPIED_LABEL = 'Copied'
export const COPY_FAILED_LABEL = 'Copy failed'
/** How long the button shows its result before going back to "Copy". */
export const COPY_FEEDBACK_MS = 2000

const KEYWORDS = [
  'def', 'return', 'for', 'while', 'if', 'elif', 'else', 'in', 'import', 'from', 'as', 'class',
  'function', 'var', 'let', 'const', 'new', 'and', 'or', 'not', 'try', 'except', 'with', 'lambda',
  'True', 'False', 'None', 'true', 'false', 'null', 'define', 'echo', 'pass', 'break', 'continue',
]
const SQL_KEYWORDS = [
  'CREATE', 'DATABASE', 'DEFAULT', 'CHARACTER', 'SET', 'COLLATE', 'GRANT', 'ALL', 'ON', 'TO',
  'IDENTIFIED', 'BY', 'FLUSH', 'PRIVILEGES', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'DELETE', 'DROP', 'TABLE', 'USE', 'EXIT',
]

/** Leading prompts of an interactive session line; never part of what a reader types. */
const PROMPT_RE = /^(?:\$|mysql>|>>>) /

/**
 * One alternation, scanned left to right; the earliest match wins, so a `#`
 * inside a string stays part of the string. Group order sets the token class.
 */
const TOKEN_RE = new RegExp(
  [
    String.raw`(\/\*[\s\S]*?\*\/)`, // 1 block comment
    String.raw`((?<=^|[ \t])(?:#|\/\/)[^\n]*)`, // 2 line comment
    String.raw`("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')`, // 3 string
    String.raw`(^(?:\$|mysql>|>>>)(?= ))`, // 4 prompt
    String.raw`((?<=^\$ )(?:sudo[ \t]+)?[A-Za-z0-9_./-]+)`, // 5 shell command
    String.raw`(\b(?:${KEYWORDS.join('|')}|${SQL_KEYWORDS.join('|')})\b)`, // 6 keyword
    String.raw`(\b\d+(?:\.\d+)?\b)`, // 7 number
  ].join('|'),
  'gm',
)
const TOKEN_CLASSES = ['comment', 'comment', 'string', 'prompt', 'command', 'keyword', 'number'] as const

/** Colours one code block's plain text; returns escaped HTML. */
export function highlightCode(text: string): string {
  let out = ''
  let last = 0
  for (const match of text.matchAll(TOKEN_RE)) {
    const group = match.findIndex((g, i) => i > 0 && g !== undefined)
    const index = match.index
    out += escapeHtml(text.slice(last, index))
    out += `<span class="tok tok-${TOKEN_CLASSES[group - 1]}">${escapeHtml(match[0])}</span>`
    last = index + match[0].length
  }
  return out + escapeHtml(text.slice(last))
}

/**
 * Colours every `<pre><code>` block of sanitized HTML whose content is plain
 * text. Blocks that already hold markup are left as written.
 */
export function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code>([^<]*)<\/code><\/pre>/g,
    (_match, inner: string) => `<pre><code>${highlightCode(decodeEntities(inner))}</code></pre>`,
  )
}

/**
 * The text a copy button puts on the clipboard. In a shell or SQL session the
 * reader wants the commands, not the prompts or the output, so when any line
 * starts with a prompt only those lines are copied, without the prompt.
 */
export function codeCopyText(text: string): string {
  const lines = text.replace(/\n+$/, '').split('\n')
  if (!lines.some((line) => PROMPT_RE.test(line))) return lines.join('\n')
  return lines
    .filter((line) => PROMPT_RE.test(line))
    .map((line) => line.replace(PROMPT_RE, ''))
    .join('\n')
}

async function writeClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
  await navigator.clipboard.writeText(text)
}

/** Adds a copy button to each code block inside `root`; returns a cleanup function. */
export function addCodeCopyButtons(root: ParentNode): () => void {
  const blocks = Array.from(root.querySelectorAll<HTMLPreElement>('pre')).filter(
    (pre) => !pre.parentElement?.classList.contains('code-block'),
  )
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const wrappers: { wrapper: HTMLDivElement; pre: HTMLPreElement }[] = []

  for (const pre of blocks) {
    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'code-block__copy'
    button.textContent = COPY_LABEL
    button.setAttribute('aria-label', 'Copy code to clipboard')
    button.addEventListener('click', () => {
      const show = (label: string) => {
        button.textContent = label
        const timer = setTimeout(() => {
          timers.delete(timer)
          button.textContent = COPY_LABEL
        }, COPY_FEEDBACK_MS)
        timers.add(timer)
      }
      writeClipboard(codeCopyText(pre.textContent ?? '')).then(
        () => show(COPIED_LABEL),
        (error: unknown) => {
          console.error('Could not copy the code block', error)
          show(COPY_FAILED_LABEL)
        },
      )
    })
    pre.replaceWith(wrapper)
    wrapper.append(button, pre)
    wrappers.push({ wrapper, pre })
  }

  return () => {
    for (const timer of timers) clearTimeout(timer)
    for (const { wrapper, pre } of wrappers) wrapper.replaceWith(pre)
  }
}
