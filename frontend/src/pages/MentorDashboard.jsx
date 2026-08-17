import { useEffect, useMemo, useState } from "react";
import { listPullRequests, listUsers } from "../api";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import PRDetailModal from "../components/PRDetailModal";
import StudentGroup from "../components/StudentGroup";
import StatTile from "../components/StatTile";
import EmptyPRsIllustration from "../components/EmptyPRsIllustration";

export default function MentorDashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const roleLabel = isAdmin ? "Admin" : "Mentor";

  const [prs, setPrs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPr, setSelectedPr] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [prData, userData] = await Promise.all([listPullRequests(), listUsers()]);
      setPrs(prData);
      setStudents(userData.filter((u) => u.role === "student"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const studentsById = useMemo(() => Object.fromEntries(students.map((s) => [s.uid, s])), [students]);

  const sections = useMemo(() => {
    const byStudent = {};
    for (const pr of prs) {
      (byStudent[pr.student_id] ||= []).push(pr);
    }
    return students
      .map((student) => ({ student, prs: byStudent[student.uid] || [] }))
      .sort((a, b) => (a.student.name || "").localeCompare(b.student.name || ""));
  }, [students, prs]);

  const total = prs.length;
  const merged = prs.filter((pr) => pr.stage === "Merged").length;
  const needsReview = prs.filter((pr) => pr.stage === "PR Raised" || pr.stage === "Under Review").length;

  return (
    <PageShell>
      <div>
        <h1 className="font-heading text-2xl font-semibold text-paper">{roleLabel} Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Welcome, {profile?.name}.{" "}
          {isAdmin
            ? "Every student's pull requests, grouped by student."
            : "Your assigned students' pull requests, grouped by student."}
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      {!loading && students.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total PRs"
            value={total}
            accent="signal"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <circle cx="4" cy="3.2" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="4" cy="12.8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="12" cy="12.8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 4.8V11.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M12 11.2V8a3 3 0 0 0-3-3H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
          />
          <StatTile
            label="Merged"
            value={merged}
            accent="grow"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatTile
            label="Needs review"
            value={needsReview}
            accent="pulse"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 4.8V8l2.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatTile
            label="Students"
            value={students.length}
            accent="violet"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 14c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-signal" />
            Loading...
          </div>
        ) : students.length === 0 ? (
          <div className="card flex flex-col items-center border-dashed px-6 py-14 text-center">
            <EmptyPRsIllustration />
            <p className="mt-4 text-sm font-medium text-paper">
              {isAdmin ? "No students yet." : "No students are assigned to you yet."}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {isAdmin
                ? "Once students sign up, they'll show up here."
                : "Once a student picks you as their mentor during signup, they'll show up here."}
            </p>
          </div>
        ) : (
          sections.map(({ student, prs: studentPrs }) => (
            <StudentGroup
              key={student.uid}
              student={student}
              prs={studentPrs}
              onSelectPr={(pr) => setSelectedPr(pr)}
            />
          ))
        )}
      </div>

      {selectedPr && (
        <PRDetailModal
          pr={selectedPr}
          studentName={studentsById[selectedPr.student_id]?.name}
          canGiveFeedback
          onClose={() => setSelectedPr(null)}
          onFeedbackAdded={refresh}
        />
      )}
    </PageShell>
  );
}
