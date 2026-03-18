import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface Question {
  id: number;
  question: string;
  activity: string;
  related_process: string | null;
}

interface Props {
  activityName: string;
  excludedProcesses: string[];
  setExcludedProcesses: (v: string[]) => void;
  answers: Record<number, boolean>;
  setAnswers: (v: Record<number, boolean>) => void;
}

const Step3SmartQuestions = ({ activityName, excludedProcesses, setExcludedProcesses, answers, setAnswers }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("decision_tree_questions")
        .select("*")
        .eq("activity", activityName);

      const qs = data || [];
      setQuestions(qs);

      // Only set defaults if no answers exist yet for these questions
      const hasExisting = qs.some((q) => answers[q.id] !== undefined);
      if (!hasExisting) {
        const defaults: Record<number, boolean> = {};
        qs.forEach((q) => (defaults[q.id] = true));
        setAnswers(defaults);
        setExcludedProcesses([]);
      } else {
        // Recalculate excluded from existing answers
        const excluded: string[] = [];
        qs.forEach((q) => {
          if (!answers[q.id] && q.related_process) {
            const processes = q.related_process.split("|").map((p) => p.trim());
            excluded.push(...processes);
          }
        });
        setExcludedProcesses(excluded);
      }
      setLoading(false);
    };
    load();
  }, [activityName]);

  const handleToggle = (q: Question, value: boolean) => {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    const excluded: string[] = [];
    questions.forEach((question) => {
      if (!newAnswers[question.id] && question.related_process) {
        const processes = question.related_process.split("|").map((p) => p.trim());
        excluded.push(...processes);
      }
    });
    setExcludedProcesses(excluded);
    console.log("[Step3] Excluded processes:", excluded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Smart Questions</h2>
        <p className="text-sm text-muted-foreground">No screening questions for this activity. Proceed to the next step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Smart Questions</h2>
        <p className="text-sm text-muted-foreground mt-1">Answer these questions to customize your process flow</p>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-industrial ${
              answers[q.id] ? "border-border bg-card" : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <div className="flex-1 mr-4">
              <p className="text-sm font-medium text-foreground">{q.question}</p>
              {q.related_process && (
                <p className="text-xs text-muted-foreground mt-1">
                  Related process: {q.related_process}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium ${answers[q.id] ? "text-accent" : "text-destructive"}`}>
                {answers[q.id] ? "YES" : "NO"}
              </span>
              <Switch
                checked={answers[q.id]}
                onCheckedChange={(v) => handleToggle(q, v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step3SmartQuestions;
