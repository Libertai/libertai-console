// Router-level error boundary: rendered by defaultErrorComponent when a route throws during
// render/load. Must not rely on router context (useNavigate/useRouter etc.) — that context may be
// exactly what's broken. A full page reload is the one recovery path guaranteed to work.
import { Button } from "@/components/ui/button.tsx";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const ErrorPage = ({ error }: ErrorComponentProps) => {
	if (import.meta.env.DEV) {
		console.error(error);
	}

	return (
		<div className="container flex flex-col items-center justify-center min-h-[80vh] max-w-md text-center mx-auto px-4 py-16">
			<div className="space-y-6">
				<div className="space-y-2">
					<h2 className="text-2xl font-bold tracking-tight">Something went wrong.</h2>
					<p className="text-muted-foreground">
						An unexpected error occurred. Reloading the page usually fixes it.
					</p>
				</div>
				<div className="flex justify-center">
					<Button onClick={() => window.location.reload()}>Reload page</Button>
				</div>
			</div>
		</div>
	);
};
