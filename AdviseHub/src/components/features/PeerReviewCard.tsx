import { Card } from '../ui/card';
import ReactMarkdown from 'react-markdown';

export function PeerReviewCard({ content }: { content: string }) {
  const markdownStyles = "text-sm text-on-surface-variant/90 leading-relaxed [&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-2 [&>strong]:text-white";

  return (
    <div className="self-start w-full max-w-3xl my-4">
      <Card className="bg-surface-container-low/80 backdrop-blur-xl border-dashed border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-secondary">rate_review</span>
          <h3 className="text-lg font-bold text-white uppercase tracking-widest">Anonimowy Peer Review</h3>
        </div>
        <div className={markdownStyles}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}
