import Banner from "frontend/components/layout/Banner";
import PlayButton from "frontend/components/layout/PlayButton";
import SmallContainer from "frontend/components/layout/SmallContainer";
import ThreeLinesText from "frontend/components/layout/ThreeLinesText";
import Image from "next/image";
import { useRouter } from "next/router";

const homePageCards = [
  {
    image: "matchContainer",
    alt: "Grimm challenging you in the road",
    title: "Matchmaking",
    text: "Connect instantly with opponents of your skill level, immersing yourself in thrilling battles and ensuring a competitive experience.",
  },
  {
    image: "rivalContainer",
    alt: "Eagle versus Andy, classic rivals",
    title: "Competition",
    text: "Engage in dynamic global clashes, rise through the ranks, and showcase your skills in adrenaline-pumping challenges.",
  },
  {
    image: "creativeContainer",
    alt: "Jugger chilling with a tie in the beach",
    title: "Creativity",
    text: "Personalize your experience, with customizable CO portraits, color schemes, and gameplay preferences. Play your way.",
  },
];

export default function BasicHome() {
  const router = useRouter();
  return (
    <div className="tw:w-full">
      <Banner
        title={
          <div className="tw:flex tw:flex-col tw:w-full tw:h-full tw:items-center tw:justify-center tw:smallscreen:items-start tw:smallscreen:mx-[5vw]">
            <div className="tw:flex tw:flex-col tw:items-center">
              <div className="tw:flex tw:items-center tw:mb-8 tw:smallscreen:mb-12 tw:laptop:mb-24 tw:space-x-6 tw:smallscreen:space-x-12 tw:h-auto">
                <Image
                  className="tw:w-16 tw:cellphone:w-24 tw:smallscreen:w-36 tw:monitor:w-48"
                  src="/img/layout/logo.webp"
                  alt="AW Logo"
                  width={0}
                  height={0}
                  sizes="100vw"
                />
                <h1 className="tw:text-[1.2rem] tw:cellphone:text-[2rem] tw:smallscreen:text-7xl tw:laptop:text-8xl tw:monitor:text-9xl @font-russoOne">
                  WARSWORLD
                </h1>
              </div>
              <PlayButton
                onClick={() => {
                  void router.push("/your-matches");
                }}
              >
                PLAY NOW
              </PlayButton>
            </div>
          </div>
        }
        backgroundURL="/img/layout/homeBanner/Banner.jpg"
      />
      <div className="tw:my-1 tw:tablet:my-4">
        <ThreeLinesText
          subtitle="The Timeless Classic"
          title="Renewed"
          text="The best-turn based strategy game optimized!"
        />
      </div>
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-8 tw:mx-8 tw:my-8 tw:laptop:flex-row">
        {homePageCards.map((item) => (
          <SmallContainer
            key={item.image}
            image={item.image}
            alt={item.alt}
            title={item.title}
            text={item.text}
          />
        ))}
      </div>
      <div className="tw:mb-16">
        <ThreeLinesText
          subtitle="1v1, Teamgames or FFA"
          title="There is a Space for You"
          text="Whether you want to be hardcore or play fun crazy maps"
          button={[
            { text: "Play Now", link: "/your-matches" },
            { text: "Learn to Play", link: "/howtoplay" },
          ]}
        />
      </div>
    </div>
  );
}
