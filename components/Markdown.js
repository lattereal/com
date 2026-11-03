import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

// Raw HTML is never parsed (no rehype-raw); the sanitizer is a second layer.
// Images are dropped entirely: no uploads or remote embeds in v1.
export default function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        disallowedElements={['img']}
        unwrapDisallowed
        components={{
          a: ({ node, ...props }) => <a {...props} rel="nofollow ugc noopener" target="_blank" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
