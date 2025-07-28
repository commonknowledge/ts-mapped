"use client";
import { atom, useAtom } from "jotai";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { CallBackProps, Step } from "react-joyride";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

// Global atom to control tour state
export const tourOpenAtom = atom(false);
export const tourStepIndexAtom = atom(0);

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    content: (
      <div style={{ textAlign: "center" }}>
        <h2
          style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}
        >{`This looks like your first time here`}</h2>
        <p style={{ marginBottom: 16 }}>
          {`We're going to walk you through how to create a new map by uploading a CSV.`}
          <br />
          {`(Don't worry, we'll provide the CSV!)`}
        </p>
      </div>
    ),
  },
  {
    target: ".joyride-button-new-map",
    content: "You can add a new map by clicking this button.",
  },
];

export function useStartCreateMapFromCsvTour() {
  const [, setOpen] = useAtom(tourOpenAtom);
  return () => setOpen(true);
}

export default function CreateMapFromCsvTour() {
  const [open, setOpen] = useAtom(tourOpenAtom);
  const [stepIndex, setStepIndex] = useAtom(tourStepIndexAtom);

  useEffect(() => {
    if (!open) setStepIndex(0);
  }, [open, setStepIndex]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    if (type === "step:after" || type === "error:target_not_found") {
      setStepIndex(index + 1);
    }
    if (status === "finished" || status === "skipped") {
      setOpen(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={open}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
      locale={{
        skip: "Cancel",
        last: "Finish",
        next: "Next",
        back: "Back",
      }}
    />
  );
}
