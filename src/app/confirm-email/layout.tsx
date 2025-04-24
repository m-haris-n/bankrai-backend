import { ReactNode, Suspense } from "react";

export const metadata = {
   title: `Email verified`,
};

export default async function Layout({ children }: { children: ReactNode }) {
   return <Suspense>{children}</Suspense>;
}
