import { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

type ProvidersProps = {
	children: ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
	return <ThirdwebProvider>{children}</ThirdwebProvider>;
};

export default Providers;
