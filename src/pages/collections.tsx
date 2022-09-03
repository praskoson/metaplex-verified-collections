import type { NextPage } from "next";
import Head from "next/head";
import { CollectionsView } from "views/CollectionsView";
import { transitions, positions, Provider as AlertProvider } from "react-alert";
import AlertTemplate from "react-alert-template-basic";

const options = {
  // you can also just use 'bottom center'
  position: positions.BOTTOM_LEFT,
  timeout: 5000,
  offset: "10px",
  // you can also just use 'scale'
  transition: transitions.SCALE,
  
};

const Collections: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Metaplex Collections!</title>
        <meta name="description" content="This site will fly high 🦤" />
      </Head>
      <AlertProvider template={AlertTemplate} {...options}>
        <CollectionsView />
      </AlertProvider>
    </div>
  );
};

export default Collections;
