import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowUpRight, ShieldAlert } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-space-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand synopsis & Scientific Transparency (wider editorial column) */}
          <div className="md:col-span-5 space-y-5">
            <Link
              href="/"
              aria-label="PHOBOSIA Home"
              className="inline-flex items-center -ml-1 py-1 rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            >
              <Image
                src="/phobosia-logo.webp"
                alt="PHOBOSIA"
                width={1600}
                height={533}
                className="h-10 sm:h-12 w-auto object-contain object-left select-none"
              />
            </Link>

            <p className="text-sm leading-relaxed text-slate-300 max-w-md">
              An interactive 3D Mars exploration simulation built with Next.js, Three.js, and Blender. Grounded in NASA HiRISE topography of Elysium Planitia across an 11-SOL expedition.
            </p>

            <LiquidGlassCard tier="recessed" className="p-4 rounded-2xl space-y-2 max-w-md">
              <h2 className="font-subhead text-xs font-semibold text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Scientific Transparency Notice</span>
              </h2>
              <p className="text-xs leading-relaxed text-slate-300">
                PHOBOSIA is an independent educational software project, not an official NASA mission or NASA-endorsed product. Surface telemetry and astronaut lore are simulated for interactive exploration.
              </p>
            </LiquidGlassCard>

            <div className="flex items-center gap-3 pt-1">
              <LiquidGlassButton
                href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
                target="_blank"
                rel="noopener noreferrer"
                variant="glass"
                size="icon"
                aria-label="PHOBOSIA GitHub Repository"
                contentClassName="min-w-[44px] min-h-[44px]"
              >
                <GithubIcon className="w-4 h-4" />
              </LiquidGlassButton>
              <LiquidGlassButton
                href="https://www.linkedin.com/in/osanda623"
                target="_blank"
                rel="noopener noreferrer"
                variant="glass"
                size="icon"
                aria-label="Osanda Hirushaka LinkedIn Profile"
                contentClassName="min-w-[44px] min-h-[44px]"
              >
                <LinkedinIcon className="w-4 h-4" />
              </LiquidGlassButton>
              <LiquidGlassButton
                href="mailto:osandam23@gmail.com"
                variant="glass"
                size="icon"
                aria-label="Email Osanda Hirushaka"
                contentClassName="min-w-[44px] min-h-[44px]"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
              </LiquidGlassButton>
            </div>
          </div>

          {/* Exploration & Systems */}
          <nav aria-label="Outpost and Systems" className="md:col-span-3 md:col-start-7">
            <h2 className="font-subhead text-xs uppercase tracking-wider text-white mb-4">
              Outpost &amp; Systems
            </h2>
            <ul className="space-y-2.5 text-sm font-nav">
              <li>
                <a
                  href="https://phobosia.sim623.site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mars-300 hover:text-white transition-colors inline-flex items-center gap-1 py-1"
                >
                  <span>Open 3D Outpost</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link href="/missions" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  SOL 1 to 11 Campaign
                </Link>
              </li>
              <li>
                <Link href="/models" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  3D Outpost Architecture
                </Link>
              </li>
              <li>
                <Link href="/experience" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  Physical Console Systems
                </Link>
              </li>
              <li>
                <Link href="/science" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  NASA HiRISE Terrain Data
                </Link>
              </li>
            </ul>
          </nav>

          {/* Project Dossier & Attribution */}
          <nav aria-label="Dossier and Credits" className="md:col-span-3">
            <h2 className="font-subhead text-xs uppercase tracking-wider text-white mb-4">
              Dossier &amp; Credits
            </h2>
            <ul className="space-y-2.5 text-sm font-nav">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  About PHOBOSIA
                </Link>
              </li>
              <li>
                <Link href="/development" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  Engineering &amp; Tech Stack
                </Link>
              </li>
              <li>
                <Link href="/story" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  Astronaut Carl Ashwindu
                </Link>
              </li>
              <li>
                <Link href="/creator" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  Osanda Hirushaka
                </Link>
              </li>
              <li>
                <Link href="/credits" className="text-slate-300 hover:text-white transition-colors inline-block py-1">
                  3D Asset Credits (CC BY 4.0)
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>2026 PHOBOSIA. Conceived and developed by Osanda Hirushaka.</p>
          <nav aria-label="Footer Quick Links" className="flex items-center gap-5 font-nav">
            <Link href="/credits" className="hover:text-white transition-colors py-1">
              Asset Attribution
            </Link>
            <Link href="/science" className="hover:text-white transition-colors py-1">
              NASA Data Citations
            </Link>
            <a
              href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white inline-flex items-center gap-1 transition-colors py-1"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
