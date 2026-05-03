import { useRouter } from "next/router";
import SquareButton from "./SquareButton";

interface buttonData {
  text: string;
  link: string;
}

export default function ThreeLinesText(props: {
  subtitle: string;
  title: string;
  text: string;
  button?: buttonData[];
}) {
  const router = useRouter();
  const buttonArray: React.ReactElement[] = [];

  if (props.button) {
    props.button.forEach((buttonItem: buttonData) =>
      buttonArray.push(
        <div className="" key={buttonItem.text}>
          <SquareButton onClick={() => void router.push(buttonItem.link)}>
            {buttonItem.text}
          </SquareButton>
        </div>,
      ),
    );
  }

  return (
    <div className="tw:text-center tw:pt-10 tw:pb-6">
      <h2 className="tw:font-light">{props.subtitle}</h2>
      <h1>
        <strong>{props.title}</strong>
      </h1>
      <p>{props.text}</p>
      <div className="tw:flex tw:justify-center tw:mt-4 tw:gap-2">{buttonArray}</div>
    </div>
  );
}
