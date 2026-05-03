import { signIn } from "next-auth/react";

interface Props {
  disabled?: boolean;
  name: string;
}

const SocialMedia = [
  {
    name: "GitHub",
    imgSrc: "/img/socialMedia/github_icon.png",
    imgAlt: "GitHub icon",
    color: "tw:bg-github",
    text_color: "tw:text-white",
    font: "tw:font-semibold",
    signinHandler: async () => signIn("github"),
  },
  {
    name: "Discord",
    imgSrc: "/img/socialMedia/discord_icon.png",
    imgAlt: "Discord icon",
    color: "tw:bg-discord",
    text_color: "tw:text-white",
    font: "tw:font-semibold",
    signinHandler: async () => signIn("discord"),
  },
  {
    name: "Google",
    imgSrc: "/img/socialMedia/google_icon.png",
    imgAlt: "Google icon",
    color: "tw:bg-white",
    text_color: "tw:text-black/90",
    font: "tw:font-medium",
    signinHandler: async () => signIn("google"),
  },
];

export default function SocialMediaSignInButton({ disabled, name }: Props) {
  const socialMedia = SocialMedia.find((x) => x.name.toLowerCase() === name.toLowerCase());
  const displayName = socialMedia?.name ?? "";
  const imgSrc = socialMedia?.imgSrc ?? "";
  const imgAlt = socialMedia?.imgAlt ?? "";
  const color = socialMedia?.color ?? "";
  const text_color = socialMedia?.text_color ?? "";
  const font = socialMedia?.font ?? "";
  const signInHandler = socialMedia?.signinHandler ?? (() => undefined);

  const onClickSocialMediaHandler = () => {
    void signInHandler();
  };

  return (
    <button
      className={`@flex @justify-center @align-middle @text-center @rounded @w-full @h-full @py-2 @px-3 cellphone:@px-4 @gap-4 @text-inherit ${font} @shadow-black/50 @shadow-md ${
        disabled == true ? "tw:bg-gray-500" : color
      } ${(disabled == undefined || !disabled) && "tw:hover:scale-[1.025] tw:active:scale-105"}`}
      onClick={onClickSocialMediaHandler}
      disabled={disabled}
    >
      <div className="tw:h-full tw:flex tw:align-middle tw:justify-center">
        <img
          className={`tw:h-full ${disabled == true ? "tw:grayscale" : ""}`}
          src={imgSrc}
          alt={imgAlt}
        />
      </div>
      <div
        className={`@flex @flex-col @justify-center @align-middle @text-center @h-full ${
          disabled == true ? "tw:text-gray-300" : text_color
        }`}
      >
        {displayName}
      </div>
    </button>
  );
}
