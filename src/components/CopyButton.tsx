import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [label, setLabel] = useState('Copy');

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setLabel('Copied');
      setTimeout(() => setLabel('Copy'), 1200);
    });
  }

  return <button className="copy-btn" onClick={handleCopy}>{label}</button>;
}
