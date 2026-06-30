import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ArrowUpRight,
  Send,
  Loader2,
  Terminal,
  Code2,
  BookOpen,
  Film,
  Compass,
} from "lucide-react";
import {
  FaGithub as Github,
  FaLinkedin as Linkedin,
  FaTwitter as Twitter,
  FaInstagram as Instagram,
} from "react-icons/fa";
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
  blogs,
  contactConfig,
  socialprofils,
} from "src/lib/data";

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [formMessage, setFormMessage] = useState("");

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

  // Showcase first 3 projects on home page
  const featuredBuilds = dataportfolio.slice(0, 3);

  // Showcase first 2 blogs on home page
  const recentWritings = blogs.slice(0, 2);

  // Unified heading style classes
  const headingClass =
    "font-bold italic font-mono text-base sm:text-lg text-foreground lowercase border-b border-border/10 pb-1.5";

  return (
    <div className="flex flex-col gap-12 md:gap-14">
      {/* Intro Header Section (Grouped for Chennai hover highlight) */}
      <section className="group/header select-none">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <h1 className="font-bold italic font-mono text-lg sm:text-xl md:text-[22px] tracking-tight text-foreground lowercase group-hover/header:text-primary transition-all duration-300">
              vicky ~{" "}
              
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 select-none font-mono text-[10px] sm:text-[11px] leading-none">
              <span className="border border-border/50 rounded-xs px-2 py-0.5 text-muted-foreground bg-secondary/30 hover:text-primary hover:border-primary/30 transition-all duration-200">
                fullstack
              </span>
              <span className="border border-border/50 rounded-xs px-2 py-0.5 text-muted-foreground bg-secondary/30 hover:text-primary hover:border-primary/30 transition-all duration-200">
                systems
              </span>
              <span className="border border-border/50 rounded-xs px-2 py-0.5 text-muted-foreground bg-secondary/30 hover:text-primary hover:border-primary/30 transition-all duration-200">
                apis
              </span>
              <span className="border border-border/50 rounded-xs px-2 py-0.5 text-muted-foreground bg-secondary/30 hover:text-primary hover:border-primary/30 transition-all duration-200">
                web
              </span>
              <span className="border border-border/50 rounded-xs px-2 py-0.5 text-muted-foreground bg-secondary/30 hover:text-primary hover:border-primary/30 transition-all duration-200">
                mobile
              </span>
            </div>
           
          </div>
          
          <div className="text-right font-mono text-xs sm:text-sm select-none shrink-0 space-y-0.5">
            <p className="text-foreground/50 italic font-sans group-hover/header:text-primary transition-colors duration-300">
              சென்னை
            </p>
            <p className="text-foreground/70 group-hover/header:text-foreground transition-colors duration-300">
              Chennai, India
            </p>
          </div>
        </div>
        <div className="w-8/10 pt-5">
             <p className="italic text-foreground/80 leading-normal font-sans text-[15px] sm:text-[16px] max-w-lg">
              {meta.description.toLowerCase()}
            </p>
           </div>
      </section>

      {/* Current Section */}
      <section className="space-y-3">
        <h2 className={headingClass}>current</h2>
        <div className="space-y-3 text-foreground/85 leading-relaxed font-sans lowercase">
          <p>
            founder at{" "}
            <span className="inline-flex align-middle gap-0.5 bg-secondary text-secondary-foreground dark:bg-zinc-800 dark:text-zinc-100 rounded-sm px-1.5 py-0.5 hover:cursor-pointer hover:border-primary/50 transition duration-200 leading-4 font-mono text-xs border border-border">
              <Terminal className="h-3 w-3 shrink-0 self-center text-white animate-pulse" />
              <a
                href="https://github.com/vickydecodes"
                target="_blank"
                rel="noopener"
                className="hover:text-primary transition-colors"
              >
                cookie inc.
              </a>
            </span>
            , building end-to-end applications from database architecture to
            interface code. working across client-side logic, rest api engines,
            and infrastructure deployments.
          </p>
          <p>
            pursued a bachelor of computer applications at gurunanak college.
            also probably thinking about one piece right now.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-3">
        <h2 className={headingClass}>{dataabout.title.toLowerCase()}</h2>
        <p className="text-foreground/85 leading-relaxed font-sans lowercase">
          {dataabout.aboutme.toLowerCase()}
        </p>
      </section>

      {/* Skills Section */}
      <section className="space-y-3">
        <h2 className={headingClass}>skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {skillsData.map((skill) => (
            <Badge
              key={skill.name}
              variant="outline"
              className="bg-secondary/50 dark:bg-card/30 border-border text-foreground hover:border-primary/40 hover:text-primary transition-all duration-200 font-mono text-xs sm:text-[13px] py-0.5 px-2 rounded-sm lowercase shadow-none"
            >
              <Code2 className="h-3 w-3 mr-1 text-primary shrink-0" />
              {skill.name.toLowerCase()}
            </Badge>
          ))}
        </div>
      </section>

      {/* Experience Section */}
      <section className="space-y-3">
        <h2 className={headingClass}>previous</h2>
        <div className="space-y-2.5 font-mono text-xs sm:text-[13px] lowercase">
          {worktimeline.map((exp) => (
            <div
              key={exp.jobtitle + exp.where}
              className="flex items-center justify-start gap-2"
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-foreground/85">
                <span className="font-semibold text-foreground">
                  {exp.where.toLowerCase()}
                </span>{" "}
                ~ {exp.jobtitle.toLowerCase()} [{exp.date}]
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-baseline select-none border-b border-border/10 pb-1.5">
          <h2 className="font-bold italic font-mono text-base sm:text-lg text-foreground lowercase">
            featured builds
          </h2>
          <Link
            to="/projects"
            className="text-xs sm:text-[13px] font-mono lowercase text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            view all projects
          </Link>
        </div>
        <div className="space-y-4">
          {featuredBuilds.map((build) => (
            <div
              key={build.description}
              className="space-y-1.5 text-sm sm:text-[15px] lowercase border-b border-border/10 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-baseline gap-1">
                <a
                  href={build.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-foreground underline hover:text-primary hover:decoration-primary/60 underline-offset-4 transition-all duration-200 inline-flex items-center gap-0.5"
                >
                  {build.description.split(" – ")[0]}
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <div className="flex gap-1 select-none">
                  {build.tech.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[9px] sm:text-[10px] font-mono text-muted-foreground border-border/80 px-1.5 py-0 rounded-sm bg-card/30 lowercase shadow-none"
                    >
                      {t.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-[13px] text-muted-foreground font-sans leading-relaxed">
                {build.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Writings Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-baseline select-none border-b border-border/10 pb-1.5">
          <h2 className="font-bold italic font-mono text-base sm:text-lg text-foreground lowercase">
            recent writings
          </h2>
          <Link
            to="/blog"
            className="text-xs sm:text-[13px] font-mono lowercase text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            read all writings
          </Link>
        </div>
        <div className="space-y-3 font-mono text-xs sm:text-[13px] lowercase">
          {recentWritings.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="w-full grid grid-cols-[6rem_1fr] sm:grid-cols-[6.5rem_1fr] items-baseline gap-2">
                <p className="text-muted-foreground tabular-nums select-none group-hover:text-primary transition-colors">
                  {post.date.toLowerCase()}
                </p>
                <p className="text-foreground tracking-tight underline hover:text-primary hover:decoration-primary/60 underline-offset-4 font-semibold transition-all duration-200">
                  {post.title.toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Beyond Profession Section */}
      <section className="space-y-4">
        <h2 className={headingClass}>beyond profession</h2>
        <div className="space-y-4 lowercase leading-relaxed font-sans text-foreground/85">
          {beyondProfession.map((bp) => (
            <div key={bp.title} className="space-y-1">
              <h3 className="font-mono text-foreground font-bold inline-flex items-center gap-1.5 text-xs sm:text-sm">
                {bp.title === "Anime" && (
                  <Compass className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
                )}
                {bp.title === "Movies" && (
                  <Film className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                {bp.title === "Reading" && (
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                {bp.title.toLowerCase()}
              </h3>
              <p className="text-muted-foreground text-[15px] md:text-[16.5px] font-sans leading-relaxed">
                {bp.description.toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className={headingClass}>ping contact</h2>
        <div className="space-y-4 text-sm sm:text-[15px] lowercase">
          <p className="text-muted-foreground font-sans leading-relaxed">
            send an email directly to my inbox. i typically respond within 24
            hours.
          </p>

          <form
            ref={formRef}
            onSubmit={handleSendEmail}
            className="space-y-4 w-full font-mono text-xs sm:text-[13px]"
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground/65 select-none font-bold">
                name:
              </span>
              <Input
                name="user_name"
                placeholder="your name"
                className="bg-transparent border-0 border-b border-border/40 hover:border-foreground/30 focus-visible:ring-0 focus-visible:border-primary rounded-none py-1.5 px-3 lowercase text-sm w-full shadow-none placeholder:text-foreground/45 focus-visible:outline-none transition-colors duration-250"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-foreground/65 select-none font-bold">
                email:
              </span>
              <Input
                type="email"
                name="user_email"
                placeholder="your email"
                className="bg-transparent border-0 border-b border-border/40 hover:border-foreground/30 focus-visible:ring-0 focus-visible:border-primary rounded-none py-1.5 px-3 lowercase text-sm w-full shadow-none placeholder:text-foreground/45 focus-visible:outline-none transition-colors duration-250"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-foreground/65 select-none font-bold">
                message:
              </span>
              <Textarea
                name="message"
                placeholder="write message here..."
                rows={3}
                className="bg-transparent border-0 border-b border-border/40 hover:border-foreground/30 focus-visible:ring-0 focus-visible:border-primary rounded-none py-2 px-3 lowercase text-sm w-full shadow-none resize-none placeholder:text-foreground/45 focus-visible:outline-none transition-colors duration-250"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <Button
                type="submit"
                disabled={isSending}
                className="bg-foreground text-background font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-xs sm:text-[13px] py-1.5 px-4 rounded-sm flex items-center gap-1.5 w-fit lowercase cursor-pointer shadow-none"
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
                className={`mt-4 p-3 rounded-sm border font-mono text-xs lowercase ${
                  formStatus === "success"
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
          <div className="flex items-center gap-5 pt-4 border-t border-border/10 w-full select-none">
            <a
              href={socialprofils.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200"
              aria-label="github profile"
            >
              <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200" />
            </a>
            <a
              href={socialprofils.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200"
              aria-label="linkedin profile"
            >
              <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200" />
            </a>
            <a
              href={socialprofils.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200"
              aria-label="twitter profile"
            >
              <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200" />
            </a>
            <a
              href={socialprofils.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200"
              aria-label="instagram profile"
            >
              <Instagram className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-200" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
