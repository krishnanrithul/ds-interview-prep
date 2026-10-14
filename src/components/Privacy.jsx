import { ArrowLeft } from 'lucide-react'
import { FEEDBACK_EMAIL } from '../lib/feedback'

// Plain-language privacy note. Keep it in step with what the code actually sends (see the launch-reviewer agent).
function Block({ title, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground/85">{children}</div>
    </section>
  )
}

const A = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">{children}</a>

export default function Privacy({ onBack }) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold">Privacy</h1>
      <p className="text-muted-foreground">Saddle Point has no accounts and no database. Here is everything that leaves your device, and when.</p>

      <Block title="What stays on your device">
        <p>Your progress, ratings, answers, scores, settings and API key are stored in this browser only. Nobody else can see them, including us. They don't sync to other devices.</p>
        <p>To delete them, use Settings → Clear all data. Clearing your browser's site data does the same.</p>
        <p>Backups you export are files on your device. Your API key is never written into a backup.</p>
      </Block>

      <Block title="When grading is on">
        <p>Grading and the reacting interviewer use Claude, made by Anthropic. They only run when you add an API key or an invite code in Settings.</p>
        <p>Each time, the app sends the question, its key points and reference answer, and what you wrote for it (your answer and follow-up replies, or the Mock conversation). Nothing else, and never your other answers or your progress.</p>
        <p>With your own API key, this goes from your browser straight to Anthropic. With an invite code, it passes through Saddle Point's server on Vercel on its way to Anthropic; the server doesn't store it. Anthropic handles it under its own terms: see <A href="https://www.anthropic.com/legal/privacy">Anthropic's privacy policy</A>.</p>
      </Block>

      <Block title="Other services the app loads from">
        <p><span className="font-medium">Vercel</span> hosts the site. Like any web host, it sees standard request details such as your IP address.</p>
        <p><span className="font-medium">Hugging Face</span> serves the small model that scores your answer as you type. Your browser downloads it once; your answers are scored on your device and never sent there. <A href="https://huggingface.co/privacy">Hugging Face privacy policy</A>.</p>
        <p><span className="font-medium">Google Fonts</span> serves the typefaces, so Google sees your IP address when the page loads. <A href="https://policies.google.com/privacy">Google privacy policy</A>.</p>
        <p>There is no analytics, advertising or tracking.</p>
      </Block>

      <Block title="Feedback">
        <p>Feedback and "Report a problem" links open your own email app with a pre-filled message. Nothing is sent unless you send it, and your answers are never included.</p>
      </Block>

      <p className="text-sm text-muted-foreground pb-4">Questions about privacy: <a href={`mailto:${FEEDBACK_EMAIL}`} className="underline underline-offset-2">{FEEDBACK_EMAIL}</a>. Last updated 14 October 2026.</p>
    </div>
  )
}
