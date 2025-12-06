"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { AdvertiserApplicantSummary } from "@/features/applications/lib/dto";

const MAX_NOTE_LENGTH = 1000;

type ManageApplicantsDialogProps = {
  open: boolean;
  applicants: AdvertiserApplicantSummary[];
  onOpenChange: (next: boolean) => void;
  onConfirm: (options: { note: string | null }) => void;
  isSubmitting?: boolean;
};

export const ManageApplicantsDialog = ({
  open,
  applicants,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: ManageApplicantsDialogProps) => {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm({ note: note.trim().length > 0 ? note.trim() : null });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl border-slate-200 bg-slate-50 p-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-semibold text-slate-900">Approve applicants</SheetTitle>
          <SheetDescription className="text-sm text-slate-600">
            Approve the selected applicants. Add a note if you want to share context.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-800">
              Selected applicants {applicants.length.toLocaleString()}
            </p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm text-slate-600">
              {applicants.map((applicant) => (
                <li key={applicant.id} className="flex flex-col">
                  <span className="font-medium text-slate-800">{applicant.influencerName}</span>
                  {applicant.influencerEmail ? (
                    <span className="text-xs text-slate-500">{applicant.influencerEmail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Note (optional)</label>
            <Textarea
              rows={4}
              value={note}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue.length <= MAX_NOTE_LENGTH) {
                  setNote(nextValue);
                }
              }}
              placeholder="Share the reason for approval or any notes."
              disabled={isSubmitting}
            />
            <p className="text-right text-xs text-slate-400">
              {note.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || applicants.length === 0}
              className="bg-slate-900 text-white hover:bg-slate-700"
            >
              Approve
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
