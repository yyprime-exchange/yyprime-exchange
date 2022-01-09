import "../App.css";
import "../index.css";

import { AppProps } from "next/app";
import Providers from "Providers";
import React from "react";

import App from "../App";

function NextApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <Providers>
      <App>
        <Component {...pageProps} />
      </App>
    </Providers>
  );
}

export default React.memo(NextApp);
