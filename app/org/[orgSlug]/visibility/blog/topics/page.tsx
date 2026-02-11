"use client";

import { PageShell } from "@/components/shell/page-shell";
import { FileText, Plus, Play, Pause, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";

// Mock data
const topics = [
    {
        id: 1,
        name: "Hawaii family vacations",
        keyword: "hawaii family activities",
        audience: "Families with kids",
        frequency: "Weekly",
        lastRun: "2 days ago",
        status: "Active",
    },
    {
        id: 2,
        name: "Honolulu food guides",
        keyword: "best honolulu restaurants",
        audience: "Food enthusiasts",
        frequency: "Monthly",
        lastRun: "1 week ago",
        status: "Active",
    },
    {
        id: 3,
        name: "Maui outdoor adventures",
        keyword: "maui hiking trails",
        audience: "Adventure seekers",
        frequency: "Weekly",
        lastRun: "Never",
        status: "Paused",
    },
];

export default function TopicsPage() {
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<typeof topics[0] | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [postLength, setPostLength] = useState("Medium (800-1200 words)");
    const [tone, setTone] = useState("Friendly");
    const [frequency, setFrequency] = useState("Weekly");
    const [dayOfWeek, setDayOfWeek] = useState("Monday");

    const handleTopicClick = (topic: typeof topics[0]) => {
        setSelectedTopic(topic);
        setShowDetailPanel(true);
    };

    return (
        <PageShell
            title="Topics & Jobs"
            description="Define what to scrape and generate"
            icon={FileText}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full grid grid-cols-[550px_1fr] gap-6 p-6 overflow-hidden">
                {/* Left Column: Create Topic Form */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Create New Topic</h2>
                        </div>

                        {/* Step Indicator */}
                        <div className="px-6 py-4 border-b border-border">
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { num: 1, label: "Basics" },
                                    { num: 2, label: "Scraping" },
                                    { num: 3, label: "Generation" },
                                    { num: 4, label: "Schedule" }
                                ].map((step, index) => (
                                    <div key={step.num} className="flex flex-col items-center gap-2">
                                        <div className="flex items-center w-full">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${currentStep >= step.num
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                                }`}>
                                                {step.num}
                                            </div>
                                            {index < 3 && (
                                                <div className={`flex-1 h-0.5 ${currentStep > step.num ? "bg-primary" : "bg-muted"
                                                    }`} />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Content - Scrollable */}
                        <div className="flex-1 overflow-auto p-6 space-y-4">
                            {currentStep === 1 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Topic Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Hawaii snorkeling tours for beginners"
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Primary Keyword</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., best snorkeling tours hawaii"
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
                                        <textarea
                                            placeholder="Brief description of this topic..."
                                            rows={3}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Regions/Languages</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., US, EN"
                                            defaultValue="US, EN"
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Max Articles Per Run</label>
                                        <input
                                            type="number"
                                            placeholder="10"
                                            defaultValue="10"
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Maximum number of source articles to scrape per run</p>
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Post Length</label>
                                        <CustomSelect
                                            value={postLength}
                                            onChange={setPostLength}
                                            options={[
                                                "Short (400-600 words)",
                                                "Medium (800-1200 words)",
                                                "Long (1500-2000 words)"
                                            ]}
                                            placeholder="Select post length"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tone</label>
                                        <CustomSelect
                                            value={tone}
                                            onChange={setTone}
                                            options={["Professional", "Casual", "Friendly", "Expert"]}
                                            placeholder="Select tone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Brand Voice Notes</label>
                                        <textarea
                                            placeholder="Describe your brand voice, key messaging, or any specific guidelines..."
                                            rows={4}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {currentStep === 4 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
                                        <CustomSelect
                                            value={frequency}
                                            onChange={setFrequency}
                                            options={["One-time", "Weekly", "Monthly"]}
                                            placeholder="Select frequency"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Day/Time</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <CustomSelect
                                                value={dayOfWeek}
                                                onChange={setDayOfWeek}
                                                options={[
                                                    "Monday",
                                                    "Tuesday",
                                                    "Wednesday",
                                                    "Thursday",
                                                    "Friday",
                                                    "Saturday",
                                                    "Sunday"
                                                ]}
                                                placeholder="Select day"
                                            />
                                            <input
                                                type="time"
                                                defaultValue="09:00"
                                                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary/50 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Form Footer */}
                        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                            <button
                                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                                disabled={currentStep === 1}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Back
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Reset
                                </button>
                                {currentStep < 4 ? (
                                    <button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm transition-colors"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm transition-colors"
                                    >
                                        Create Topic
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Topics Table */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="bg-card border border-border rounded-xl h-full overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 backdrop-blur-sm sticky top-0">
                                    <tr className="border-b border-border">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Topic Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Primary Keyword</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Audience</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Frequency</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Last Run</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {topics.map((topic) => (
                                        <tr
                                            key={topic.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => handleTopicClick(topic)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">{topic.name}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{topic.keyword}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{topic.audience}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{topic.frequency}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{topic.lastRun}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${topic.status === "Active"
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-yellow-500/10 text-yellow-500"
                                                    }`}>
                                                    {topic.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Topic Detail Panel */}
            {showDetailPanel && selectedTopic && (
                <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Topic Details</h2>
                        <button
                            onClick={() => setShowDetailPanel(false)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Basic Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Topic Name</label>
                                    <p className="text-sm text-foreground mt-1">{selectedTopic.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Target Audience</label>
                                    <p className="text-sm text-foreground mt-1">{selectedTopic.audience}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Scrape Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Regions/Languages</label>
                                    <p className="text-sm text-foreground mt-1">US, EN</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Max Articles Per Run</label>
                                    <p className="text-sm text-foreground mt-1">10 articles</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Generation Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Post Length</label>
                                    <p className="text-sm text-foreground mt-1">Medium (800-1200 words)</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Tone</label>
                                    <p className="text-sm text-foreground mt-1">Friendly</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Brand Voice Notes</label>
                                    <p className="text-sm text-foreground mt-1">Focus on family-friendly activities, eco-tourism, and authentic Hawaiian experiences.</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Schedule</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Frequency</label>
                                    <p className="text-sm text-foreground mt-1">{selectedTopic.frequency}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Next Run</label>
                                    <p className="text-sm text-foreground mt-1">Monday, Feb 17 at 9:00 AM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
