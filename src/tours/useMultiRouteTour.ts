import { useAtom } from "jotai";
import {
  multiRouteTourActiveAtom,
  multiRouteTourRunAtom,
  multiRouteTourStepIndexAtom,
  multiRouteTourStepsAtom,
} from "./multiRouteTourAtoms";

export function useMultiRouteTour() {
  const [run, setRun] = useAtom(multiRouteTourRunAtom);
  const [stepIndex, setStepIndex] = useAtom(multiRouteTourStepIndexAtom);
  const [active, setActive] = useAtom(multiRouteTourActiveAtom);
  const [steps] = useAtom(multiRouteTourStepsAtom);

  const startTour = () => {
    setActive(true);
    setRun(true);
    setStepIndex(0);
  };
  const stopTour = () => {
    setActive(false);
    setRun(false);
    setStepIndex(0);
  };
  const setTourStep = (idx: number) => setStepIndex(idx);

  return {
    run,
    stepIndex,
    active,
    steps,
    startTour,
    stopTour,
    setTourStep,
    setRun,
    setActive,
    setStepIndex,
  };
}
