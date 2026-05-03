import Link from "next/link";

/*
const rLogoPath = "/img/layout/Reddit.png";
const dLogoPath = "/img/layout/Discord.png";
const gLogoPath = "/img/layout/GitHub.png";
*/

const footerLinks1 = [
  { text: "About us", href: "/about" },
  { text: "Terms of Use", href: "/terms" },
  { text: "Donations", href: "/donations" },
];

/*
const footerLinks2 = [
  { imgSrc: rLogoPath, imgAlt: "Reddit Logo", href: "/" },
  { imgSrc: dLogoPath, imgAlt: "Discord Logo", href: "/" },
  {
    imgSrc: gLogoPath,
    imgAlt: "GitHub Logo",
    href: "https://github.com/warsWorld/WarsWorld/",
  },
];
*/

export function Footer() {
  return (
    <footer className="tw:absolute tw:left-0 tw:bottom-0 tw:w-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:bg-linear-to-t tw:from-black tw:pb-5">
      <nav className="tw:flex tw:gap-8">
        {footerLinks1.map((item) => (
          <Link
            className="@text-base-a @text-md tw:cellphone:text-lg tw:smallscreen:text-2xl tw:text-primary tw:hover:text-primary tw:hover:scale-105"
            key={item.text}
            href={item.href}
          >
            {item.text}
          </Link>
        ))}
      </nav>

      {/*<nav className="tw:flex tw:justify-center tw:gap-8">
        {footerLinks2.map((item) => (
          <Link
            className="tw:h-8"
            key={item.imgAlt}
            href={item.href}
            target="_blank"
            rel="noreferrer"
          >
            <img src={item.imgSrc} alt={item.imgAlt} />
          </Link>
        ))}
      </nav>*/}

      <p className="tw:text-center @text-base-p tw:p-0 tw:mx-1">
        Advance Wars is (c) 1990-2001 Nintendo and (c) 2001 Intelligent Systems. All images are
        copyright of their respective owners.
      </p>
    </footer>
  );
}
