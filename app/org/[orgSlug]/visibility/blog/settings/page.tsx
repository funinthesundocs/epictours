"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";

export default function BlogSettingsPage() {
    const [defaultTone, setDefaultTone] = useState("Friendly");
    const [defaultPostLength, setDefaultPostLength] = useState("Medium (800-1200 words)");
    const [defaultLanguage, setDefaultLanguage] = useState("English (US)");
    const [modelType, setModelType] = useState("Local Model (Free)");
    return (
        <PageShell
            title="Blog Settings"
            description="Configure scraping, AI generation, and publishing options"
            icon={SettingsIcon}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full overflow-auto p-6 space-y-6">
                {/* General Settings */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">General</h2>
                        <p className="text-sm text-muted-foreground">Default content generation preferences</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Default Tone</label>
                            <CustomSelect
                                value={defaultTone}
                                onChange={setDefaultTone}
                                options={["Professional", "Casual", "Friendly", "Expert"]}
                                placeholder="Select tone"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Writing style for generated posts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Default Post Length</label>
                            <CustomSelect
                                value={defaultPostLength}
                                onChange={setDefaultPostLength}
                                options={[
                                    "Short (400-600 words)",
                                    "Medium (800-1200 words)",
                                    "Long (1500-2000 words)"
                                ]}
                                placeholder="Select post length"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Target word count for new posts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Default Language</label>
                            <CustomSelect
                                value={defaultLanguage}
                                onChange={setDefaultLanguage}
                                options={[
                                    "English (US)",
                                    "English (UK)",
                                    "Spanish",
                                    "French"
                                ]}
                                placeholder="Select language"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Primary language for content</p>
                        </div>
                    </div>
                </div>

                {/* Scraping Settings */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">Scraping</h2>
                        <p className="text-sm text-muted-foreground">Web scraping and data collection options</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Max Concurrent Jobs</label>
                            <input
                                type="number"
                                defaultValue="3"
                                min="1"
                                max="10"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary/50 focus:outline-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Number of scraping jobs that can run simultaneously</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="safeSearch"
                                defaultChecked
                                className="w-4 h-4 rounded border-border bg-background checked:bg-primary checked:border-primary focus:ring-primary"
                            />
                            <div>
                                <label htmlFor="safeSearch" className="text-sm font-medium text-foreground cursor-pointer">Safe Search</label>
                                <p className="text-xs text-muted-foreground">Filter out inappropriate content</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Allowed Domains (Include List)</label>
                        <textarea
                            placeholder="example.com&#10;trusted-site.com&#10;news-source.org"
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">One domain per line. Leave empty to allow all domains.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Blocked Domains (Exclude List)</label>
                        <textarea
                            placeholder="spam-site.com&#10;low-quality.net"
                            rows={3}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Domains to exclude from scraping</p>
                    </div>
                </div>

                {/* AI & Generation Settings */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">AI & Generation</h2>
                        <p className="text-sm text-muted-foreground">AI model and generation parameters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Model Type</label>
                            <CustomSelect
                                value={modelType}
                                onChange={setModelType}
                                options={[
                                    "Local Model (Free)",
                                    "External API (GPT-4)",
                                    "External API (Claude)"
                                ]}
                                placeholder="Select model"
                            />
                            <p className="text-xs text-muted-foreground mt-1">AI model to use for generation</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Max Tokens Per Post</label>
                            <input
                                type="number"
                                defaultValue="2000"
                                min="500"
                                max="4000"
                                step="100"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary/50 focus:outline-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Maximum length for generated content</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Temperature: <span className="text-primary">0.7</span></label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            defaultValue="0.7"
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>More Focused (0)</span>
                            <span>More Creative (1)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Controls randomness in text generation</p>
                    </div>
                </div>

                {/* Publishing Connections */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">Publishing Connections</h2>
                        <p className="text-sm text-muted-foreground">Connect your blogs and content management systems</p>
                    </div>

                    <div className="space-y-3">
                        {/* WordPress */}
                        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.158 12.786L9.46 20.625C10.27 20.87 11.13 21 12 21c1.22 0 2.39-.23 3.47-.64L12.16 12.78zM3.48 12c0 1.94.65 3.73 1.74 5.16L8.83 5.5C5.85 6.96 3.48 9.29 3.48 12zm8.52-8.5c-.63 0-1.24.06-1.83.17L13.62 17.5l4.34-11.88c.75-1.81.26-3.27 0-3.27-.27 0-.55.04-.81.1-.9-1.25-2.32-2.45-4.15-2.45zM12 21.5c-5.25 0-9.5-4.25-9.5-9.5S6.75 2.5 12 2.5s9.5 4.25 9.5 9.5-4.25 9.5-9.5 9.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-foreground">WordPress Site</h3>
                                    <p className="text-xs text-muted-foreground">Publish directly to your WordPress blog</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors">
                                Connect
                            </button>
                        </div>

                        {/* Custom Website */}
                        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-foreground">Custom Website</h3>
                                    <p className="text-xs text-muted-foreground">Integrate via API or webhook</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors">
                                Connect
                            </button>
                        </div>

                        {/* Other CMS */}
                        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-foreground">Other CMS</h3>
                                    <p className="text-xs text-muted-foreground">Shopify, Wix, Squarespace, etc.</p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 bg-muted text-muted-foreground font-medium rounded-lg text-sm cursor-not-allowed"
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors">
                        Save Settings
                    </button>
                </div>
            </div>
        </PageShell>
    );
}
