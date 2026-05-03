import { Dialog } from "@headlessui/react";
import { getProviders } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoginForm from "../auth/LoginForm";
import SignupForm from "../auth/SignupForm";
import ErrorSuccessBlock from "../layout/forms/ErrorSuccessBlock";
import SocialMediaSignInButton from "../layout/forms/SocialMediaSignInButton";
import DefaultDialogDesign from "../layout/modal/DefaultDialogDesign";
import SquareButton from "../layout/SquareButton";

const possibleProviders = ["github", "discord", "google"];

interface Props {
  width?: string;
  isOpen: boolean;
  setIsOpen: (value: boolean, callbackUrl?: string) => Promise<void>;
}

export default function LoginSignupModal({ isOpen, setIsOpen, width }: Props) {
  const [currentProviders, setCurrentProviders] =
    useState<Awaited<ReturnType<typeof getProviders>>>();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [didSignUp, setDidSignUp] = useState(false);

  const isSignupForm = searchParams.has("SignUpForm");
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    // NOTE: In production erase all the existing logic related to checking
    // if the providers are correctly configured.
    // This will make a request to check the providers ever refresh.
    void getProviders().then((providers) => {
      setCurrentProviders(providers);
    });
  }, []);

  const setIsSignupForm = async (value: boolean, callbackUrl: string | null) => {
    if (value) {
      await router.replace("", {
        pathname: window.location.pathname,
        query: `authModalOpen&SignUpForm${
          callbackUrl !== null ? "&callbackUrl=" + encodeURIComponent(callbackUrl) : ""
        }`,
      });
    } else {
      await router.replace("", {
        pathname: window.location.pathname,
        query: `authModalOpen${
          callbackUrl !== null ? "&callbackUrl=" + encodeURIComponent(callbackUrl) : ""
        }`,
      });
    }
  };

  const onLoginSuccess = async () => {
    await setIsOpen(false, callbackUrl === null ? undefined : decodeURIComponent(callbackUrl));
  };

  const onClose = () => {
    void setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="tw:relative tw:z-40">
      {isSignupForm ? (
        /* SIGNUP */
        <DefaultDialogDesign title="Signup" width={width ?? "50vw"}>
          <div className="tw:pt-4 tw:smallscreen:pt-8 tw:px-4 tw:smallscreen:px-20">
            {didSignUp && <ErrorSuccessBlock title="Successfully signed up" />}
            <SignupForm
              setIsSignupForm={setIsSignupForm}
              setDidSignUp={setDidSignUp}
              callbackUrl={callbackUrl}
            />
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:pb-6 tw:px-10 tw:gap-2">
              <div className="tw:h-[0.15rem] tw:w-full tw:bg-bg-primary tw:my-2" />
              <p className="tw:text-lg smallscreen:@text">Already have an account?</p>
              <div className="tw:my-2 tw:w-[80vw] tw:smallscreen:w-80 tw:h-14 tw:text-2xl">
                <SquareButton onClick={() => void setIsSignupForm(false, callbackUrl)}>
                  Login
                </SquareButton>
              </div>
            </div>
          </div>
        </DefaultDialogDesign>
      ) : (
        /* LOGIN */
        <DefaultDialogDesign title="Login" width={width ?? "50vw"}>
          <div className="tw:pt-4 tw:smallscreen:pt-8 tw:px-4 tw:smallscreen:px-20">
            {didSignUp && <ErrorSuccessBlock title="Successfully signed up" />}
            <LoginForm onLoginSuccess={onLoginSuccess} />
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:pb-6 tw:smallscreen:px-10 tw:gap-2">
              <Link
                className="tw:my-2 tw:text-xl smallscreen:@text tw:no-underline tw:hover:underline"
                href="."
                onClick={onClose}
              >
                Forgot password?
              </Link>

              <p className="tw:pt-4 tw:text-lg smallscreen:@text">You can also sign in with:</p>
              <div className="tw:flex tw:flex-wrap tw:justify-center tw:w-full tw:gap-4">
                {possibleProviders.map((socialMedia) => (
                  <div
                    key={socialMedia}
                    className="tw:h-14 tw:text-2xl tw:large_monitor:text-3xl tw:w-[75vw] tw:smallscreen:w-48 tw:large_monitor:w-56"
                  >
                    <SocialMediaSignInButton
                      name={socialMedia}
                      disabled={!currentProviders?.[socialMedia]}
                    />
                  </div>
                ))}
              </div>
              <p className="tw:pt-6 tw:text-lg smallscreen:@text tw:text-center">
                Developer note: If you want to sign in with one of these providers, you must follow
                the respective directions on README.md to set it up.
              </p>
              <div className="tw:h-[0.15rem] tw:w-full tw:bg-bg-primary tw:my-2" />
              <p className="tw:text-lg smallscreen:@text">Don&apos;t have an account?</p>
              <div className="tw:my-2 tw:w-[80vw] tw:smallscreen:w-80 tw:h-20 tw:cellphone:h-14 tw:text-2xl">
                <SquareButton onClick={() => void setIsSignupForm(true, callbackUrl)}>
                  Create New Account
                </SquareButton>
              </div>
            </div>
          </div>
        </DefaultDialogDesign>
      )}
    </Dialog>
  );
}
