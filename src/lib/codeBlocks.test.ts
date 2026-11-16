// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addCodeCopyButtons,
  codeCopyText,
  COPIED_LABEL,
  COPY_FAILED_LABEL,
  COPY_FEEDBACK_MS,
  COPY_LABEL,
  highlightCode,
  highlightCodeBlocks,
} from './codeBlocks'

const tok = (kind: string, text: string) => `<span class="tok tok-${kind}">${text}</span>`

describe('highlightCode', () => {
  it('marks prompts, commands, comments, strings, keywords, and numbers', () => {
    expect(highlightCode('$ sudo systemctl restart bind9')).toBe(
      `${tok('prompt', '$')} ${tok('command', 'sudo systemctl')} restart bind9`,
    )
    expect(highlightCode('x = 1  # set x')).toBe(`x = ${tok('number', '1')}  ${tok('comment', '# set x')}`)
    expect(highlightCode("define('DB_NAME', 'wordpress');")).toBe(
      `${tok('keyword', 'define')}(${tok('string', "'DB_NAME'")}, ${tok('string', "'wordpress'")});`,
    )
    expect(highlightCode('def f():\n    return None')).toBe(
      `${tok('keyword', 'def')} f():\n    ${tok('keyword', 'return')} ${tok('keyword', 'None')}`,
    )
  })

  it('keeps a # inside a string and a URL with // as plain text', () => {
    expect(highlightCode('echo "#not a comment" http://x.org')).toBe(
      `${tok('keyword', 'echo')} ${tok('string', '"#not a comment"')} http://x.org`,
    )
  })

  it('treats block comments as one token across lines', () => {
    expect(highlightCode('/** MySQL\n user */')).toBe(tok('comment', '/** MySQL\n user */'))
  })

  it('escapes markup characters in code', () => {
    expect(highlightCode('mysql> SELECT a<b & c;')).toBe(
      `${tok('prompt', 'mysql&gt;')} ${tok('keyword', 'SELECT')} a&lt;b &amp; c;`,
    )
  })
})

describe('highlightCodeBlocks', () => {
  it('decodes, colours, and re-escapes plain code blocks only', () => {
    const html = '<p>a 1</p><pre><code>x &lt; 2</code></pre><pre><code><strong>kept</strong></code></pre>'
    expect(highlightCodeBlocks(html)).toBe(
      `<p>a 1</p><pre><code>x &lt; ${tok('number', '2')}</code></pre><pre><code><strong>kept</strong></code></pre>`,
    )
  })
})

describe('codeCopyText', () => {
  it('copies only the commands of a session, without prompts or output', () => {
    expect(codeCopyText('$ ssh-keygen\nGenerating key...\n$ ls -la\n')).toBe('ssh-keygen\nls -la')
    expect(codeCopyText('mysql> FLUSH PRIVILEGES;')).toBe('FLUSH PRIVILEGES;')
  })

  it('copies files and code as written', () => {
    expect(codeCopyText('# comment\nKEY=value\n\n')).toBe('# comment\nKEY=value')
  })
})

describe('addCodeCopyButtons', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  function setup() {
    document.body.innerHTML = '<div id="r"><pre><code>$ ls\nout</code></pre></div>'
    const root = document.getElementById('r')!
    const cleanup = addCodeCopyButtons(root)
    const button = root.querySelector<HTMLButtonElement>('.code-block__copy')!
    return { root, cleanup, button }
  }

  it('wraps each block once, copies its commands, and shows feedback', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { root, cleanup, button } = setup()
    expect(root.querySelectorAll('.code-block > pre')).toHaveLength(1)
    const again = addCodeCopyButtons(root)
    expect(root.querySelectorAll('.code-block__copy')).toHaveLength(1)

    button.click()
    await vi.waitFor(() => expect(button.textContent).toBe(COPIED_LABEL))
    expect(writeText).toHaveBeenCalledWith('ls')
    vi.advanceTimersByTime(COPY_FEEDBACK_MS)
    expect(button.textContent).toBe(COPY_LABEL)

    again()
    cleanup()
    expect(root.innerHTML).toBe('<pre><code>$ ls\nout</code></pre>')
  })

  it('reports a failed copy instead of failing silently', async () => {
    vi.stubGlobal('navigator', {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { cleanup, button } = setup()
    button.click()
    await vi.waitFor(() => expect(button.textContent).toBe(COPY_FAILED_LABEL))
    expect(error).toHaveBeenCalledWith('Could not copy the code block', expect.any(Error))
    error.mockRestore()
    cleanup()
  })
})
