import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import SquareButton from "../layout/SquareButton";
import ErrorSuccessBlock from "../layout/forms/ErrorSuccessBlock";
import FormInput from "../layout/forms/FormInput";

interface Props {
  onLoginSuccess: () => Promise<void>;
}

export default function LoginForm({ onLoginSuccess }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginData, setLoginData] = useState({
    user: "",
    password: "",
  });
  const [error, setError] = useState({
    isError: false,
    message: "",
  });
  const errorParam = searchParams.get("error");
  const isProviderCallback = errorParam == "Callback";
  const isProtectionError = errorParam == "ProtectedPage";
  const isOAuthAccountNotLinked = errorParam == "OAuthAccountNotLinked";

  useEffect(() => {
    if (isProviderCallback) {
      setError({
        isError: true,
        message: "Error trying to login with that provider.",
      });
    }

    if (isOAuthAccountNotLinked) {
      setError({
        isError: true,
        message: "There is already an user with that email",
      });
    }

    if (isProtectionError) {
      setError({
        isError: true,
        message: "You must be logged in to access this page.",
      });
    }
  }, [isOAuthAccountNotLinked, isProviderCallback, isProtectionError]);

  const onChangeGenericHandler = (identifier: string, value: string) => {
    setLoginData((prevData) => ({
      ...prevData,
      [identifier]: value,
    }));
  };

  const onSubmitLoginForm = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      const loginResponse = await signIn("credentials", {
        name: loginData.user,
        password: loginData.password,
        redirect: false,
      });

      if (!loginResponse) {
        setError({
          isError: true,
          message: "Couldn't connect to the server.",
        });
        throw new Error("Couldn't connect to the server.");
      }

      if (loginResponse.status === 401) {
        setError({
          isError: true,
          message: "User or password are incorrect",
        });
        throw new Error("User or password are incorrect");
      }

      if (loginResponse.ok) {
        setError({
          isError: false,
          message: "",
        });

        void onLoginSuccess().then(() => {
          router.reload();
        });
      }
    } catch {}
  };

  return (
    <>
      {error.isError && <ErrorSuccessBlock isError title={error.message} />}

      <form
        onSubmit={(event) => {
          void onSubmitLoginForm(event);
        }}
        className="tw:flex tw:flex-col tw:gap-2 tw:smallscreen:gap-6"
      >
        <FormInput
          key="li_user"
          text="Username:"
          id="username"
          type="text"
          value={loginData.user}
          onChange={(event) => {
            onChangeGenericHandler("user", event.target.value);
          }}
        />
        <FormInput
          key="li_password"
          text="Password:"
          id="password"
          type="password"
          value={loginData.password}
          onChange={(event) => {
            onChangeGenericHandler("password", event.target.value);
          }}
        />
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:pt-4 tw:px-10">
          <div className="tw:w-[80vw] tw:smallscreen:w-96 tw:h-16 tw:text-3xl tw:my-2">
            <SquareButton>Login</SquareButton>
          </div>
        </div>
      </form>
    </>
  );
}
