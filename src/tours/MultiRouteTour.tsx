"use client";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CallBackProps } from "react-joyride";
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
import { useMultiRouteTour } from "./useMultiRouteTour";

export default function MultiRouteTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { run, stepIndex, steps, active, setRun, setStepIndex, setActive } =
    useMultiRouteTour();

  // Track the step that initiated navigation to handle route sync properly
  const [navigatingFromStep, setNavigatingFromStep] = useState<number | null>(
    null,
  );

  // Track the last route we detected navigation for to prevent infinite loops
  const [lastDetectedRoute, setLastDetectedRoute] = useState<string | null>(
    null,
  );

  // Track if bounds checking has been done to prevent infinite loops
  const boundsChecked = useRef(false);

  // Add component lifecycle logging
  useEffect(() => {
    console.log("🎬 MultiRouteTour component mounted");
    // Always set tour to inactive on mount
    setActive(false);

    return () => {
      console.log("💀 MultiRouteTour component unmounted");
    };
  }, [setActive]);

  // Separate effect for bounds checking to avoid infinite loops
  useEffect(() => {
    // Only check bounds once per component lifecycle
    if (
      !boundsChecked.current &&
      stepIndex >= steps.length &&
      steps.length > 0
    ) {
      console.log(
        "⚠️ Invalid stepIndex detected:",
        stepIndex,
        "max:",
        steps.length - 1,
        "resetting to 0",
      );
      setStepIndex(0);
      boundsChecked.current = true;
    }

    // Also check if stepIndex is exactly at the last step and we're on dashboard
    if (
      stepIndex === steps.length - 1 &&
      pathname === "/dashboard" &&
      !boundsChecked.current
    ) {
      console.log(
        "⚠️ Tour at final step but on dashboard - likely navigation issue, resetting",
      );
      setStepIndex(0);
      setRun(false);
      setActive(false);
      boundsChecked.current = true;
    }
  }, [steps.length, stepIndex, setStepIndex, pathname, setRun, setActive]);

  // Track run state changes
  useEffect(() => {
    console.log("🏃 Run state changed:", run);
    // Reset bounds checking when tour starts
    if (run) {
      boundsChecked.current = false;
    }
  }, [run]);

  // Simple route sync for steps with next routes
  useEffect(() => {
    console.log(
      "🚀 Route sync - path:",
      pathname,
      "stepIndex:",
      stepIndex,
      "active:",
      active,
      "run:",
      run,
      "navigatingFromStep:",
      navigatingFromStep,
    );

    // Handle route sync when we have navigation tracking (from callback)
    if (navigatingFromStep !== null && run) {
      const checkStep = steps[navigatingFromStep];
      if (checkStep?.data?.next) {
        const expectedRoute = checkStep.data.next;
        const routeMatches = expectedRoute.includes("[id]")
          ? new RegExp(
              "^" + expectedRoute.replace(/\[id\]/g, "[^/]+") + "$",
            ).test(pathname)
          : expectedRoute === pathname;

        console.log("📡 Route sync check:", {
          navigatingFromStep,
          expectedRoute,
          pathname,
          routeMatches,
          checkStep: checkStep.target,
        });

        if (routeMatches) {
          console.log("✅ Expected route change detected, advancing step");
          const nextStepIndex = navigatingFromStep + 1;
          console.log("📊 Route advancement details:", {
            navigatingFromStep,
            nextStepIndex,
            stepsLength: steps.length,
            willComplete: nextStepIndex >= steps.length,
          });
          if (nextStepIndex < steps.length) {
            console.log(
              "⏭️ Advancing from step",
              navigatingFromStep,
              "to step",
              nextStepIndex,
            );
            // Stop and restart the tour at the next step
            setRun(false);
            setStepIndex(nextStepIndex);
            setTimeout(() => {
              setRun(true);
            }, 100);
            setNavigatingFromStep(null);
          } else {
            console.log("🏁 Tour completed - reached final step");
            setRun(false);
            setActive(false);
            setStepIndex(0);
            setNavigatingFromStep(null);
          }
        }
      }
    }

    // Special detection for disableNext steps where user clicks target directly
    // This handles cases where Next.js Link navigation bypasses Joyride callbacks
    if (navigatingFromStep === null && run && active) {
      const currentStep = steps[stepIndex];
      if (currentStep?.data?.disableNext && currentStep?.data?.next) {
        const expectedRoute = currentStep.data.next;
        const routeMatches = expectedRoute.includes("[id]")
          ? new RegExp(
              "^" + expectedRoute.replace(/\[id\]/g, "[^/]+") + "$",
            ).test(pathname)
          : expectedRoute === pathname;

        const currentRoute = currentStep.data.route;
        const wasOnCurrentRoute =
          currentRoute &&
          (currentRoute.includes("[id]")
            ? new RegExp(
                "^" + currentRoute.replace(/\[id\]/g, "[^/]+") + "$",
              ).test(pathname)
            : currentRoute === pathname);

        // Create a unique key for this detection to prevent repeats
        const detectionKey = `${stepIndex}-${pathname}`;

        console.log("🔍 Detection check:", {
          stepIndex,
          pathname,
          expectedRoute,
          currentRoute,
          routeMatches,
          wasOnCurrentRoute,
          detectionKey,
          lastDetectedRoute,
          wouldTrigger:
            routeMatches &&
            !wasOnCurrentRoute &&
            lastDetectedRoute !== detectionKey,
        });

        // If we've navigated to the expected route and we weren't already there
        // and we haven't already detected this exact navigation
        if (
          routeMatches &&
          !wasOnCurrentRoute &&
          lastDetectedRoute !== detectionKey
        ) {
          console.log(
            "🎯 Direct navigation detected on disableNext step",
            stepIndex,
            "- tracking navigation without stopping tour",
          );
          setLastDetectedRoute(detectionKey);
          setNavigatingFromStep(stepIndex);
          // Don't stop the tour - just track that we're navigating
          // setRun(false); // This was causing the restart issue!
        }
      }
    }

    // Reset detection key when step changes
    if (lastDetectedRoute && !lastDetectedRoute.startsWith(`${stepIndex}-`)) {
      console.log(
        "🧹 Clearing lastDetectedRoute:",
        lastDetectedRoute,
        "for step:",
        stepIndex,
      );
      setLastDetectedRoute(null);
    }
  }, [
    pathname,
    stepIndex,
    steps,
    active,
    run,
    navigatingFromStep,
    lastDetectedRoute,
    setStepIndex,
    setActive,
    setRun,
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { index, type, status, action } = data;
    console.log("Joyride callback:", { index, type, status, action });

    // Handle tour completion
    if (status === "finished" || status === "skipped") {
      setRun(false);
      setActive(false);
      setStepIndex(0);
      return;
    }

    // Don't sync step index from Joyride - we control it ourselves
    // Our stepIndex state is the source of truth, not Joyride's index

    // Handle normal step progression via Next/Back buttons
    if (action === "next" && type === "step:after") {
      const currentStep = steps[stepIndex]; // Use our stepIndex, not Joyride's index
      const nextRoute = currentStep?.data?.next;

      if (nextRoute) {
        console.log(
          "Next button - navigating to:",
          nextRoute,
          "from step:",
          stepIndex,
        );
        setNavigatingFromStep(stepIndex);
        router.push(nextRoute);
        return;
      } else {
        // Normal next step without navigation
        const nextStep = stepIndex + 1;
        if (nextStep < steps.length) {
          console.log("Next button - advancing to step:", nextStep);
          setStepIndex(nextStep);
        } else {
          console.log("🏁 Tour completed via Next button");
          setRun(false);
          setActive(false);
          setStepIndex(0);
        }
      }
    }

    // Handle back button
    if (action === "prev" && type === "step:before") {
      // Check if the previous step has a different route than current step
      const currentStep = steps[stepIndex];
      const prevStep = steps[stepIndex - 1];

      if (prevStep?.data?.route && currentStep?.data?.route) {
        const prevRoute = prevStep.data.route;
        const currentRoute = currentStep.data.route;

        // If routes are different, prevent the back navigation
        if (prevRoute !== currentRoute) {
          console.log(
            "Back button - different route detected, preventing navigation from:",
            currentRoute,
            "to:",
            prevRoute,
          );
          return; // Prevent the back navigation
        }
      }

      // Normal back step
      console.log("Back button - going back to step:", stepIndex - 1);
      setStepIndex(stepIndex - 1);
    }

    // Handle navigation via target clicks (when user clicks the actual target element)
    if (type === "step:after" && action === "update") {
      const currentStep = steps[stepIndex]; // Use our stepIndex, not Joyride's index
      const nextRoute = currentStep?.data?.next;

      if (nextRoute && currentStep?.data?.disableNext) {
        console.log(
          "Target click on disableNext step - navigating to:",
          nextRoute,
          "from step:",
          stepIndex,
        );
        setNavigatingFromStep(stepIndex);
        router.push(nextRoute);
        return;
      }
    }
  };

  // Get the current step to check for disableNext and disableBack
  const currentStep = steps[stepIndex];
  const prevStep = steps[stepIndex - 1];
  const shouldHideNext = currentStep?.data?.disableNext || false;

  // Hide back button if previous step has different route or if we're on first step
  const shouldHideBack =
    stepIndex === 0 ||
    (prevStep?.data?.route &&
      currentStep?.data?.route &&
      prevStep.data.route !== currentStep.data.route);

  return (
    <Joyride
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      continuous
      showSkipButton
      showProgress
      hideCloseButton
      disableOverlayClose
      disableCloseOnEsc
      disableScrolling
      spotlightClicks
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
        },
        buttonNext: {
          display: shouldHideNext ? "none" : "inline-block",
        },
        buttonBack: {
          display: shouldHideBack ? "none" : "inline-block",
        },
      }}
      locale={{
        skip: "End tour",
        last: "Finish",
        next: "Next",
        back: "Back",
      }}
    />
  );
}
