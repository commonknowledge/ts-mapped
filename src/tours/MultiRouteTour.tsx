"use client";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CallBackProps } from "react-joyride";
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
import { useMultiRouteTour } from "./useMultiRouteTour";

export default function MultiRouteTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { run, stepIndex, steps, active, setRun, setStepIndex, setActive } =
    useMultiRouteTour();

  // Sync tour with route changes
  useEffect(() => {
    console.log("path: ", pathname, "active:", active, "stepIndex:", stepIndex);
    if (!active) return;

    // Find the step that matches the current pathname
    const matchingStepIndex = steps.findIndex((step) => {
      const route = step.data?.route;
      if (!route) return false;

      // Handle dynamic routes like /map/[id]
      if (route.endsWith("/[id]")) {
        return pathname.startsWith(route.replace("/[id]", "/"));
      }
      return route === pathname;
    });

    console.log(
      "matchingStepIndex:",
      matchingStepIndex,
      "currentStepIndex:",
      stepIndex
    );

    // If we found a matching step and it's different from current step
    if (matchingStepIndex !== -1 && matchingStepIndex !== stepIndex) {
      console.log("Setting step index to:", matchingStepIndex);
      setStepIndex(matchingStepIndex);
      // Only restart the tour if it's not already running
      if (!run) {
        setRun(true);
      }
    }
  }, [pathname, active, stepIndex, steps, setRun, setStepIndex, run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { index, type, status, action } = data;
    console.log("Joyride callback:", {
      index,
      type,
      status,
      action,
      currentStepIndex: stepIndex,
    });

    // Handle tour completion
    if (status === "finished" || status === "skipped") {
      setRun(false);
      setActive(false);
      setStepIndex(0);
      return;
    }

    // Only handle navigation for user-initiated actions
    if (action === "next" && type === "step:after") {
      const currentStep = steps[index];
      const nextRoute = currentStep?.data?.next;
      console.log(
        "User clicked next - currentStep:",
        currentStep,
        "nextRoute:",
        nextRoute
      );

      // Navigate to next route if specified
      if (nextRoute) {
        console.log("Navigating to:", nextRoute);
        setRun(false);
        router.push(nextRoute);
        return;
      }
    }

    if (action === "prev" && type === "step:before") {
      const currentStep = steps[index];
      const prevRoute = currentStep?.data?.previous;
      console.log(
        "User clicked back - currentStep:",
        currentStep,
        "prevRoute:",
        prevRoute
      );

      // Navigate to previous route if specified
      if (prevRoute) {
        console.log("Navigating to:", prevRoute);
        setRun(false);
        router.push(prevRoute);
        return;
      }
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      spotlightClicks
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
      locale={{
        skip: "Skip",
        last: "Finish",
        next: "Next",
        back: "Back",
      }}
    />
  );
}
