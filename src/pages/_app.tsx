"use client";
import { Layout } from "frontend/components/layout";
import { ProvidePlayers } from "frontend/context/players";
import "frontend/styles/global.css";
import { trpc } from "frontend/utils/trpc-client";
import type { AppType } from "next/app";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
  return (
    <>
      <Head>
        <title>Wars World</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
      </Head>
      <ProvidePlayers>
        <Layout footer>
          <Component {...pageProps} />
        </Layout>
      </ProvidePlayers>
    </>
  );
};

export default trpc.withTRPC(MyApp);
