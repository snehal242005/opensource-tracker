import Logo from "./Logo";
import AuthIllustration from "./AuthIllustration";
import PipelineRail from "./PipelineRail";

export default function AuthLayout({ title, subtitle, children, footer, variant = "login" }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <AuthIllustration variant={variant} />

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Logo className="h-10 w-10" />
            <h1 className="font-heading text-2xl font-semibold text-paper">{title}</h1>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>

          <div className="mb-6 lg:hidden">
            <PipelineRail compact />
          </div>

          <div className="card p-6 sm:p-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
