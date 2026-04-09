import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  role: 'user' | 'chairman';
  content: string;
  isFirstUserMsg?: boolean;
}

export function MessageBubble({ role, content, isFirstUserMsg }: MessageBubbleProps) {
  const isUser = role === 'user';

  const markdownStyles = "text-sm leading-relaxed [&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-2 [&>strong]:text-primary/90";

  if (isUser) {
    return (
      <div className="self-end max-w-2xl w-full sm:w-auto">
        <div className="bg-primary/10 border border-primary/20 text-white p-5 rounded-3xl rounded-tr-sm shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {isFirstUserMsg ? 'Twój Kontekst' : 'Ty'}
            </span>
          </div>
          <div className={markdownStyles}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="self-start w-full max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
        </div>
        <div className="bg-surface-container-low border border-white/5 text-white p-5 rounded-3xl rounded-tl-sm shadow-lg w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">The Chairman</span>
          </div>
          <div className={markdownStyles}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
