import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file
class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link
            rel="shortcut icon"
            href="/assets/steak.png"
            type="image/x-icon"
          />
        </Head>
        <body className="font-sans font-normal text-base text-default">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
