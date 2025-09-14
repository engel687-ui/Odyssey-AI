import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { ClarificationQuestion, ParsedPreferences } from '@/utils/promptParser';

interface ClarificationModalProps {
  isOpen: boolean;
  questions: ClarificationQuestion[];
  onAnswer: (field: keyof ParsedPreferences, answer: string) => void;
  onClose: () => void;
}

const ClarificationModal = ({ isOpen, questions, onAnswer, onClose }: ClarificationModalProps) => {
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-900 mb-3">A few quick questions to personalize your trip</h3>

      {questions.map((q) => (
        <Card key={q.field} className="mb-3">
          <CardContent className="p-3">
            <p className="text-sm text-blue-800 mb-2">{q.question}</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {q.suggestions?.map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => onAnswer(q.field, s)}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  {s}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type your own answer"
                value={customAnswers[q.field as string] || ''}
                onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.field as string]: e.target.value }))}
                className="flex-1 rounded-md border px-3 py-2"
              />
              <Button
                size="sm"
                onClick={() => {
                  const answer = customAnswers[q.field as string]?.trim();
                  if (answer) {
                    onAnswer(q.field, answer);
                    setCustomAnswers(prev => ({ ...prev, [q.field as string]: '' }));
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3 mt-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-600">
          Done
        </Button>
      </div>
    </div>
  );
};

export default ClarificationModal;