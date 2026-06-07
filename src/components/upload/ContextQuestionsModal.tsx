import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/rx/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicalContext } from "@/types/report";

interface Props {
  open: boolean;
  onSubmit: (ctx: ClinicalContext | null) => void;
  onSkip: () => void;
}

export function ContextQuestionsModal({ open, onSubmit, onSkip }: Props) {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female" | "other">("");
  const [symptoms, setSymptoms] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);

  const handleContinue = () => {
    const ctx: ClinicalContext = {
      age: age ? Number(age) : null,
      sex: sex || null,
      symptoms: symptoms.trim() || null,
      conditions: conditions.trim() || null,
      medications: medications.trim() || null,
      isPregnant: sex === "female" ? isPregnant : null,
    };
    onSubmit(ctx);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>A few quick questions</DialogTitle>
          <DialogDescription>
            Optional — these help us personalise your explanations. All fields are private and skipped if blank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ctx-age">Age</Label>
              <Input
                id="ctx-age"
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
              />
            </div>
            <div>
              <Label htmlFor="ctx-sex">Sex</Label>
              <select
                id="ctx-sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as typeof sex)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {sex === "female" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
              />
              Currently pregnant
            </label>
          )}

          <div>
            <Label htmlFor="ctx-symptoms">Current symptoms (optional)</Label>
            <Textarea
              id="ctx-symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. tired, headaches, dizzy"
              rows={2}
              maxLength={2000}
            />
          </div>

          <div>
            <Label htmlFor="ctx-conditions">Known conditions (optional)</Label>
            <Textarea
              id="ctx-conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. hypothyroid, PCOS"
              rows={2}
              maxLength={2000}
            />
          </div>

          <div>
            <Label htmlFor="ctx-meds">Current medications (optional)</Label>
            <Textarea
              id="ctx-meds"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="e.g. levothyroxine 50mcg"
              rows={2}
              maxLength={2000}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="ghost" size="md" onClick={onSkip} fullWidth>
            Skip
          </Button>
          <Button variant="primary" size="md" onClick={handleContinue} fullWidth>
            Continue with context
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
