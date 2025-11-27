"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shadcn/ui/button";

interface OpenCollectiveEmbedProps {
    collectiveSlug?: string;
    amount?: number;
    interval?: "month" | "year" | "one-time";
    backgroundColor?: string;
    minHeight?: string;
    variant?: "full" | "button" | "compact" | "custom";
    buttonColor?: "white" | "blue";
    redirectUrl?: string;
}

interface CustomDonationFormProps {
    collectiveSlug: string;
    defaultAmount?: number;
    defaultInterval?: "month" | "year" | "one-time";
    redirectUrl?: string;
}

// Custom donation form component
function CustomDonationForm({ collectiveSlug, defaultAmount, defaultInterval, redirectUrl }: CustomDonationFormProps) {
    const [amount, setAmount] = useState<string>(defaultAmount?.toString() || "");
    const [interval, setInterval] = useState<"month" | "year" | "one-time">(defaultInterval || "month");
    const [customAmount, setCustomAmount] = useState(false);
    const [error, setError] = useState<string>("");

    const presetAmounts = [10, 25, 50, 100];

    const handleDonate = () => {
        const donationAmount = amount ? parseFloat(amount) : null;
        if (!donationAmount || donationAmount <= 0) {
            setError("Please enter a valid donation amount");
            return;
        }

        // Clear any previous errors
        setError("");

        // Build Open Collective checkout URL
        // Use query parameters format (more reliable, especially for projects)
        const baseUrl = `https://opencollective.com/${collectiveSlug}/donate`;
        const params = new URLSearchParams();

        // Convert interval to Open Collective format
        const intervalMap: Record<"month" | "year" | "one-time", string> = {
            month: "monthly",
            year: "yearly",
            "one-time": "one-time",
        };

        const ocInterval = intervalMap[interval];

        // Add amount and interval as query parameters
        params.append("amount", donationAmount.toString());
        params.append("interval", ocInterval);

        // Add redirect as query parameter if provided
        if (redirectUrl) {
            params.append("redirect", redirectUrl);
        }

        const checkoutUrl = `${baseUrl}?${params.toString()}`;

        // Debug: log the URL to help troubleshoot
        console.log("Open Collective checkout URL:", checkoutUrl);

        // Open in popup window (Open Collective blocks iframe embedding)
        const width = 800;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            checkoutUrl,
            "OpenCollectiveCheckout",
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        // Monitor popup for closure or completion
        if (popup) {
            const checkClosed = window.setInterval(() => {
                if (popup.closed) {
                    window.clearInterval(checkClosed);
                    // Check if we should redirect or show success message
                    if (redirectUrl) {
                        // Small delay to allow Open Collective to process redirect
                        window.setTimeout(() => {
                            window.location.href = redirectUrl;
                        }, 500);
                    }
                }
            }, 500);
        }
    };

    return (
        <div className="w-full bg-white rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-center">Join the Mapped Supporters Network</h3>

            {/* Amount Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {presetAmounts.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => {
                                setAmount(preset.toString());
                                setCustomAmount(false);
                                setError(""); // Clear error when selecting preset
                            }}
                            className={`px-4 py-2 rounded-md border transition-colors ${amount === preset.toString() && !customAmount
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white border-neutral-300 hover:border-brand-blue"
                                }`}
                        >
                            £{preset}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-neutral-600">£</span>
                    <input
                        type="number"
                        value={customAmount ? amount : ""}
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setCustomAmount(true);
                            setError(""); // Clear error when user types
                        }}
                        onFocus={() => {
                            setCustomAmount(true);
                            setError(""); // Clear error when user starts typing
                        }}
                        placeholder="Custom amount"
                        min="1"
                        step="0.01"
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
            </div>

            {/* Interval Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                    {(["month", "year", "one-time"] as const).map((int) => (
                        <button
                            key={int}
                            type="button"
                            onClick={() => setInterval(int)}
                            className={`px-4 py-2 rounded-md border transition-colors capitalize ${interval === int
                                ? "bg-brand-blue text-white border-brand-blue"
                                : "bg-white border-neutral-300 hover:border-brand-blue"
                                }`}
                        >
                            {int === "one-time" ? "One-time" : int}
                        </button>
                    ))}
                </div>
            </div>

            {/* Donate Button */}
            <Button onClick={handleDonate} className="w-full" size="lg">
                {interval === "one-time" ? "Donate" : `Donate ${interval === "month" ? "Monthly" : "Yearly"}`}
            </Button>

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
            )}

            <p className="text-xs text-neutral-500 mt-4 text-center">
                Complete your donation securely through Open Collective
            </p>
        </div>
    );
}

export default function OpenCollectiveEmbed({
    collectiveSlug,
    amount,
    interval,
    backgroundColor,
    minHeight = "400px",
    variant = "full",
    buttonColor = "blue",
    redirectUrl,
}: OpenCollectiveEmbedProps) {
    if (!collectiveSlug) {
        return null;
    }
    const scriptRef = useRef<HTMLDivElement>(null);

    // Button widget variant - uses Open Collective's script widget
    useEffect(() => {
        if (variant === "button" && scriptRef.current) {
            // Clear any existing content
            scriptRef.current.innerHTML = "";

            // Create and load the script
            const script = document.createElement("script");
            script.src = `https://opencollective.com/${collectiveSlug}/donate/button.js`;
            script.setAttribute("color", buttonColor);
            script.async = true;
            scriptRef.current.appendChild(script);

            // Cleanup
            return () => {
                if (scriptRef.current) {
                    scriptRef.current.innerHTML = "";
                }
            };
        }
    }, [variant, collectiveSlug, buttonColor]);

    // Custom variant - custom UI form
    if (variant === "custom") {
        return <CustomDonationForm collectiveSlug={collectiveSlug} defaultAmount={amount} defaultInterval={interval} redirectUrl={redirectUrl} />;
    }

    // Button variant - minimal button widget
    if (variant === "button") {
        return (
            <div className="w-full flex items-center justify-center">
                <div ref={scriptRef} id="opencollective-donate-widget" />
            </div>
        );
    }

    // Compact variant - smaller iframe
    if (variant === "compact") {
        const baseUrl = `https://opencollective.com/embed/${collectiveSlug}/donate`;
        const params = new URLSearchParams();

        if (amount) {
            params.append("amount", amount.toString());
        }
        if (interval) {
            params.append("interval", interval);
        }
        if (backgroundColor) {
            params.append("backgroundColor", backgroundColor);
        }

        const embedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

        return (
            <div className="w-full max-w-md mx-auto">
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="500"
                    frameBorder="0"
                    scrolling="no"
                    seamless={true}
                    style={{
                        width: "100%",
                        height: "500px",
                        border: "none",
                        borderRadius: "8px",
                    }}
                    title="Open Collective Donation Form"
                />
            </div>
        );
    }

    // Full variant - full iframe embed (default)
    const baseUrl = `https://opencollective.com/embed/${collectiveSlug}/donate`;
    const params = new URLSearchParams();

    if (amount) {
        params.append("amount", amount.toString());
    }
    if (interval) {
        params.append("interval", interval);
    }
    if (backgroundColor) {
        params.append("backgroundColor", backgroundColor);
    }

    const embedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    return (
        <div className="w-full h-full min-h-[600px]">
            <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                seamless={true}
                style={{
                    width: "100%",
                    minHeight: minHeight,
                    border: "none",
                }}
                title="Open Collective Donation Form"
            />
        </div>
    );
}