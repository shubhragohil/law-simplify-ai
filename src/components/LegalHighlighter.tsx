import React from 'react';

interface LegalHighlighterProps {
  text: string;
}

// Legal terms categorized by severity
const legalTerms = {
  critical: [
    'breach of contract', 'default', 'termination', 'void', 'null and void', 
    'penalty', 'liquidated damages', 'force majeure', 'material breach',
    'fundamental breach', 'repudiation', 'rescission', 'revocation'
  ],
  high: [
    'liability', 'indemnity', 'indemnification', 'damages', 'remedy',
    'breach', 'violation', 'non-compliance', 'infringement', 'negligence',
    'warranty', 'representation', 'guarantee', 'covenant', 'undertaking'
  ],
  medium: [
    'obligation', 'duty', 'responsibility', 'condition', 'precedent',
    'subsequent', 'notice', 'consent', 'approval', 'assignment',
    'novation', 'amendment', 'modification', 'waiver', 'release'
  ],
  low: [
    'agreement', 'contract', 'party', 'parties', 'consideration',
    'performance', 'delivery', 'payment', 'term', 'clause',
    'provision', 'section', 'article', 'schedule', 'exhibit'
  ],
  info: [
    'whereas', 'hereinafter', 'heretofore', 'herein', 'thereof',
    'whereof', 'aforesaid', 'aforementioned', 'pursuant to', 'in accordance with'
  ]
};

const LegalHighlighter: React.FC<LegalHighlighterProps> = ({ text }) => {
  const highlightText = (inputText: string): React.ReactNode => {
    let highlightedText = inputText;
    const replacements: Array<{ text: string; severity: string; start: number; end: number }> = [];

    // Find all legal terms and their positions
    Object.entries(legalTerms).forEach(([severity, terms]) => {
      terms.forEach(term => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;
        while ((match = regex.exec(inputText)) !== null) {
          replacements.push({
            text: match[0],
            severity,
            start: match.index,
            end: match.index + match[0].length
          });
        }
      });
    });

    // Sort replacements by position to avoid conflicts
    replacements.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep the first one)
    const filteredReplacements = replacements.filter((replacement, index) => {
      return !replacements.slice(0, index).some(prev => 
        replacement.start < prev.end && replacement.end > prev.start
      );
    });

    if (filteredReplacements.length === 0) {
      return inputText;
    }

    // Build the highlighted text
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredReplacements.forEach((replacement, index) => {
      // Add text before the match
      if (replacement.start > lastIndex) {
        parts.push(inputText.slice(lastIndex, replacement.start));
      }

      // Add highlighted term
      parts.push(
        <span 
          key={index} 
          className={`legal-highlight-${replacement.severity}`}
          title={`Legal term: ${replacement.severity} severity`}
        >
          {replacement.text}
        </span>
      );

      lastIndex = replacement.end;
    });

    // Add remaining text
    if (lastIndex < inputText.length) {
      parts.push(inputText.slice(lastIndex));
    }

    return parts;
  };

  return <div className="text-sm leading-relaxed">{highlightText(text)}</div>;
};

export default LegalHighlighter;
