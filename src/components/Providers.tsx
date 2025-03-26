import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "./ui/sonner";

type ProvidersProps = {
	children: ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
	return (
		<ThemeProvider defaultTheme="system" storageKey="libertai-ui-theme">
			<ThirdwebProvider>{children}</ThirdwebProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
};

export default Providers;
