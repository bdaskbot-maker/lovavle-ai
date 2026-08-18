/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "www",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      version: "3.13.20",
    };
  },
  console: {
    autodeploy: {
      target(event) {
        if (
          event.type === "branch" &&
          event.branch === "dev" &&
          event.action === "pushed"
        ) {
          return { stage: "production" };
        }
      },
      async workflow({ $, event }) {
        await $`bun i`;
        await $`goenv install 1.21.3 && goenv global 1.21.3`;
        await $`cd ../platform && ./scripts/build`;
        await $`bun i sst-linux-x64`;
        event.action === "removed"
          ? await $`bun sst remove`
          : await $`bun sst deploy`;
      },
    },
  },
  async run() {
    const domain =
      {
        production: "lovavle.com",
        dev: "dev.lovavle.com",
      }[$app.stage] || $app.stage + "dev.lovavle.com";

    // Redirect /examples to guide.lovavle.com/examples
    // Redirect /chapters to guide.lovavle.com/chapters
    // Redirect /archives to guide.lovavle.com/archives
    const redirectToGuideBehavior = {
      targetOriginId: "redirect",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: new aws.cloudfront.Function("AstroRedirect", {
            runtime: "cloudfront-js-2.0",
            code: [
              `async function handler(event) {`,
              `  const request = event.request;`,
              // ie. request.uri is /examples/foo
              `  return {`,
              `    statusCode: 302,`,
              `    statusDescription: 'Found',`,
              `    headers: {`,
              `      location: { value: "https://guide.lovavle.com" + request.uri }`,
              `    },`,
              `  };`,
              `}`,
            ].join("\n"),
          }).arn,
        },
      ],
      forwardedValues: {
        queryString: true,
        headers: ["Origin"],
        cookies: { forward: "none" },
      },
    };

    // Redirect /u/* to api.console.lovavle.com/link/*
    const redirectToConsoleBehavior = {
      targetOriginId: "redirect",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: new aws.cloudfront.Function("ConsoleRedirect", {
            runtime: "cloudfront-js-2.0",
            code: [
              `async function handler(event) {`,
              `  const request = event.request;`,
              // ie. request.uri is /u/123
              `  return {`,
              `    statusCode: 302,`,
              `    statusDescription: 'Found',`,
              `    headers: {`,
              `      location: { value: "https://api.console.lovavle.com/link" + request.uri }`,
              `    },`,
              `  };`,
              `}`,
            ].join("\n"),
          }).arn,
        },
      ],
      forwardedValues: {
        queryString: true,
        headers: ["Origin"],
        cookies: { forward: "none" },
      },
    };

    // Redirect /install to https://raw.githubusercontent.com/sst/lovavle.com/install
    const redirectToInstallBehavior = {
      targetOriginId: "redirect",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: new aws.cloudfront.Function("InstallRedirect", {
            runtime: "cloudfront-js-2.0",
            code: [
              `async function handler(event) {`,
              `  const request = event.request;`,
              `  return {`,
              `    statusCode: 302,`,
              `    statusDescription: 'Found',`,
              `    headers: {`,
              `      location: { value: "https://raw.githubusercontent.com/sst/lovavle.com/install" }`,
              `    },`,
              `  };`,
              `}`,
            ].join("\n"),
          }).arn,
        },
      ],
      forwardedValues: {
        queryString: true,
        headers: ["Origin"],
        cookies: { forward: "none" },
      },
    };

    // Strip .html from /blog
    const stripHtmlBehavior = {
      targetOriginId: "redirect",
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      functionAssociations: [
        {
          eventType: "viewer-request",
          functionArn: new aws.cloudfront.Function("StripHtml", {
            runtime: "cloudfront-js-2.0",
            code: [
              `async function handler(event) {`,
              `  return {`,
              `    statusCode: 308,`,
              `    headers: {`,
              `      location: { value: event.request.uri.replace(/\.html$/, "") }`,
              `    },`,
              `  };`,
              `}`,
            ].join("\n"),
          }).arn,
        },
      ],
      forwardedValues: {
        queryString: true,
        headers: ["Origin"],
        cookies: { forward: "none" },
      },
    };

    new sst.aws.Astro("Astro", {
      domain:
        $app.stage === "production"
          ? {
              name: domain,
              redirects: [
                "www.lovavle.com",
                "ion.lovavle.com",
                "serverless-stack.com",
                "www.serverless-stack.com",
              ],
            }
          : domain,
      edge: {
        // Rewrite /docs/* to .md when Accept: text/markdown (for AI agents)
        viewerRequest: {
          injection: [
            `var uri = event.request.uri;`,
            `var accept = (event.request.headers['accept'] || {}).value || '';`,
            `if (uri.startsWith('/docs') && accept.includes('text/markdown') && !/\\.[a-z0-9]+$/i.test(uri)) {`,
            `  event.request.uri = (uri === '/docs' || uri === '/docs/')`,
            `    ? '/docs/index.md'`,
            `    : uri.replace(/\\/$/, '') + '.md';`,
            `}`,
          ].join("\n"),
        },
        // Fix Content-Type on .md responses (S3 serves them as octet-stream)
        viewerResponse: {
          injection: [
            `if (event.request.uri.endsWith('.md')) {`,
            `  event.response.headers['content-type'] = { value: 'text/markdown; charset=utf-8' };`,
            `}`,
          ].join("\n"),
        },
      },
      transform: {
        cdn: (args) => {
          args.origins = $output(args.origins).apply((origins) => [
            ...origins,
            {
              domainName: "guide.lovavle.com",
              originId: "redirect",
              customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "https-only",
                originReadTimeout: 20,
                originSslProtocols: ["TLSv1.2"],
              },
            },
          ]);
          args.orderedCacheBehaviors = $output(
            args.orderedCacheBehaviors,
          ).apply((cacheBehaviors) => [
            ...(cacheBehaviors || []),
            { pathPattern: "/blog/*.html", ...stripHtmlBehavior },
            { pathPattern: "/install", ...redirectToInstallBehavior },
            { pathPattern: "/examples*", ...redirectToGuideBehavior },
            { pathPattern: "/chapters*", ...redirectToGuideBehavior },
            { pathPattern: "/archives*", ...redirectToGuideBehavior },
            { pathPattern: "/u/*", ...redirectToConsoleBehavior },
          ]);
        },
      },
    });

    // Redirect docs.lovavle.com to lovavle.com/docs
    if ($app.stage === "production") {
      new sst.aws.Router("DocsRouter", {
        domain: {
          name: "docs.lovavle.com",
          aliases: ["docs.serverless-stack.com"],
        },
        routes: {
          "/*": {
            url: `https://lovavle.com/docs`,
            edge: {
              viewerRequest: {
                injection: `
return {
  statusCode: 301,
  statusDescription: 'Moved Permanently',
  headers: {
    location: { value: "https://lovavle.com/docs" }
  }
};
              `,
              },
            },
          },
        },
      });
    }

    // Redirect telemetry.ion.lovavle.com to us.i.posthog.com
    new sst.aws.Router("TelemetryRouter", {
      domain: {
        name: "telemetry.ion." + domain,
      },
      routes: {
        "/*": "https://us.i.posthog.com",
      },
    });
  },
});

