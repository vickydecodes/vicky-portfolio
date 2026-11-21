import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ArrowUpRight,
  Send,
  Loader2,
  BookOpen,
  Film,
  Compass,
  Download,
  Copy,
  Check,
} from "lucide-react";
import StackIcon from "src/components/StackIcon";
import Reveal from "src/components/Reveal";
import SpotlightRow from "src/components/SpotlightRow";
import ScrollText from "src/components/ScrollText";
import LightUp from "src/components/LightUp";
import { playPop } from "src/lib/sound";

import {
  FaGithub as Github,
  FaLinkedin as Linkedin,
  FaXTwitter as Twitter,
  FaInstagram as Instagram,
} from "react-icons/fa6";
import emailjs from "@emailjs/browser";
import { Badge } from "src/components/ui/badge";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { Button } from "src/components/ui/button";

import {
  meta,
  dataabout,
  dataportfolio,
  worktimeline,
  skills as skillsData,
  beyondProfession,
  contactConfig,
  socialprofils,
} from "src/lib/data";

const skillIcons: Record<string, string> = {
  "javascript": "js",
  "typescript": "typescript",
  "react / next.js": "reactjs",
  "node.js": "nodejs",
  "express.js": "expressjs",
  "mongodb": "mongodb",
  "rest api architecture": "postman",
  "authentication & authorization": "auth0",
  "tailwind css": "tailwindcss",
  "css / responsive design": "css3",
  "git & github": "git",
  "firebase": "firebase",
  "docker": "docker",
  "deployment (vercel / render / vps)": "vercel",
  "system design (small–mid scale apps)": "aws"
};

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [formMessage, setFormMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [istTime, setIstTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  useEffect(() => {
    const updateClock = () => {
      setIstTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };
    const id = window.setInterval(updateClock, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = formData.get("user_name") as string;
    const email = formData.get("user_email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      setFormStatus("error");
      setFormMessage("please fill out all fields first.");
      return;
    }

    setIsSending(true);
    setFormStatus("idle");

    try {
      const templateParams = {
        from_name: name,
        from_email: email,
        name,
        email,
        message,
      };

      const response = await emailjs.send(
        contactConfig.YOUR_SERVICE_ID,
        contactConfig.YOUR_TEMPLATE_ID,
        templateParams,
        contactConfig.YOUR_PUBLIC_KEY,
      );

      console.log("SUCCESS:", response);

      setIsSending(false);
      setFormStatus("success");
      setFormMessage("ping received. talk soon.");
      formRef.current?.reset();
    } catch (error) {
      console.error("FAILED:", error);

      setIsSending(false);
      setFormStatus("error");
      setFormMessage("transmit failed. let's try hello@vickify.in instead.");
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(contactConfig.YOUR_EMAIL);
    playPop();
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 1800);
  };

  // Showcase first 3 projects on home page
  const featuredBuilds = dataportfolio.slice(0, 3);

  // Unified crisp heading style
  const headingClass =
    "font-sans font-semibold text-[16px] sm:text-[17px] tracking-[-0.02em] text-foreground lowercase border-b border-border/60 pb-2";

  return (
    <div className="flex flex-col gap-14 md:gap-16 mt-2">
      {/* Intro Header Section (Grouped for Chennai hover highlight) */}
      <section data-figma-node="hero" className="group/header select-none">
        <div className="flex justify-between items-start gap-3">
          <h1 className="font-sans italic font-medium text-[26px] sm:text-[28px] tracking-[-0.03em] leading-tight lowercase">
            <span className="linear-sheen pr-1">vicky</span>{" "}
            <span
              data-hero-tilde
              className="inline-block text-muted-foreground/75 not-italic"
            >
              ~
            </span>
          </h1>

          <div className="text-right font-sans text-xs select-none shrink-0 space-y-0.5 pt-0.5">
            <p className="text-muted-foreground/70 group-hover/header:text-foreground transition-colors duration-300">
              சென்னை
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/90 tracking-[-0.01em] group-hover/header:text-foreground transition-colors duration-300">
              chennai, india
            </p>
            <div className="inline-flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted-foreground/75 tabular-nums pt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>{istTime} ist</span>
            </div>
          </div>
        </div>

        {/* Full-width role tags + resume row (never squished on mobile) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 select-none font-mono text-[11px] leading-none">
          <span className="border border-border/70 rounded-md px-2 py-1 text-muted-foreground bg-foreground/[0.025] hover:text-foreground hover:border-foreground/20 transition-all duration-200">
            fullstack
          </span>
          <span className="border border-border/70 rounded-md px-2 py-1 text-muted-foreground bg-foreground/[0.025] hover:text-foreground hover:border-foreground/20 transition-all duration-200">
            systems
          </span>
          <span className="border border-border/70 rounded-md px-2 py-1 text-muted-foreground bg-foreground/[0.025] hover:text-foreground hover:border-foreground/20 transition-all duration-200">
            apis
          </span>
          <span className="border border-border/70 rounded-md px-2 py-1 text-muted-foreground bg-foreground/[0.025] hover:text-foreground hover:border-foreground/20 transition-all duration-200">
            web
          </span>
          <span className="border border-border/70 rounded-md px-2 py-1 text-muted-foreground bg-foreground/[0.025] hover:text-foreground hover:border-foreground/20 transition-all duration-200">
            mobile
          </span>
          <a
            href="/vignesh_k_resume.pdf"
            download="vignesh_k_resume.pdf"
            className="border border-foreground/20 rounded-md px-2.5 py-1 text-foreground bg-foreground/[0.04] hover:bg-foreground hover:text-background transition-all duration-200 active:scale-[0.97] font-medium inline-flex items-center gap-1.5 cursor-pointer"
            title="download resume"
          >
            <Download className="h-3 w-3 shrink-0" />
            <span>resume.pdf</span>
          </a>
        </div>
        <div className="pt-6 space-y-4">
          <ScrollText
            text={meta.description.toLowerCase()}
            className="leading-[1.72] font-sans text-[15px] md:text-[16px] max-w-lg"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted-foreground select-none">
            <span className="inline-flex items-center gap-1.5 text-foreground/85">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              fde @ rr donnelley
            </span>
            <span className="text-border">·</span>
            <span>watching: one piece</span>
          </div>
        </div>
      </section>

      {/* Current Section */}
      <section data-figma-node="current" className="space-y-3.5">
        <LightUp>
          <h2 className={headingClass}>current</h2>
        </LightUp>
        <div className="space-y-3 text-[15px] md:text-[16px] leading-[1.75] font-sans lowercase">
          <ScrollText
            text="forward deployed engineer (fde) at rr donnelley, building end-to-end applications from database architecture to interface code. working across client-side logic, rest api engines, and infrastructure deployments."
          />
          <ScrollText
            text="pursued a bachelor of computer applications at gurunanak college. also probably thinking about one piece right now."
          />
        </div>
      </section>

      {/* About Section */}
      <section data-figma-node="about" className="space-y-3.5">
        <LightUp>
          <h2 className={headingClass}>{dataabout.title.toLowerCase()}</h2>
        </LightUp>
        <ScrollText
          text={dataabout.aboutme.toLowerCase()}
          className="text-[15px] md:text-[16px] leading-[1.75] font-sans lowercase"
        />
      </section>

      {/* Skills Section */}
      <section data-figma-node="skills" className="space-y-3.5">
        <LightUp>
          <h2 className={headingClass}>skills</h2>
        </LightUp>
        <div className="flex flex-wrap gap-2 pt-0.5">
          {skillsData.map((skill, index) => {
            const icon = skillIcons[skill.name.toLowerCase()];
            const floatClass = `animate-pet-float-${(index % 4) + 1}`;
            const hoverClass = index % 2 === 0 ? "hover-pet-jump" : "hover-pet-wiggle";
            return (
              <LightUp key={skill.name} as="span" delay={Math.min(index * 28, 340)}>
                <Badge
                  variant="outline"
                  className="bg-foreground/[0.025] border-border/70 text-foreground/90 hover:border-foreground/20 hover:bg-foreground/[0.05] hover:text-foreground transition-all duration-200 font-sans font-normal text-[12.5px] tracking-[-0.01em] py-1 px-2.5 rounded-md lowercase shadow-none flex items-center gap-2 cursor-default group"
                >
                  {icon ? (
                    <StackIcon
                      name={icon}
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${floatClass} ${hoverClass} group-hover:scale-110`}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                  )}
                  {skill.name.toLowerCase()}
                </Badge>
              </LightUp>
            );
          })}
        </div>
      </section>

      {/* Experience Section */}
      <section data-figma-node="previous" className="space-y-3.5">
        <LightUp>
          <h2 className={headingClass}>previous</h2>
        </LightUp>
        <div className="divide-y divide-border/50 font-sans text-[14px] lowercase">
          {worktimeline.map((exp, idx) => (
            <LightUp key={exp.jobtitle + exp.where + exp.date} delay={idx * 55}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2.5 first:pt-1">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                  <p className="text-muted-foreground tracking-[-0.01em]">
                    <span className="font-medium text-foreground">
                      {exp.where.toLowerCase()}
                    </span>{" "}
                    <span className="text-muted-foreground/50 mx-1">·</span>{" "}
                    {exp.jobtitle.toLowerCase()}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground/75 tabular-nums pl-6 sm:pl-0">
                  {exp.date}
                </span>
              </div>
            </LightUp>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      <Reveal>
        <section data-figma-node="featured builds" className="space-y-3.5">
          <LightUp>
            <div className="flex justify-between items-baseline select-none border-b border-border/60 pb-2">
              <h2 className="font-sans font-semibold text-[16px] sm:text-[17px] tracking-[-0.02em] text-foreground lowercase">
                featured builds
              </h2>
              <Link
                to="/projects"
                className="text-[12px] font-sans text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5"
              >
                view all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </LightUp>
          <div className="divide-y divide-border/50">
            {featuredBuilds.map((build, idx) => {
              const parts = build.description.split(" – ");
              const title = parts[0];
              const subtitle = parts[1] || build.description;
              return (
                <SpotlightRow
                  key={build.description}
                  href={build.link}
                  className="lowercase"
                >
                  <LightUp delay={idx * 45}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-medium text-[14.5px] tracking-[-0.015em] text-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1 w-fit">
                        {title}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                      </span>
                      <div className="flex flex-wrap gap-1.5 select-none">
                        {build.tech.map((t) => (
                          <span
                            key={t}
                            className="text-[10.5px] font-mono text-muted-foreground border border-border/70 px-1.5 py-0.5 rounded-md bg-foreground/[0.02] lowercase"
                          >
                            {t.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </LightUp>
                  <ScrollText
                    text={subtitle}
                    className="mt-1.5 text-[14px] font-sans leading-[1.68]"
                  />
                </SpotlightRow>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* Beyond Profession Section */}
      <Reveal>
        <section data-figma-node="beyond profession" className="space-y-4">
          <LightUp>
            <h2 className={headingClass}>beyond profession</h2>
          </LightUp>
          <div className="space-y-4 lowercase font-sans">
            {beyondProfession.map((bp, idx) => (
              <div key={bp.title} className="space-y-1">
                <LightUp delay={idx * 50}>
                  <h3 className="font-sans text-foreground font-medium tracking-[-0.015em] inline-flex items-center gap-2 text-[14px]">
                    {bp.title === "Anime" && (
                      <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    {bp.title === "Movies" && (
                      <Film className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    {bp.title === "Reading" && (
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    {bp.title.toLowerCase()}
                  </h3>
                </LightUp>
                <ScrollText
                  text={bp.description.toLowerCase()}
                  className="text-[15px] md:text-[16px] font-sans leading-[1.72]"
                />
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Contact Section */}
      <Reveal>
        <section data-figma-node="ping contact" className="space-y-4">
          <LightUp>
            <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 select-none">
              <h2 className="font-sans font-semibold text-[16px] sm:text-[17px] tracking-[-0.02em] text-foreground lowercase">
                ping contact
              </h2>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-foreground/[0.025] hover:bg-foreground/[0.06] hover:border-foreground/20 px-2.5 py-1 font-mono text-[11px] text-foreground/80 hover:text-foreground transition-all active:scale-[0.97] cursor-pointer"
                title="copy email"
              >
                {copiedEmail ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500">copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                    <span>{contactConfig.YOUR_EMAIL}</span>
                  </>
                )}
              </button>
            </div>
          </LightUp>
          <div className="space-y-5 text-[14.5px] lowercase">
            <ScrollText
              text="send an email directly to my inbox. i typically respond within 24 hours."
              className="font-sans leading-[1.68]"
            />

            <form
              ref={formRef}
              onSubmit={handleSendEmail}
              className="space-y-3.5 w-full font-sans text-[13px]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-[12px] font-medium select-none">
                    name
                  </span>
                  <Input
                    name="user_name"
                    placeholder="your name"
                    className="bg-foreground/[0.02] border border-border/70 hover:border-foreground/20 focus-visible:ring-0 focus-visible:border-foreground/35 rounded-md py-2 px-3 lowercase text-[13.5px] w-full shadow-none placeholder:text-muted-foreground/50 focus-visible:outline-none transition-colors duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-[12px] font-medium select-none">
                    email
                  </span>
                  <Input
                    type="email"
                    name="user_email"
                    placeholder="your email"
                    className="bg-foreground/[0.02] border border-border/70 hover:border-foreground/20 focus-visible:ring-0 focus-visible:border-foreground/35 rounded-md py-2 px-3 lowercase text-[13.5px] w-full shadow-none placeholder:text-muted-foreground/50 focus-visible:outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-[12px] font-medium select-none">
                  message
                </span>
                <Textarea
                  name="message"
                  placeholder="write message here..."
                  rows={3}
                  className="bg-foreground/[0.02] border border-border/70 hover:border-foreground/20 focus-visible:ring-0 focus-visible:border-foreground/35 rounded-md py-2 px-3 lowercase text-[13.5px] w-full shadow-none resize-none placeholder:text-muted-foreground/50 focus-visible:outline-none transition-colors duration-200"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <Button
                  type="submit"
                  disabled={isSending}
                  className="bg-foreground text-background font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-[13px] py-2 px-4 rounded-md flex items-center gap-1.5 w-fit lowercase cursor-pointer shadow-none"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> sending
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> send message
                    </>
                  )}
                </Button>
              </div>

              {formStatus !== "idle" && (
                <div
                  className={`mt-3 p-3 rounded-md border font-mono text-xs lowercase ${formStatus === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25"
                    }`}
                >
                  {formStatus === "success"
                    ? `// success: ${formMessage}`
                    : `// error: ${formMessage}`}
                </div>
              )}
            </form>

            {/* Social Links Row */}
            <div className="flex items-center gap-5 pt-5 border-t border-border/60 w-full select-none">
              <a
                href={socialprofils.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-200"
                aria-label="github profile"
              >
                <Github className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-200" />
              </a>
              <a
                href={socialprofils.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-200"
                aria-label="linkedin profile"
              >
                <Linkedin className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-200" />
              </a>
              <a
                href={socialprofils.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-200"
                aria-label="x profile"
              >
                <Twitter className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-200" />
              </a>
              <a
                href={socialprofils.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-200"
                aria-label="instagram profile"
              >
                <Instagram className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-200" />
              </a>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
