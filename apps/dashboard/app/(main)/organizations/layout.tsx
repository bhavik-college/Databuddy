import { OrganizationProvider } from './components/organization-provider';

export default function Organizations2Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <OrganizationProvider>{children}</OrganizationProvider>;
}
