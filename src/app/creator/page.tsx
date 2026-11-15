import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { creatorData } from "@/data/creatorData";
import { Mail, ExternalLink, Award, Code2, Layers, Cpu, ShieldAlert, ArrowRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";

export const metadata: Metadata = {
  title: "Creator & Developer Profile — Osanda Hirushaka | PHOBOSIA",
  description:
    "Meet Osanda Hirushaka (Muthukumarana), the software engineer and 3D technical artist from Sri Lanka who conceived, 3D modeled, and engineered PHOBOSIA.",
};

const CREATOR_TOC: RailTocItem[] = [
  { id: "creator-profile", label: "Profile Summary", depth: 0 },
  { id: "origin-notice", label: "Origin Notice", depth: 0 },
  { id: "creator-drive", label: "Background & Drive", depth: 0 },
  { id: "technical-capabilities", label: "Technical Capabilities", depth: 0 },
  { id: "key-milestones", label: "Key Milestones", depth: 0 },
];

export default function CreatorPage() {
  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageTelemetryLayout tocTitle="Creator Dossier" items={CREATOR_TOC}>
        {/* Profile Card Header */}
        <LiquidGlassCard
          id="creator-profile"
          as="section"
          tier="showcase"
          accent="cyan"
          className="scroll-mt-28 p-8 sm:p-12 rounded-3xl mb-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-mars-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 relative z-10">
            {/* Portrait Image */}
            <div className="relative w-48 h-56 sm:w-56 sm:h-64 rounded-2xl overflow-hidden bg-space-950 border border-white/20 ring-1 ring-cyan-400/20 shadow-2xl shrink-0">
              <Image
                src={creatorData.portraitImage}
                alt={creatorData.name}
                fill
                priority
                quality={95}
                sizes="(max-width: 640px) 384px, 512px"
                className="object-cover object-top"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,transparent_54%,rgba(2,6,23,0.45)_100%)] pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-space-950/85 via-space-950/35 to-transparent pointer-events-none"
              />
              <span
                aria-hidden="true"
                className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-300/70 pointer-events-none"
              />
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-300/70 pointer-events-none"
              />
            </div>

            {/* Title & Bio Details */}
            <div className="space-y-4 text-center md:text-left flex-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mission uppercase tracking-wider bg-mars-500/20 text-mars-300 border border-mars-500/30">
                Software Engineer &amp; 3D Technical Artist
              </span>

              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
                {creatorData.name}
              </h1>

              <p className="text-xs sm:text-sm font-mission text-cyan-300">
                {creatorData.fullName} • {creatorData.discipline}
              </p>

              <p className="text-xs sm:text-sm text-slate-300">
                Software Engineer from Sri Lanka 🇱🇰
              </p>

              {/* Verified External Links */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <LiquidGlassButton
                  href={creatorData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass"
                  size="sm"
                  contentClassName="min-h-[42px] px-4"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub (@osa623)</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" aria-hidden="true" />
                </LiquidGlassButton>

                <LiquidGlassButton
                  href={creatorData.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass"
                  size="sm"
                  contentClassName="min-h-[42px] px-4"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>LinkedIn (@osanda623)</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" aria-hidden="true" />
                </LiquidGlassButton>

                <LiquidGlassButton
                  href={`mailto:${creatorData.email}`}
                  variant="glass"
                  size="sm"
                  contentClassName="min-h-[42px] px-4"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{creatorData.email}</span>
                </LiquidGlassButton>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Clear Distinction Notice: Developer vs Fictional Character */}
        <section id="origin-notice" className="scroll-mt-28 p-6 rounded-2xl liquid-glass-card liquid-glass-card--amber mb-16 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="font-subhead text-sm font-semibold text-white">
              Important Narrative Distinction: Real Developer vs. Fictional Astronaut
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="font-mission text-white">Osanda Hirushaka</strong> is the real-world software engineer and 3D technical artist who created the PHOBOSIA application. He is distinct from <strong className="font-mission text-white">Carl Ashwindu</strong>, the fictional 35-year-old astronaut character stationed inside the simulation. Narrative lore and character backstories do not reflect the developer&apos;s biography.
            </p>
            <div className="pt-2">
              <Link href="/story" className="text-xs font-nav text-amber-400 hover:underline">
                Read Carl Ashwindu&apos;s Story Dossier →
              </Link>
            </div>
          </div>
        </section>

        {/* Developer Narrative Bio */}
        <section id="creator-drive" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-mission uppercase text-mars-400 tracking-wider">
              Background &amp; Drive
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Bridging Web Engineering &amp; 3D Planetary Simulation
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-4 text-sm text-slate-300 leading-relaxed">
            {creatorData.bio.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Technical Capabilities */}
        <section id="technical-capabilities" className="scroll-mt-28 space-y-6 mb-20">
          <h2 className="font-display text-2xl font-semibold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <span>Technical Capabilities &amp; Engineering Focus</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {creatorData.technicalCapabilities.map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl liquid-glass-card space-y-3">
                <h3 className="font-subhead text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  {item.category}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {item.skills.map((skill, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-space-700" />
                      <span className="text-slate-200">{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Key Achievements */}
        <section id="key-milestones" className="scroll-mt-28 p-8 sm:p-10 rounded-3xl liquid-glass-card mb-16">
          <h2 className="font-subhead text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Key Project Achievements</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creatorData.keyAchievements.map((ach, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-mars-500/10 text-mars-400 border border-mars-500/20 flex items-center justify-center font-mission text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {ach}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Navigation */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <LiquidGlassButton
            href="/story"
            variant="glass"
            size="md"
            contentClassName="px-6 uppercase tracking-wider"
          >
            <span>Read Astronaut Carl Ashwindu&apos;s Story</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </LiquidGlassButton>
          <a
            href={creatorData.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-nav text-mars-400 hover:text-mars-300 transition-colors"
          >
            View Official Phobosia Repository on GitHub →
          </a>
        </div>
        </PageTelemetryLayout>
      </div>
    </div>
  );
}
