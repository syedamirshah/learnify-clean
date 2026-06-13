// src/pages/public/MembershipPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import CTAButton from "../../components/public/CTAButton";
import FeatureCard from "../../components/public/FeatureCard";
import PublicSection from "../../components/public/PublicSection";
import SectionHeader from "../../components/public/SectionHeader";
import TrustBadge from "../../components/public/TrustBadge";
import { buildPublicNavItems } from "../../utils/publicNav";
import { buildPaymentChooseUrl } from "../../utils/paymentRedirect";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;
const PAYMENT_LINK = buildPaymentChooseUrl(API);
const SCHOOL_TEMPLATE_URL = "/student_bulk_upload_template.xlsx";

const MembershipPage = () => {
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Pricing (as per your decision)
  const MONTHLY_INDIVIDUAL = 300; // Rs.
  const YEARLY_BASE = MONTHLY_INDIVIDUAL * 12; // 3600
  const YEARLY_INDIVIDUAL = Math.round(YEARLY_BASE * 0.75); // 25% off => 2700

  // Schools discount rules (as requested)
  const SCHOOL_MONTHLY_PER_STUDENT = Math.round(MONTHLY_INDIVIDUAL * 0.75); // 25% off => 225
  const SCHOOL_YEARLY_PER_STUDENT = Math.round(YEARLY_BASE * 0.5); // Annual + school => 50% off => 1800

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserFullName(localStorage.getItem("user_full_name") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
    localStorage.removeItem("user_grade");
    navigate("/", { replace: true });
  };

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);


  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-white text-gray-800">
      <PublicSection className="!py-8 md:!py-10">
        <SectionHeader
          align="left"
          eyebrow="Membership"
          title="Choose a plan that fits you"
          description="Structured practice, instant feedback, and positive recognition — built for students, parents, teachers, and schools."
        />
      </PublicSection>

      <PublicSection muted>
        <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-[#42b72a]">
                Membership
                <span className="text-green-700/60">•</span>
                Grades 1–5
              </div>

              <h2 className="mt-4 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl md:text-5xl">
                Learnify Membership
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg">
                Membership is not just a payment — it’s a learning partnership.
                Students get structured practice, instant feedback, and clear progress
                tracking, supported by positive recognition in a safe and responsible way.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTAButton href={PAYMENT_LINK}>Start Membership</CTAButton>
                <CTAButton to="/signup" variant="secondary">
                  Create Account
                </CTAButton>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <TrustBadge>Instant feedback after quizzes</TrustBadge>
                <TrustBadge>Shining Stars & National Heroes</TrustBadge>
                <TrustBadge>Subject & grade progress tracking</TrustBadge>
                <TrustBadge>Child-safe, privacy-first design</TrustBadge>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm md:p-8">
              <div className="text-sm font-semibold text-[#42b72a]">
                What you’ll get
              </div>
              <div className="mt-3 space-y-3">
                <Bullet title="Learning & Assessment">
                  Exercises (Single Choice / Multiple Choice / Fill-in-the-Blank), a simple one-question flow,
                  and meaningful results.
                </Bullet>
                <Bullet title="Performance Tracking">
                  Subject-level insights + grade-level progress overview.
                </Bullet>
                <Bullet title="Honors & Recognition">
                  Positive recognition through Shining Stars and National Heroes — motivation without shame.
                </Bullet>
                <Bullet title="Responsible Experience">
                  No ads inside quizzes. No public humiliation ranking. Privacy protected.
                </Bullet>
              </div>

              <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="font-bold text-gray-900">Good to know</div>
                <div className="mt-1 text-sm text-gray-600">
                  Visitors can try the first 3 questions of any quiz to experience the quality of content.
                </div>
              </div>
            </div>
        </div>
      </PublicSection>

      <PublicSection>
        <SectionHeader
          align="left"
          eyebrow="Who it's for"
          title="Who is Learnify Membership for?"
          description="Clear, simple learning aligned with officially approved textbooks of Pakistan."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard accent="green" title="Students (Grades 1–5)" description="Curriculum-aligned exercises, instant feedback, progress tracking, and motivation through Shining Stars and National Heroes." />
          <FeatureCard accent="blue" title="Teachers" description="Teachers can view student progress within the school/city setup, assign practice exercises, and track learning outcomes — so class support becomes easier and smarter." />
          <FeatureCard accent="gold" title="Parents (Support role)" description="A practical alternative to private tutoring: learning happens inside a safe home environment, parents can follow the child’s learning outcomes clearly, and the cost stays affordable." />
          <FeatureCard accent="green" title="Schools" description="Schools get an organized learning system for grades 1–5 with discounted plans. Learnify also helps schools set up accounts quickly using a simple template for student and teacher names." />
        </div>
      </PublicSection>

      <PublicSection muted>
          <SectionHeader
            align="left"
            eyebrow="What's included"
            title="What does membership include?"
            description="The core benefits that make Learnify meaningful — not just a quiz website."
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <InfoCard
              title="A) Learning & Assessment"
              items={[
                "Grade-wise exercises (SCQ, MCQ, FIB)",
                "One-question-at-a-time flow (kid-friendly)",
                "Instant feedback at the end of each quiz",
                "Structured attempts and clear results",
                "Teachers can assign exercises to guide practice",
              ]}
            />

            <InfoCard
              title="B) Performance Tracking"
              items={[
                "Subject-level performance overview",
                "Grade-level progress view",
                "Quiz history and attempt insights",
                "Tracking designed for real improvement",
              ]}
            />

            <InfoCard
              title="C) Honors & Recognition"
              items={[
                "Shining Stars and National Heroes",
                "Honor Board display (positive recognition)",
                "Motivation with dignity and encouragement",
              ]}
            />

            <InfoCard
              title="D) Safety & Responsible Design"
              items={[
                "Privacy-first approach",
                "No ads inside quizzes",
                "No harmful public ranking",
                "Ethical recognition and child-safe experience",
              ]}
            />
          </div>
      </PublicSection>

      <PublicSection>
        <SectionHeader
          align="left"
          eyebrow="Plans"
          title="Membership plans & access rules"
          description="Simple, transparent pricing — aligned with Learnify’s subscription logic."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Plans */}
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="text-xl font-extrabold text-gray-900">
              Plans available
            </div>

            <div className="mt-4 space-y-3 text-gray-700">
              <PlanRow
                title={`Monthly (Individual) — Rs. ${MONTHLY_INDIVIDUAL}`}
                desc="Best for starting and trying Learnify regularly."
              />
              <PlanRow
                title={`Yearly (Individual) — Rs. ${YEARLY_INDIVIDUAL}`}
                desc={`Full year access with 25% discount (base Rs. ${YEARLY_BASE}).`}
                highlight
              />
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="text-lg font-extrabold text-gray-900">
                School discounts (100+ students)
              </div>
              <div className="mt-3 space-y-3 text-gray-700">
                <PlanRow
                  title={`Monthly (School) — Rs. ${SCHOOL_MONTHLY_PER_STUDENT} per student`}
                  desc="25% discount for schools with more than 100 students."
                />
                <PlanRow
                  title={`Yearly (School) — Rs. ${SCHOOL_YEARLY_PER_STUDENT} per student`}
                  desc={`Annual + school status gives 50% discount (base Rs. ${YEARLY_BASE}).`}
                  highlight
                />
              </div>

              <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="font-bold text-gray-900">School onboarding support</div>
                <div className="mt-1 space-y-1 text-sm text-gray-600">
                  <p>
                    Learnify helps schools create accounts smoothly. Schools only need to provide
                    teachers’ and students’ names in a simple Excel template — we organize the setup.
                  </p>
                  <p>
                    📎{" "}
                    <a
                      href={SCHOOL_TEMPLATE_URL}
                      download
                      className="font-semibold text-[#42b72a] underline hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                    >
                      Download student upload template
                    </a>{" "}
                    and email the completed sheet to{" "}
                    <a
                      href="mailto:support@learnifypakistan.com"
                      className="font-semibold underline hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                    >
                      support@learnifypakistan.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CTAButton href={PAYMENT_LINK}>Choose a Plan</CTAButton>
              <CTAButton to="/my-profile" variant="secondary">
                View My Profile
              </CTAButton>
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="text-xl font-extrabold text-gray-900">
              Rules & fairness
            </div>

            <ul className="mt-4 space-y-3 text-gray-700">
              <RuleItem
                title="Grade change may be limited"
                desc="To keep learning records consistent, grade change can be restricted (for example, once per year)."
              />
              <RuleItem
                title="Unlimited practice attempts"
                desc="Students can retake quizzes as many times as needed for learning."
              />
              <RuleItem
                title="Latest attempt counts"
                desc="For clarity and simplicity, the system keeps the latest result as the official record."
              />
              <RuleItem
                title="Fresh questions in practice"
                desc="Practice is designed to stay useful — each attempt can bring new questions instead of repeating the same ones."
              />
              <RuleItem
                title="Expiry & renewal"
                desc="Expired users are guided to renew. Extended inactivity may lead to account removal for privacy."
              />
            </ul>
          </div>
        </div>
      </PublicSection>

      <PublicSection muted>
          <SectionHeader
            align="left"
            eyebrow="Safety"
            title="Our commitment to safety & privacy"
            description="Learnify is built for children — dignity and protection come first."
          />

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MiniCard title="Privacy-first">
              Student data is treated as sensitive and protected.
            </MiniCard>
            <MiniCard title="No ads in quizzes">
              Children learn without distractions and manipulative content.
            </MiniCard>
            <MiniCard title="No humiliation ranking">
              Recognition is positive, not shaming.
            </MiniCard>
            <MiniCard title="Learning values">
              “Practicing Math Responsibly” is part of the product design.
            </MiniCard>
            <MiniCard title="Research with care">
              Anonymous learning trends can support research on outcomes across regions,
              school types, language, gender, and more — without exposing identities.
            </MiniCard>
          </div>
      </PublicSection>

      <footer className="border-t border-green-100 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8 md:flex-row md:items-center">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              Ready to begin?
            </div>
            <div className="mt-1 text-gray-600">
              Start with a plan that fits you — and grow with consistent practice.
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto">
            <CTAButton href={PAYMENT_LINK}>Start Membership</CTAButton>
            <CTAButton to="/help-center" variant="secondary">
              Visit Help Center
            </CTAButton>
          </div>
        </div>
      </footer>
      </div>
    </AppLayout>
  );
};

/* ---------- Small UI helpers (no external libs) ---------- */

const InfoCard = ({ title, items }) => (
  <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
    <div className="text-lg font-extrabold text-gray-900">{title}</div>
    <ul className="mt-3 space-y-2 text-gray-600">
      {items.map((t, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#42b72a]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  </div>
);

const MiniCard = ({ title, children }) => (
  <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="mt-1 text-sm text-gray-600">{children}</div>
  </div>
);

const Bullet = ({ title, children }) => (
  <div className="rounded-xl border border-green-100 p-4">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="mt-1 text-gray-600">{children}</div>
  </div>
);

const PlanRow = ({ title, desc, highlight }) => (
  <div
    className={`rounded-xl border p-4 ${
      highlight ? "border-green-100 bg-green-50" : "border-green-100 bg-white"
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="font-extrabold text-gray-900">{title}</div>
      {highlight && (
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
          Recommended
        </span>
      )}
    </div>
    <div className="mt-1 text-sm text-gray-600">{desc}</div>
  </div>
);

const RuleItem = ({ title, desc }) => (
  <li className="rounded-xl border border-green-100 bg-green-50/50 p-4">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="mt-1 text-sm text-gray-600">{desc}</div>
  </li>
);

export default MembershipPage;
