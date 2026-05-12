import Head from "next/head";
import BasicHome from "./home/BasicHome";

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>Home Page | Wars World</title>
      </Head>
      <BasicHome />
    </>
  );
}
