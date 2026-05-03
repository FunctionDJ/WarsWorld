import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

export const ProtectPage = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      void router.push(".", {
        pathname: "/.",
        query: `authModalOpen&error=ProtectedPage&callbackUrl=${encodeURIComponent(
          window.location.href,
        )}`,
      });
    },
  });

  if (status === "loading") {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:align-middle tw:justify-center tw:w-full tw:h-[50vh]">
        <div>LOADING . . .</div>
      </div>
    );
  }

  return <>{children}</>;
};
