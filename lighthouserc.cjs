module.exports = {
  ci: {
    collect: {
      staticDistDir: "./_site",
      maxAutodiscoverUrls: 10,
      autodiscoverUrlBlocklist: ["/admin.html", "/404.html"],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless=new --no-sandbox"
      }
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.90 }],
        "categories:best-practices": ["error", { minScore: 0.90 }],
        "categories:seo": ["error", { minScore: 0.90 }],
        "categories:performance": ["warn", { minScore: 0.75 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/results"
    }
  }
};
